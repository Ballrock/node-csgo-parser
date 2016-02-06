'use strict';
/* jshint node: true */

//Correct vdf for little endian handle ?
var vdf = require('vdf'),
	fs = require('fs'),
	winston = require('winston'),
	misc = require('./miscHelper'),
	Weapon = require('./Weapon.js'),
	Collection = require('./Collection.js'),
	Rarity = require('./Rarity.js'),
	Sticker = require('./Sticker.js'),
	SkinPaint = require('./SkinPaint.js'),
	MusicKit = require('./MusicKit.js');

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
 * @param {String} logLevel Winston Log Level, if > info no timing data for generations.
 * @param {String} logFilePath Choosen file path to write logs.
 * @constructor 
 *
 * @todo Refactoring... This file will be too long
 * @todo Generalization isDatasInitialized
 * @todo Better handle of Little Endian for vdf / Hack dependency
 * @todo Datamining File for more informations
 * @todo DEBUG - Better Handle of Knifes and Rarities (My god, need so much hack ><. Volvo... that's not really clean ^^')
 * @todo To ES6
 * @todo Optimize Performances
 * @todo defindex to int ?
 */
class CSGODataParser {

	constructor(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath) {
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
	_generateObjectDataFromFiles() {
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
	}

	/**
	 * Get weapon name from technical name.
	 * @param {String} techName technical name (like weapon_xxx)
	 * @return {String} Weapon name.
	 * @private
	  */
	_getWeaponNameFromTechnicalName(techName) {
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
	}

	/**	
	 * Get Paint Name from technical name.
	 * @param {String} techName technical name (like hy_xxx or sp_yyy or ...)
	 * @return {String} Paint Name.
	 * @private
	 */
	_getPaintNameAndDefIndexFromTechnicalName(techName) {
		/*jshint camelcase: false */
		var self = this;

		var findPaint=[];
		findPaint[0] = undefined;
		findPaint[1] = undefined;
		var paintkits = this.itemsData.items_game.paint_kits;
		Object.keys(paintkits).forEach(function(key){
			if (paintkits[key].name === techName) {
				findPaint[0] = self.getLangValue(paintkits[key].description_tag);
				findPaint[1] = key;
			}
		});
		return findPaint;
	}

	/**
	 * Get all Skins from a Weapon technical name.
	 * /!\ Hack from icons ?! Only way for knife ?! Thx Volvo ?!
	 * @param {String} techName technical name (like weapon_xxx)
	 * @return {Array} Skins Name.
	 * @private
	 */
	_getSkinsByWeapon(techName, type, indexed) {
		/*jshint camelcase: false */
		var self = this;
		var skins;
	 	var icons = this.itemsData.items_game.alternate_icons2.weapon_icons;
		(indexed ? skins={} : skins=[]);
	 	Object.keys(icons).forEach(function(key){
	 		var skin = new SkinPaint();
	 		var datas = self._cleanCompositeIconName(icons[key].icon_path, techName);
	 		if (datas.status) {
	 			var skinInfo = self._getPaintNameAndDefIndexFromTechnicalName(datas.skinTechName);
				if (indexed){
					var i = skinInfo[1];
					skins[i] = {
						'name':skinInfo[0],
						'techName':datas.skinTechName,
						'weaponTechName':techName
					};	
					if (type === '#CSGO_Type_Knife') {
						skins[i].fullName = '★ ' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skins[i].name;
						skins[i].rarity = 'unusual';
					} else {
						skins[i].fullName = '' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skins[i].name;
						skins[i].rarity = self._getRarityFromPaintTechnicalName(datas.skinTechName);
					}
				}else{
					skin.name = skinInfo[0];
					skin.techName = datas.skinTechName;
					skin.weaponTechName = techName;
					skin.defIndex = skinInfo[1];
					//Hack for melee weapon :s
					if (type === '#CSGO_Type_Knife') {
						skin.fullName = '★ ' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skin.name;
						skin.rarity = 'unusual';
					} else {
						skin.fullName = '' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skin.name;
						skin.rarity = self._getRarityFromPaintTechnicalName(datas.skinTechName);
					}
					skins.pushUniqueNamedObject(skin);
				}
	 		}
	 	});
	 	return skins;
	}

	/**
	 * Get Rarity from technical paint name.
	 * @param {String} techName technical name (like hy_xxx or sp_yyy or ...)
	 * @return {String} quality technical name.
	 * @private
	 */
	_getRarityFromPaintTechnicalName(techName) {
		/*jshint camelcase: false */
		var paintkitsrarity = this.itemsData.items_game.paint_kits_rarity;
		return paintkitsrarity[techName];
	}


	/**
	 * Clean the icon name for extract informations about the skin
	 * @param {String} icon compositeIconName to split
	 * @param {String} weaponTechName technical name (like weapon_xxx)
	 * @return {Object} Object with status of the cleaning and tech names of weapon and skin
	 * @private
	 */
	_cleanCompositeIconName(icon, weaponTechName) {
		var result = {};
		result.status = false;

		var data = regexIcon.exec(icon)[1];
		var pos = data.indexOf(weaponTechName);

		if (pos !== -1) {
			if (data.slice(weaponTechName.length).match(regexIconCheck)) {
				result.status = true;
				result.weaponTechName = weaponTechName;
				result.skinTechName = data.slice(1+weaponTechName.length);
			}
		}
		return result;
	}

	/**
	 * Get All items of the paramater prefab on item_games file and match them with schema
	 * WARNING - Don't work for items not in "items_game.items" array
	 * @param {String} prefab prefab string (like weapon_case)
	 * @return {Array} Items from the prefab
	 * @private
	 */
	_getItemsByPrefabViaSchema(prefab, type, indexed) {
		/*jshint camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		var itemsReturn;
		(indexed ? itemsReturn={} : itemsReturn=[]);
		var itemsPrefab = this.itemsData.items_game.items;
		Object.keys(itemsPrefab).forEach(function(key){
			if (typeof itemsPrefab[key].prefab === 'string' && itemsPrefab[key].prefab.containsOnSpaceSplit(prefab)) {
				if (indexed){
					itemsReturn[key] = {
						'name':self.getLangValue(self._getDefIndexOnSchema(key).item_name),
						'techName':self._getDefIndexOnSchema(key).item_name,
						'type':type
					};	
				}else{
					var element = {};
					element.name = self.getLangValue(self._getDefIndexOnSchema(key).item_name);
					element.techName = self._getDefIndexOnSchema(key).item_name;
					element.defIndex = key;
					element.type = type;
					itemsReturn.pushUniqueNamedObject(element);
				}
				self.logger.info('Fetch ' + (indexed ? itemsReturn[key].name : element.name ) + ' [' + misc.resultTimer(timer) +'s]');
			}
		});
		var totalPrefab=Object.keys(itemsReturn).length;
		self.logger.info('Generate ' + totalPrefab + ' ' + prefab + ' type [' + misc.resultTimer(timer) +'s]');
		return itemsReturn;
	}

	/**
	 * Get a DefIndex id in the schema
	 * WARNING - Don't be too greedy this method can cost a lot
	 * @param {Integer} id DefIndex to find in schema
	 * @return {Object} Element find in schema
	 * @private
	 */
	_getDefIndexOnSchema(id) {
		/*jshint eqeqeq: false, camelcase: false*/
		var timer = misc.generateTimer();
		var self = this;
		var returnelm;

		var items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key){
			var element = items[key];
			if (element.defindex == id) {
				returnelm = element;
			}
		});
		return returnelm;
	}

	/**
	 * Return the parser's logger.
	 * @return {winston.Logger} Winston based Parser's Logger.
	 * @public
	 */
	getLogger(){
		/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
	 	if (this.logger != null) {
	 		return this.logger;
	 	} 
	}

	/**
	 * Check if datas files are OK.
	 * @return {boolean} True if datas initialized, false otherwise
	 * @public
	 */
	isDatasInitialized() {
		/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
	 	if (this.schemaData == null || this.schemaData.result == null) {
	 		return false;
	 	}
	 	if (this.itemsData == null || this.itemsData.items_game == null) {
	 		return false;
	 	}
	 	return true;
	}

	/**
	 * Check if lang file is OK.
	 * @return {boolean} True if initialized, false otherwise
	 * @public
	 */
	isLangInitialized() {
		/*jshint eqeqeq: false, eqnull:true, camelcase: false*/
	 	if (this.langData == null || this.langData.lang == null) {
	 		return false;
	 	}
	 	return true;
	}

	/**
	 * Get the lang value from valve key i18n values.
	 * @param {String} keyLang valve key i18n values (like #PaintKit_aa_fade_Tag)
	 * @return {String} traduction if langfile initialized and key is present, key otherwise
	 * @public
	 */
	getLangValue(keyLang) {
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
	}

	/**
	 * Generate bases Weapons data from schema's data.
	 * @return {Array.<Weapon>} List of Objects. One object represent one Weapon.
	 * @public
	 */
	getWeapons(indexed) {
		/*jshint camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('-------- Weapons List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		var weapons;

		(indexed ? weapons={} : weapons=[]);
		var items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key){
			var element = items[key];
			if (element.name.indexOf('weapon_') > -1) {
				var timerSkins = misc.generateTimer();
				if (indexed){
					var i = element.defindex;
					weapons[i] = {
						'name':self.getLangValue(element.item_name),
						'techName':element.name,
						'type':self.getLangValue(element.item_type_name)
					};	
					if (weapons[i].techName !== 'weapon_knife'){
						weapons[i].skins=self._getSkinsByWeapon(element.name, element.item_type_name, indexed);
					}
				}else{
					var weapon = new Weapon();
					weapon.name=self.getLangValue(element.item_name);
					weapon.techName=element.name;
					weapon.type=self.getLangValue(element.item_type_name);
					weapon.defIndex=element.defindex;
					if (weapon.techName !== 'weapon_knife'){
						weapon.skins=self._getSkinsByWeapon(element.name, element.item_type_name, indexed);
					}
					weapons.push(weapon);
				}
				self.logger.info('Generate ' + (indexed ? weapons[i].name : weapon.name ) + ' skins list [' + misc.resultTimer(timerSkins) +'s]');
			}
		});
		var totalWeapons=Object.keys(weapons).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalWeapons + ' weapons [' + misc.resultTimer(timer) +'s]');
		return weapons;
	}
	getWeaponsIndexed(){ return this.getWeapons(true);}

	/**
	 * Generate collection's data from itemsgame's data.
	 * @return {Array.<Collection>} List of Collections. One object represent one Collection.
	 * @public
	 */
	getCollections(indexed) {
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

		Object.keys(this.itemsData.items_game.item_sets).forEach(function(keycollection){
			var collection = new Collection();
			var valuecollection = self.itemsData.items_game.item_sets[keycollection];
			collection.name = self.getLangValue(valuecollection.name.prepareLang());
			collection.techName = keycollection;
			(indexed ? collection.content={} : collection.content=[]);
			var timerCollections = misc.generateTimer();
			Object.keys(valuecollection.items).forEach(function(keyitem){
				var values = regexItem.exec(keyitem);
				var skinInfo = self._getPaintNameAndDefIndexFromTechnicalName(values[1]);
				if (indexed){
					var i=skinInfo[1];
					collection.content[i] = {
						'name':skinInfo[0],
						'techName':values[1],
						'weaponTechName':values[2],
						'fullName':self._getWeaponNameFromTechnicalName(values[2]) + ' | ' + skinInfo[0],
						'rarity':self._getRarityFromPaintTechnicalName(values[1])
					};	
				}else{
					var skin=new SkinPaint();
					skin.name = skinInfo[0];
					skin.techName = values[1];
					skin.weaponTechName = values[2];
					skin.fullName = self._getWeaponNameFromTechnicalName(values[2]) + ' | ' + skin.name;
					skin.defIndex = skinInfo[1];
					skin.rarity = self._getRarityFromPaintTechnicalName(values[1]);
					collection.content.push(skin);
				}
			});
			collections.push(collection);
			self.logger.info('Generate ' + collection.name + ' collection list [' + misc.resultTimer(timerCollections) +'s]');
		});

		var totalCollection=Object.keys(collections).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalCollection + ' collections [' + misc.resultTimer(timer) +'s]');
		return collections;
	}
	getCollectionsIndexed(){ return this.getCollections(true);}

	/**
	 * Generate exteriors.
	 * @return {Array.<String>} One string represent one exterior type - I18N Name
	 * @public
	 */
	getExteriors() {
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
	}

	/**
	 * Generate Origins List.
	 * @return {Array.<Origin>} List of Origin objects. One object represent one origin.
	 * @public
	 */
	getOrigins(indexed) {
		/*jshint camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('-------- Origins List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		var origins;

		(indexed ? origins={} : origins=[]);
		var obj = this.schemaData.result.originNames;
		Object.keys(obj).forEach(function(key){
			var element = obj[key];
			if (indexed){
				var i = element.origin;
				origins[i] = element.name;
			}else{
				origins.push(element.name);
			}
		});
		var totalOrigins=Object.keys(origins).length;
		self.logger.info('Generate ' + totalOrigins + ' origins [' + misc.resultTimer(timer) +'s]');
		return origins;
	}
	getOriginsIndexed(){ return this.getOrigins(true);}

	/**
	 * Generate Weapon/Stickers skin Case list.
	 * @return {Array.<Prefab>} List of Object. One object represent one case
	 * @public
	 */
	getCases(indexed) {
		var self = this;
		
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('--------- Cases List Generation ---------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		if (indexed){
			var case1 = {};
			var case2 = {};
			var cases = {};
		}else{
			var case1 = [];
			var case2 = [];
			var cases = [];
		}
		case1 = this._getItemsByPrefabViaSchema('weapon_case', 'case', indexed);
		case2 = this._getItemsByPrefabViaSchema('weapon_case_base', 'case', indexed);
		
		for (var attrname in case1) { cases[attrname] = case1[attrname]; }
		for (var attrname in case2) { cases[attrname] = case2[attrname]; }
		return cases;
	
	}
	getCasesIndexed(){ return this.getCases(true);}

	/**
	 * Generate Weapon/Stickers skin Case keys list.
	 * @return {Array.<Prefab>} List of Object. One object represent one case key 
	 * @public
	 */
	getCaseKeys(indexed) {
		var casekeys = [];
		var self = this;
		
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Cases Keys List Generation ------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');

		casekeys = this._getItemsByPrefabViaSchema('weapon_case_key', 'case_key', indexed);

		return casekeys;
	}
	getCaseKeysIndexed(){ return this.getCaseKeys(true);}

	/**
	 * Generate Stickers list.
	 * Note : Some unknown stickers are present in the item_game file so they have a rarity set to "default" (id 2 to 12)
	 * @return {Array.<Sticker>} List of Sticker. One object represent one sticker
	 * @public
	 */
	getStickers(indexed) {
		/*jshint eqeqeq: false, eqnull:true, camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Stickers List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		var stickers;
		var rawstickers = this.itemsData.items_game.sticker_kits;
		(indexed ? stickers={} : stickers=[]);
		Object.keys(rawstickers).forEach(function(key){
			//Remove the default Sticker by remove 0 key
			if (key !== '0') {
				var timerStickers = misc.generateTimer();
				if (indexed){
					if (rawstickers[key].item_rarity == null) {
						var rarity='default';
					} else {
						var rarity=rawstickers[key].item_rarity;
					}
					stickers[key] = {
						'name':self.getLangValue(rawstickers[key].item_name),
						'techName':rawstickers[key].name,
						'item_rarity':rarity
					};	
				}else{
					var sticker=new Sticker();
					sticker.name=self.getLangValue(rawstickers[key].item_name);
					sticker.techName=rawstickers[key].name;
					sticker.defIndex=key;
					if (rawstickers[key].item_rarity == null) {
						sticker.rarity='default';
					} else {
						sticker.rarity=rawstickers[key].item_rarity;
					}
					stickers.pushUniqueNamedObject(sticker);
				}
				self.logger.info('Fetch ' + (indexed ? stickers[key].name : sticker.name )+ ' sticker [' + misc.resultTimer(timerStickers) +'s]');
			}
		});

		var totalStickers=Object.keys(stickers).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalStickers + ' stickers [' + misc.resultTimer(timer) +'s]');
		return stickers;
	} 
	getStickersIndexed(){ return this.getStickers(true);}
	
	/**
	 * Generate MusicKits list.
	 * @return {Array.<MusicKit>} List of MusicKit. One object represent one music kit
	 * @public
	 */
	getMusicKits(indexed) {
		/*jshint camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Music Kit List Generation ------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		var rawmusics = this.itemsData.items_game.music_definitions;
		var musics;
		
		(indexed ? musics={} : musics=[]);
		Object.keys(rawmusics).forEach(function(key){
			//Remove the default CS:GO Musics by remove 1&2 key
			if (key !== '1' && key !== '2') {
				var timerMusics = misc.generateTimer();
				if (indexed){
					musics[key] = {
						'name':self.getLangValue(rawmusics[key].loc_name),
						'techName':rawmusics[key].name
					};	
				}else{				
					var music = new MusicKit();
					music.name = self.getLangValue(rawmusics[key].loc_name);
					music.techName = rawmusics[key].name;
					music.defIndex = key;
					musics.pushUniqueNamedObject(music);
				}
				self.logger.info('Fetch ' + (indexed ? musics[key].name : music.name ) + ' music kit [' + misc.resultTimer(timerMusics) +'s]');
			}
		});

		var totalMusics=Object.keys(musics).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalMusics + ' music kits [' + misc.resultTimer(timer) +'s]');
		return musics;
	}
	getMusicKitsIndexed(){ return this.getMusicKits(true);}
	
	/**
	 * Generate Rarities index.
	 * @return {Array.<Rarity>} List of Rarity objects. One object represent one rarity.
	 * @public
	 */
	getRarities(indexed) {
		/*jshint camelcase: false */
		var self = this;
		var timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('---------- Rarities Generation ----------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		var rawrarities = this.itemsData.items_game.rarities;
		var rawcolors = this.itemsData.items_game.colors;
		var rarities;
		
		(indexed ? rarities={} : rarities=[]);
		Object.keys(rawrarities).forEach(function(key){
			var timerRarity = misc.generateTimer();
			//Hack for melee weapon :s
			if (rawrarities[key].loc_key_weapon === 'Rarity_Unusual') {
				var wepName = '★ ' + self.getLangValue('RI_M'); 
			} else {
				var wepName = self.getLangValue(rawrarities[key].loc_key_weapon);
			}
			if (indexed){
				var i = rawrarities[key].value;
				rarities[i] = {
					'techName':key,
					'weaponName':wepName,
					'miscName':self.getLangValue(rawrarities[key].loc_key),
					'color':rawcolors[rawrarities[key].color].hex_color
				};	
			}else{			
				var rarity = new Rarity();
				rarity.weaponName=wepName;
				rarity.techName=key;
				rarity.miscName=self.getLangValue(rawrarities[key].loc_key);
				rarity.color=rawcolors[rawrarities[key].color].hex_color;
				rarity.defIndex=rawrarities[key].value;
				rarities.push(rarity);
			}
			self.logger.info('Fetch ' + key + ' rarity [' + misc.resultTimer(timerRarity) +'s]');
		});

		var totalRarity=Object.keys(rarities).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalRarity + ' rarities [' + misc.resultTimer(timer) +'s]');
		return rarities;
	}
	getRaritiesIndexed(){ return this.getRarities(true);}
}
module.exports = CSGODataParser;