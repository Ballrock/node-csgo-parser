'use strict';
/* jshint node: true */

//Correct vdf for little endian handle ?
const simplevdf = require('simple-vdf'),
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
const exteriorsKeysList = ['SFUI_InvTooltip_Wear_Amount_0',
	'SFUI_InvTooltip_Wear_Amount_1',
	'SFUI_InvTooltip_Wear_Amount_2',
	'SFUI_InvTooltip_Wear_Amount_3',
	'SFUI_InvTooltip_Wear_Amount_4'];

/**
 * Regex for Items.
 * @const {RegExp}
 * @private
 */
const regexItem = /\[(.*)\](.*)/i;

/**
 * Regex for Icon.
 * @const {RegExp}
 * @private
  */
const regexIcon = /econ\/default_generated\/(.*)_(light|medium|heavy)$/i;

/**
 * Regex for Check Icon.
 * @const {RegExp}
 * @private
  */
const regexIconCheck = /^(?:_[^_]{2}_)/m;
/**
 * Regex for Check Icon of a gloves.
 * @const {RegExp}
 * @private
 */
const regexGlovesIconCheck = /^(?:_[^_])/m;
/**
 * @const {RegExp}
 * @private
 */
const regexWeaponSkinCheck = /(^weapon_)|(_gloves$)|(_handwraps$)/m;
/**
 * @const {RegExp}
 * @private
 */
const regexGlovesSkinCheck = /(_gloves$)|(_handwraps$)/m;

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
		const langFile = fs.readFileSync(this.langFilePath, 'utf8');
		try {
			this.langData = JSON.parse(langFile);
		} catch (e)
		{
			this.langData = simplevdf.parse(langFile);
		}

		// ---- ITEMGAME FILE ---
		const itemsFile = fs.readFileSync(this.itemsFilePath, 'utf8');
		try {
			this.itemsData = JSON.parse(itemsFile);
		} catch (e)
		{
			this.itemsData = simplevdf.parse(itemsFile);
		}

		// ---- SCHEMA FILE ---
		const schemaFile = fs.readFileSync(this.schemaFilePath, 'utf8');
		try {
			this.schemaData = JSON.parse(schemaFile);
		} catch (e)
		{
			this.schemaData = simplevdf.parse(schemaFile);
		}
	}

	/**
	 * Get weapon name from technical name.
	 * @param {String} techName technical name (like weapon_xxx)
	 * @return {String} Weapon name.
	 * @private
	  */
	_getWeaponNameFromTechnicalName(techName) {
		/*jshint camelcase: false */
		const self = this;

		let findWeapon;
		const items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key) {
			const element = items[key];
			if (regexWeaponSkinCheck.test(element.name)) {
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
		const self = this;

		const findPaint=[];
		findPaint[0] = undefined;
		findPaint[1] = undefined;
		const paintkits = this.itemsData.items_game.paint_kits;
		Object.keys(paintkits).forEach(function(key) {
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
		const self = this;
		const skins = indexed ? {} : [];
	 	const icons = this.itemsData.items_game.alternate_icons2.weapon_icons;
	 	Object.keys(icons).forEach(function(key) {
	 		const skin = new SkinPaint();
	 		const datas = self._cleanCompositeIconName(icons[key].icon_path, techName);
	 		if (datas.status) {
				const skinInfo = self._getPaintNameAndDefIndexFromTechnicalName(datas.skinTechName);
				if (indexed) {
					const i = skinInfo[1];
					skins[i] = {
						'name':skinInfo[0],
						'techName':datas.skinTechName,
						'weaponTechName':techName
					};
					if (type === 'Knife' || type === "Gloves") {
						skins[i].fullName = '★ ' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skins[i].name;
						skins[i].rarity = 'unusual';
					} else {
						skins[i].fullName = '' + self._getWeaponNameFromTechnicalName(techName) + ' | ' + skins[i].name;
						skins[i].rarity = self._getRarityFromPaintTechnicalName(datas.skinTechName);
					}
				} else {
					skin.name = skinInfo[0];
					skin.techName = datas.skinTechName;
					skin.weaponTechName = techName;
					skin.defIndex = skinInfo[1];
					//Hack for melee weapon :s
					if (type === 'Knife' || type === "Gloves") {
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
		const paintkitsrarity = this.itemsData.items_game.paint_kits_rarity;
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
		const result = {};
		result.status = false;

		const data = regexIcon.exec(icon)[1];
		const pos = data.indexOf(weaponTechName);

		if (pos !== -1) {
			if (data.slice(weaponTechName.length).match(regexGlovesSkinCheck.test(weaponTechName) ? regexGlovesIconCheck : regexIconCheck)) {
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
		const self = this;
		const timer = misc.generateTimer();
		let itemsReturn;
		(indexed ? itemsReturn={} : itemsReturn=[]);
		const itemsPrefab = this.itemsData.items_game.items;
		Object.keys(itemsPrefab).forEach(function(key) {
			if (typeof itemsPrefab[key].prefab === 'string' && itemsPrefab[key].prefab.containsOnSpaceSplit(prefab)) {
				let name = ""
				if (indexed) {
					itemsReturn[key] = {
						'name':self.getLangValue(self._getDefIndexOnSchema(key).item_name),
						'techName':self._getDefIndexOnSchema(key).item_name,
						'type':type
					};
					name = itemsReturn[key].name;
				} else {
					const element = {};
					element.name = self.getLangValue(self._getDefIndexOnSchema(key).item_name);
					element.techName = self._getDefIndexOnSchema(key).item_name;
					element.defIndex = key;
					element.type = type;
					itemsReturn.pushUniqueNamedObject(element);
					name = element.name;
				}
				self.logger.info('Fetch ' + name + ' [' + misc.resultTimer(timer) +'s]');
			}
		});
		const totalPrefab = Object.keys(itemsReturn).length;
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
		const timer = misc.generateTimer();
		const self = this;
		let returnelm;

		const items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key) {
			const element = items[key];
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
	getLogger() {
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
	 	return !(this.itemsData == null || this.itemsData.items_game == null);

	}

	/**
	 * Check if lang file is OK.
	 * @return {boolean} True if initialized, false otherwise
	 * @public
	 */
	isLangInitialized() {
	 	return !(this.langData == null || this.langData.lang == null);

	}

	/**
	 * Get the lang value from valve key i18n values.
	 * @param {String} keyLang valve key i18n values (like #PaintKit_aa_fade_Tag)
	 * @return {String} traduction if langfile initialized and key is present, key otherwise
	 * @public
	 */
	getLangValue(keyLang) {
		/*jshint eqeqeq: false, eqnull:true*/
		let traduction;
		if (this.isLangInitialized()) {
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
	getWeapons(indexed = false) {
		/*jshint camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('-------- Weapons List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		let weapons;

		(indexed ? weapons={} : weapons=[]);
		const items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key) {
			const element = items[key];
			if (regexWeaponSkinCheck.test(element.name)) {
				let count = 0;
				const timerSkins = misc.generateTimer();
				let name;
				if (indexed) {
					const i = element.defindex;
					weapons[i] = {
						'name': self.getLangValue(element.item_name),
						'techName': element.name,
						'type': self.getLangValue(element.item_type_name),
						'skins': {}
					};
					if (weapons[i].techName !== 'weapon_knife') {
						weapons[i].skins = self._getSkinsByWeapon(element.name, element.item_type_name, indexed);
					}
					count = Object.keys(weapons[i].skins).length
					name = weapons[i].name;
				} else {
					const weapon = new Weapon();
					weapon.name = self.getLangValue(element.item_name);
					weapon.techName = element.name;
					weapon.type = self.getLangValue(element.item_type_name);
					weapon.defIndex = element.defindex;
					weapon.skins = []
					if (weapon.techName !== 'weapon_knife') {
						weapon.skins=self._getSkinsByWeapon(element.name, element.item_type_name, indexed);
					}
					count = weapon.skins.length
					weapons.push(weapon);
					name = weapon.name;
				}
				self.logger.info('Generate ' + (count) + ' ' + (name) + ' skins list [' + misc.resultTimer(timerSkins) +'s]');
			}
		});
		const totalWeapons=Object.keys(weapons).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalWeapons + ' weapons [' + misc.resultTimer(timer) +'s]');
		return weapons;
	}
	getWeaponsIndexed() { return this.getWeapons(true);}

	/**
	 * Generate all skins (weapons + gloves) from the schema's data and return a key-value map.
	 * @return {Map.<Weapon>} Map of Objects. One object represent one skin. Where key is the skin's fullName (such as "Desert Eagle | Blaze").
	 * @public
	 */
	getSkinsMap() {
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('-------- Skins Map Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');

		const skins = {}
		const items = this.schemaData.result.items;
		Object.keys(items).forEach(function(key) {
			const element = items[key];
			if (regexWeaponSkinCheck.test(element.name)) {
				let count = 0
				const timerSkins = misc.generateTimer();
				const weapon = {
					type: self.getLangValue(element.item_type_name),
					weaponName: self.getLangValue(element.item_name)
				}

				if (weapon.techName !== 'weapon_knife') {
					const skinsList = self._getSkinsByWeapon(element.name, element.item_type_name, false);
					count = skinsList.length;
					for (const skin of skinsList)
						skins[skin.fullName] = {...skin, ...weapon};
				}

				self.logger.info('Generate ' + (count) + ' ' + (weapon.weaponName) + ' skins list [' + misc.resultTimer(timerSkins) +'s]');
			}
		})


		const totalWeapons=Object.keys(skins).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalWeapons + ' skins [' + misc.resultTimer(timer) +'s]');
		return skins;
	}

	/**
	 * Generate collection's data from itemsgame's data.
	 * @return {Array.<Collection>} List of Collections. One object represent one Collection.
	 * @public
	 */
	getCollections(indexed = false) {
		/*jshint camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------ Collections List Generation ------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		const collections=[];

		Object.keys(this.itemsData.items_game.item_sets).forEach(function(keycollection) {
			const collection = new Collection();
			const valuecollection = self.itemsData.items_game.item_sets[keycollection];

			collection.name = self.getLangValue(valuecollection.name.prepareLang());
			collection.techName = keycollection;
			(indexed ? collection.content={} : collection.content=[]);

			const timerCollections = misc.generateTimer();
			Object.keys(valuecollection.items).forEach(function(keyitem) {
				const values = regexItem.exec(keyitem);
				if (values === null)
					return

				const skinInfo = self._getPaintNameAndDefIndexFromTechnicalName(values[1]);
				if (indexed) {
					const i = skinInfo[1];
					collection.content[i] = {
						'name': skinInfo[0],
						'techName': values[1],
						'weaponTechName': values[2],
						'fullName': self._getWeaponNameFromTechnicalName(values[2]) + ' | ' + skinInfo[0],
						'rarity': self._getRarityFromPaintTechnicalName(values[1])
					};
				} else {
					const skin = new SkinPaint();
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

		const totalCollection=Object.keys(collections).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalCollection + ' collections [' + misc.resultTimer(timer) +'s]');
		return collections;
	}
	getCollectionsIndexed() { return this.getCollections(true);}

	/**
	 * Generate exteriors.
	 * @return {Array.<String>} One string represent one exterior type - I18N Name
	 * @public
	 */
	getExteriors() {
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Exteriors List Generation -------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');

		const exteriors=[];
		const totalExteriors=exteriorsKeysList.length;
		exteriorsKeysList.forEach(function(element) {
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
	getOrigins(indexed = false) {
		/*jshint camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('-------- Origins List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		let origins;

		(indexed ? origins={} : origins=[]);
		const obj = this.schemaData.result.originNames;
		Object.keys(obj).forEach(function(key) {
			const element = obj[key];
			if (indexed) {
				const i = element.origin;
				origins[i] = element.name;
			} else {
				origins.push(element.name);
			}
		});
		const totalOrigins=Object.keys(origins).length;
		self.logger.info('Generate ' + totalOrigins + ' origins [' + misc.resultTimer(timer) +'s]');
		return origins;
	}
	getOriginsIndexed() { return this.getOrigins(true);}

	/**
	 * Generate Weapon/Stickers skin Case list.
	 * @return {Array.<Prefab>} List of Object. One object represent one case
	 * @public
	 */
	getCases(indexed = false) {
		const self = this;

		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('--------- Cases List Generation ---------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		let case1,
			case2,
			cases;

		if (indexed) {
			case1 = {};
			case2 = {};
			cases = {};
		} else {
			case1 = [];
			case2 = [];
			cases = [];
		}
		case1 = this._getItemsByPrefabViaSchema('weapon_case', 'case', indexed);
		case2 = this._getItemsByPrefabViaSchema('weapon_case_base', 'case', indexed);

		for (const attrname1 in case1) { if (case1.hasOwnProperty(attrname1)) { cases[attrname1] = case1[attrname1]; }}
		for (const attrname2 in case2) { if (case2.hasOwnProperty(attrname2)) { cases[attrname2] = case2[attrname2]; }}
		return cases;

	}
	getCasesIndexed() { return this.getCases(true);}

	/**
	 * Generate Weapon/Stickers skin Case keys list.
	 * @return {Array.<Prefab>} List of Object. One object represent one case key
	 * @public
	 */
	getCaseKeys(indexed = false) {
		let casekeys = [];
		const self = this;

		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Cases Keys List Generation ------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');

		casekeys = this._getItemsByPrefabViaSchema('weapon_case_key', 'case_key', indexed);

		return casekeys;
	}
	getCaseKeysIndexed() { return this.getCaseKeys(true);}

	/**
	 * Generate Stickers list.
	 * Note : Some unknown stickers are present in the item_game file so they have a rarity set to "default" (id 2 to 12)
	 * @return {Array.<Sticker>} List of Sticker. One object represent one sticker
	 * @public
	 */
	getStickers(indexed = false) {
		/*jshint eqeqeq: false, eqnull:true, camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Stickers List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		let stickers;
		const rawstickers = this.itemsData.items_game.sticker_kits;
		(indexed ? stickers={} : stickers=[]);
		Object.keys(rawstickers).forEach(function(key) {
			//Remove the default Sticker by remove 0 key
			if (key !== '0') {
				const timerStickers = misc.generateTimer();
				let name;
				if (indexed) {
					let rarity;
					if (rawstickers[key].item_rarity == null) {
						rarity='default';
					} else {
						rarity=rawstickers[key].item_rarity;
					}
					stickers[key] = {
						'name':self.getLangValue(rawstickers[key].item_name),
						'techName':rawstickers[key].name,
						'item_rarity':rarity
					};
					name = stickers[key].name;
				} else {
					const sticker = new Sticker();
					sticker.name = self.getLangValue(rawstickers[key].item_name);
					sticker.techName = rawstickers[key].name;
					sticker.defIndex = key;
					if (rawstickers[key].item_rarity == null) {
						sticker.rarity='default';
					} else {
						sticker.rarity=rawstickers[key].item_rarity;
					}
					stickers.pushUniqueNamedObject(sticker);
					name = sticker.name;
				}
				self.logger.info('Fetch ' + (name) + ' sticker [' + misc.resultTimer(timerStickers) +'s]');
			}
		});

		const totalStickers=Object.keys(stickers).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalStickers + ' stickers [' + misc.resultTimer(timer) +'s]');
		return stickers;
	}
	getStickersIndexed() { return this.getStickers(true);}
	getStickersMap() {
		/*jshint eqeqeq: false, eqnull:true, camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Stickers List Generation --------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		const stickers = {};
		const rawstickers = this.itemsData.items_game.sticker_kits;
		Object.keys(rawstickers).forEach(function(key) {
			//Remove the default Sticker by remove 0 key
			if (key !== '0') {
				const timerStickers = misc.generateTimer();
				const sticker = new Sticker();
				sticker.name = self.getLangValue(rawstickers[key].item_name);
				sticker.techName = rawstickers[key].name;
				sticker.defIndex = key;
				if (rawstickers[key].item_rarity == null) {
					sticker.rarity = 'default';
				} else {
					sticker.rarity = rawstickers[key].item_rarity;
				}

				stickers[sticker.name] = sticker
				self.logger.info('Fetch ' + ( sticker.name )+ ' sticker [' + misc.resultTimer(timerStickers) +'s]');
			}
		});

		const totalStickers=Object.keys(stickers).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalStickers + ' stickers [' + misc.resultTimer(timer) +'s]');
		return stickers;
	}

	/**
	 * Generate MusicKits list.
	 * @return {Array.<MusicKit>} List of MusicKit. One object represent one music kit
	 * @public
	 */
	getMusicKits(indexed = false) {
		/*jshint camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('------- Music Kit List Generation ------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		const rawmusics = this.itemsData.items_game.music_definitions;
		let musics;

		(indexed ? musics={} : musics=[]);
		Object.keys(rawmusics).forEach(function(key) {
			//Remove the default CS:GO Musics by remove 1&2 key
			if (key !== '1' && key !== '2') {
				const timerMusics = misc.generateTimer();
				let name;
				if (indexed) {
					musics[key] = {
						'name':self.getLangValue(rawmusics[key].loc_name),
						'techName':rawmusics[key].name
					};
					name = musics[key].name
				} else {
					const music = new MusicKit();
					music.name = self.getLangValue(rawmusics[key].loc_name);
					music.techName = rawmusics[key].name;
					music.defIndex = key;
					musics.pushUniqueNamedObject(music);
					name = music.name
				}
				self.logger.info('Fetch ' + name + ' music kit [' + misc.resultTimer(timerMusics) +'s]');
			}
		});

		const totalMusics=Object.keys(musics).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalMusics + ' music kits [' + misc.resultTimer(timer) +'s]');
		return musics;
	}
	getMusicKitsIndexed() { return this.getMusicKits(true);}

	/**
	 * Generate Rarities index.
	 * @return {Array.<Rarity>} List of Rarity objects. One object represent one rarity.
	 * @public
	 */
	getRarities(indexed = false) {
		/*jshint camelcase: false */
		const self = this;
		const timer = misc.generateTimer();
		self.logger.info('');
		self.logger.info('');
		self.logger.info('-----------------------------------------');
		self.logger.info('---------- Rarities Generation ----------');
		self.logger.info('-----------------------------------------');
		self.logger.info('');
		const rawrarities = this.itemsData.items_game.rarities;
		const rawcolors = this.itemsData.items_game.colors;
		let rarities;

		(indexed ? rarities={} : rarities=[]);
		Object.keys(rawrarities).forEach(function(key) {
			const timerRarity = misc.generateTimer();
			// Hack for melee weapon :s
			let wepName
			if (rawrarities[key].loc_key_weapon === 'Rarity_Unusual') {
				wepName = '★ ' + self.getLangValue('RI_M');
			} else {
				wepName = self.getLangValue(rawrarities[key].loc_key_weapon);
			}
			if (indexed) {
				const i = rawrarities[key].value;
				rarities[i] = {
					'techName':key,
					'weaponName':wepName,
					'miscName':self.getLangValue(rawrarities[key].loc_key),
					'color':rawcolors[rawrarities[key].color].hex_color
				};
			} else {
				const rarity = new Rarity();
				rarity.weaponName = wepName;
				rarity.techName = key;
				rarity.miscName = self.getLangValue(rawrarities[key].loc_key);
				rarity.color = rawcolors[rawrarities[key].color].hex_color;
				rarity.defIndex = rawrarities[key].value;
				rarities.push(rarity);
			}
			self.logger.info('Fetch ' + key + ' rarity [' + misc.resultTimer(timerRarity) +'s]');
		});

		const totalRarity=Object.keys(rarities).length;
		self.logger.info('-----------------------------------------');
		self.logger.info('Generate ' + totalRarity + ' rarities [' + misc.resultTimer(timer) +'s]');
		return rarities;
	}
	getRaritiesIndexed() { return this.getRarities(true);}
}
module.exports = CSGODataParser;
