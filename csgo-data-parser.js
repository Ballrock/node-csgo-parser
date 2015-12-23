'use strict';
/* jshint node: true */

//Correct vdf for little endian handle ?
var vdf = require('vdf'),
	fs = require('fs'),
	winston = require('winston'),
	misc = require('./misc');

/**
 * Hardcoded Exteriors Keys List --> Thx Valve :s.
 * @const {Array}
 * @private
 */
var exteriorsKeysList = ['SFUI_InvTooltip_Wear_Amount_0',
	'SFUI_InvTooltip_Wear_Amount_1',
	'SFUI_InvTooltip_Wear_Amount_2',
	'SFUI_InvTooltip_Wear_Amount_3',
	'SFUI_InvTooltip_Wear_Amount_4'];

/**
 * Regex for Items.
 * @const {RegExp}
 * @private
 */
var regexItem = /\[(.*)\](.*)/i;

/**
 * Regex for Icon.
 * @const {RegExp}
 * @private
  */
var regexIcon = /econ\/default_generated\/(.*)_(light|medium|heavy)$/i;

/**
 * Regex for Check Icon.
 * @const {RegExp}
 * @private
  */
var regexIconCheck = /^(?:_[^_]{2}_)/m;

/**
 * Parser of CSGOData.
 * @param {String} schemaFilePath Path to schema file.
 * @param {String} langFilePath Path to csgo_*lang* file.
 * @param {String} itemsFilePath Path to items_game file.
 * @param {String} logLevel Winston Log Level, if > info no timing data for generation.
 * @param {String} logFilePath Choosen file path to write logs.
 * @constructor 
 *
 * @todo Generalization isDatasInitialized
 * @todo Little Endian ?
 * @todo Items image download (unique method)
 * @todo Generate technical unique id for each datas
 * @todo Retrieve Item Quality
 * @todo Datamining File for more informations
 */
function CSGODataParser(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath) {
	this.schemaFilePath = schemaFilePath;
	this.langFilePath = langFilePath;
	this.itemsFilePath = itemsFilePath;

	this._generateObjectDataFromFiles();

	this.logger = new (winston.Logger)({
	level: logLevel,
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: logFilePath })
    ]
  });
}

/**
 * Generate Javascript Objects from files.
 * @private
 */
CSGODataParser.prototype._generateObjectDataFromFiles = function() {
	// ---- LANG FILE ---
	var langFile = fs.readFileSync(this.langFilePath, 'utf16le');
	this.langData = vdf.parse(langFile);
	//Hack for tought Little Indian Character in object name after VDF.parse
	//Little Indian Character here "-->\"lang\""
	var littleEndianName = '\uFEFF' + '\"lang\"';
	this.langData.lang = this.langData[littleEndianName];
	delete this.langData[littleEndianName];

	// ---- ITEMGAME FILE ---
	var itemsFile = fs.readFileSync(this.itemsFilePath, 'utf8');
	this.itemsData = vdf.parse(itemsFile);

	// ---- SCHEMA FILE --- 
	var schemaFile = fs.readFileSync(this.schemaFilePath, 'utf8');
	this.schemaData = vdf.parse(schemaFile);
};

/**
 * Get weapon name from technical name.
 * @param {String} techName technical name (like weapon_xxx)
 * @return {String} Weapon name.
 * @private
  */
CSGODataParser.prototype._getWeaponNameFromTechnicalName = function(techName) {
	/*jshint camelcase: false */
	var self = this;

	var findWeapon;
	var items = this.schemaData.result.items;
	Object.keys(items).forEach(function(key){
		var element = items[key];
		if (element.name.indexOf('weapon_') > -1) {
			if (element.name === techName) {
				findWeapon = self.getLangValue(element.item_name);
			}
		}
	});
	return findWeapon;
};

/**
 * Get Paint Name from technical name.
 * @param {String} techName technical name (like hy_xxx or sp_yyy or ...)
 * @return {String} Paint Name.
 * @private
 */
CSGODataParser.prototype._getPaintNameFromTechnicalName = function(techName) {
	/*jshint camelcase: false */
	var self = this;

	var findPaint;
	var paintkits = this.itemsData.items_game.paint_kits;
	Object.keys(paintkits).forEach(function(key){
		if (paintkits[key].name === techName) {
			findPaint = self.getLangValue(paintkits[key].description_tag);
		}
	});
	return findPaint;
};

/**
 * Get all Skins from a Weapon technical name.
 * /!\ Hack from icons ?! Only way for knife ?! Thx Volvo ?!
 * @param {String} techName technical name (like weapon_xxx)
 * @return {Array} Skins Name.
 * @private
 */
CSGODataParser.prototype._getSkinByWeapon = function(techName) {
	/*jshint camelcase: false */
	var self = this;

	var skins = [];
 	var icons = this.itemsData.items_game.alternate_icons2.weapon_icons;
 	Object.keys(icons).forEach(function(key){
 		var datas = self._cleanCompositeIconName(icons[key].icon_path, techName);

 		if (datas.status) {
 			skins.pushUnique(self._getPaintNameFromTechnicalName(datas.skinTechName));
 		}
 	});
 	return skins;
};

/**
 * Clean the icon name for extract informations about the skin
 * @param {String} icon compositeIconName to split
 * @param {String} weaponTechName technical name (like weapon_xxx)
 * @return {Object} Object with status of the cleaning and tech names of weapon and skin
 * @private
 */
CSGODataParser.prototype._cleanCompositeIconName = function (icon, weaponTechName) {
	var result = {};
	result.status = false;

	var data = regexIcon.exec(icon)[1];
	var pos = data.indexOf(weaponTechName);

	if (pos != -1) {
		if (data.slice(weaponTechName.length).match(regexIconCheck)) {
			result.status = true;
			result.weaponTechName = weaponTechName;
			result.skinTechName = data.slice(1+weaponTechName.length);
		}
	}
	return result;
};

/**
 * Get All items of the paramater prefab on item_games file and match them with schema
 * WARNING - Don't work for items not in "items_game.items" array
 * @param {String} prefab prefab string (like weapon_case)
 * @return {Array} Items from the prefab
 * @private
 */
CSGODataParser.prototype._getItemsByPrefabViaSchema = function (prefab) {
	/*jshint camelcase: false */
	var self = this;
	var timer = misc.generateTimer();

	var itemsReturn = [];
	var itemsPrefab = this.itemsData.items_game.items;
	Object.keys(itemsPrefab).forEach(function(key){
		var element = itemsPrefab[key];
		if (typeof element.prefab === 'string' && element.prefab.containsOnSpaceSplit(prefab)) {
			itemsReturn.pushUnique(self.getLangValue(self._getDefIndexOnSchema(key).item_name));
		}
	});
	var totalPrefab = itemsReturn.length;
	self.logger.info('Generate ' + totalPrefab + ' ' + prefab + ' type [' + misc.resultTimer(timer) +'s]');
	return itemsReturn;
};

/**
 * Get a DefIndex id in the schema
 * WARNING - Don't be too greedy this method can cost a lot
 * @param {Integer} id DefIndex to find in schema
 * @return {Object} Element find in schema
 * @private
 */
CSGODataParser.prototype._getDefIndexOnSchema = function (id) {
	var timer = misc.generateTimer();
	var self = this;
	var returnelm;

	var items = this.schemaData.result.items;
	Object.keys(items).forEach(function(key){
		var element = items[key];
		if (element.defindex == id) {
			self.logger.info('Fetch id ' + id + ' - ' + element.item_name + ' [' + misc.resultTimer(timer) +'s]');
			returnelm = element;
		}
	});
	return returnelm;
};

/**
 * Return the parser's logger.
 * @return {winston.Logger} Winston based Parser's Logger.
 * @public
 */
CSGODataParser.prototype.getLogger = function(){
	/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
 	if (this.logger != null) {
 		return this.logger;
 	} 
};

/**
 * Check if datas files are OK.
 * @return {boolean} True if datas initialized, false otherwise
 * @public
 */
CSGODataParser.prototype.isDatasInitialized = function() {
	/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
 	if (this.schemaData == null || this.schemaData.result == null) {
 		return false;
 	}
 	if (this.itemsData == null || this.itemsData.items_game == null) {
 		return false;
 	}
 	return true;
};

/**
 * Check if lang file is OK.
 * @return {boolean} True if initialized, false otherwise
 * @public
 */
CSGODataParser.prototype.isLangInitialized = function() {
	/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
 	if (this.langData == null || this.langData.lang == null) {
 		return false;
 	}
 	return true;
};

/**
 * Get the lang value from valve key i18n values.
 * @param {String} keyLang valve key i18n values (like #PaintKit_aa_fade_Tag)
 * @return {String} traduction if langfile initialized and key is present, key otherwise
 * @public
 */
CSGODataParser.prototype.getLangValue = function(keyLang){
	/*jshint eqeqeq: false, eqnull:true*/
	var traduction;
	if (this.isLangInitialized()){
		traduction = this.langData.lang.Tokens.getValue(keyLang.prepareLang());
		if (traduction == null) {
			traduction = keyLang;
		} 
	} else {
		traduction = keyLang;
	}
	return traduction;
};

/**
 * Generate bases Weapons data from schema's data.
 * @return {Array} List of Objects. One object represent one Weapon.
 * @public
 */
CSGODataParser.prototype.getWeapons = function(){
	/*jshint camelcase: false */
	var self = this;
	var timer = misc.generateTimer();
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('-------- Weapons List Generation --------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	var weapons=[];
	var totalWeapon=0;

	var items = this.schemaData.result.items;
	Object.keys(items).forEach(function(key){
		var element = items[key];
		if (element.name.indexOf('weapon_') > -1) {
			var weapon = {};
			weapon.name=self.getLangValue(element.item_name);
			weapon.type=self.getLangValue(element.item_type_name);
			weapon.index=element.defindex;
			var timerSkins = misc.generateTimer();
			weapon.skins=self._getSkinByWeapon(element.name);
			weapons.push(weapon);
			totalWeapon++;
			self.logger.info('Generate ' + weapon.name + ' skins list [' + misc.resultTimer(timerSkins) +'s]');
		}
	});
	self.logger.info('-----------------------------------------');
	self.logger.info('Generate ' + totalWeapon + ' weapons [' + misc.resultTimer(timer) +'s]');
	return weapons;
};

/**
 * Generate collection's data from itemsgame's data.
 * @return {Array} List of Objects. One object represent one Weapon.
 * @public
 */
CSGODataParser.prototype.getCollections = function(){
	/*jshint camelcase: false */
	var self = this;
	var timer = misc.generateTimer();
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('------ Collections List Generation ------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	var collections=[];
	var totalCollection=Object.keys(this.itemsData.items_game.item_sets).length;

	Object.keys(this.itemsData.items_game.item_sets).forEach(function(keycollection){
		var collection = {};
		var valuecollection = self.itemsData.items_game.item_sets[keycollection];
		collection.name = self.getLangValue(valuecollection.name.prepareLang());
		collection.content=[];
		var timerCollections = misc.generateTimer();
		Object.keys(valuecollection.items).forEach(function(keyitem){
			var item={};
			var values = regexItem.exec(keyitem);
			item.paint=self._getPaintNameFromTechnicalName(values[1]);
			item.weapon=self._getWeaponNameFromTechnicalName(values[2]);
			collection.content.push(item);
		});
		collections.push(collection);
		self.logger.info('Generate ' + collection.name + ' collection list [' + misc.resultTimer(timerCollections) +'s]');
	});

	self.logger.info('-----------------------------------------');
	self.logger.info('Generate ' + totalCollection + ' collections [' + misc.resultTimer(timer) +'s]');
	return collections;
};

/**
 * Generate exteriors.
 * @return {Array} List of String. One string represent one exterior type.
 * @public
 */
CSGODataParser.prototype.getExteriors = function() {
	var self = this;
	var timer = misc.generateTimer();
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('------- Exteriors List Generation -------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	var exteriors=[];
	var totalExteriors=exteriorsKeysList.length;
	exteriorsKeysList.forEach(function(element){
		exteriors.push(self.getLangValue(element));
	});

	self.logger.info('Generate ' + totalExteriors + ' exteriors [' + misc.resultTimer(timer) +'s]');
	return exteriors;
};

/**
 * Generate Weapon/Stickers skin Case list.
 * @return {Array} List of String. One string represent one case.
 * @public
 */
CSGODataParser.prototype.getCases = function() {
	var cases = [];
	var self = this;
	
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('--------- Cases List Generation ---------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	cases = cases.concat(
		this._getItemsByPrefabViaSchema('weapon_case'),
	 	this._getItemsByPrefabViaSchema('weapon_case_base')
	 );

	return cases;
};

/**
 * Generate Weapon/Stickers skin Case keys list.
 * @return {Array} List of String. One string represent one case key.
 * @public
 */
CSGODataParser.prototype.getCaseKeys = function() {
	var casekeys = [];
	var self = this;
	
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('------- Cases Keys List Generation ------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	casekeys = this._getItemsByPrefabViaSchema('weapon_case_key');

	return casekeys;
};

/**
 * Generate Stickers list.
 * @return {Array} List of String. One string represent one sticker.
 * @public
 */
CSGODataParser.prototype.getStickers = function() {
	/*jshint camelcase: false */
	var self = this;
	var timer = misc.generateTimer();
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('------- Stickers List Generation --------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	var stickers=[];
	var rawstickers = this.itemsData.items_game.sticker_kits;
	
	Object.keys(rawstickers).forEach(function(key){
		//Remove the default Sticker by remove 0 key
		if (key !== '0') {
			var timerStickers = misc.generateTimer();
			stickers.pushUnique(self.getLangValue(rawstickers[key].item_name));
			self.logger.info('Fetch ' + rawstickers[key].item_name + ' sticker [' + misc.resultTimer(timerStickers) +'s]');
		}
	});

	var totalStickers=stickers.length;
	self.logger.info('-----------------------------------------');
	self.logger.info('Generate ' + totalStickers + ' stickers [' + misc.resultTimer(timer) +'s]');
	return stickers;
};

/**
 * Generate MusicKits list.
 * @return {Array} List of String. One string represent one music kit
 * @public
 */
CSGODataParser.prototype.getMusicKits = function() {
	/*jshint camelcase: false */
	var self = this;
	var timer = misc.generateTimer();
	self.logger.info('');
	self.logger.info('');
	self.logger.info('-----------------------------------------');
	self.logger.info('------- Music Kit List Generation ------');
	self.logger.info('-----------------------------------------');
	self.logger.info('');

	var musics=[];
	var rawmusics = this.itemsData.items_game.music_definitions;
	
	Object.keys(rawmusics).forEach(function(key){
		//Remove the default CS:GO Musics by remove 1&2 key
		if (key !== '1' && key !== '2') {
			var timerMusics = misc.generateTimer();
			musics.pushUnique(self.getLangValue(rawmusics[key].loc_name));
			self.logger.info('Fetch ' + rawmusics[key].loc_name + ' sticker [' + misc.resultTimer(timerMusics) +'s]');
		}
	});

	var totalStickers=musics.length;
	self.logger.info('-----------------------------------------');
	self.logger.info('Generate ' + totalStickers + ' music kits [' + misc.resultTimer(timer) +'s]');
	return musics;
};

module.exports = CSGODataParser;