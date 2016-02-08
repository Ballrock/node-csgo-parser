'use strict';
/* jshint node: true, mocha:true */

var	parser = require('../src/csgo-data-parser');
var assert = require('chai').assert;

var schemaFilePath = 'test/test-data/schema.txt', 
	langFilePath = 'test/test-data/csgo_english.txt',
	itemsFilePath = 'test/test-data/items_game.txt',
	outLogFilePath = 'test.log';
var csgoDataParser = new parser(schemaFilePath, langFilePath, itemsFilePath, 'error', outLogFilePath);

describe('CSGOParser', function(){
	describe('Unit Test', function(){
		describe('Preparing CSGOParser',function() {
			it('Data Initialized', function() {
				assert.isTrue(csgoDataParser.isDatasInitialized());
			});
			it('Lang Initialized', function() {
				assert.isTrue(csgoDataParser.isLangInitialized());
			});
		});
		describe('Check Datas Initilization', function(){
			var oldItems = csgoDataParser.itemsData;
			var oldSchema = csgoDataParser.schemaData;
			it('No Items', function() {
				csgoDataParser.itemsData = undefined;
				csgoDataParser.schemaData = oldSchema;
				assert.isFalse(csgoDataParser.isDatasInitialized());
			});
			it('No Schema', function() {
				csgoDataParser.itemsData = oldItems;
				csgoDataParser.schemaData = undefined;
				assert.isFalse(csgoDataParser.isDatasInitialized());
			});
			it('Neither Items & Schema', function() {
				csgoDataParser.itemsData = undefined;
				csgoDataParser.schemaData = undefined;
				assert.isFalse(csgoDataParser.isDatasInitialized());
			});
			it('Both are Present', function() {
				csgoDataParser.itemsData = oldItems;
				csgoDataParser.schemaData = oldSchema;
				assert.isTrue(csgoDataParser.isDatasInitialized());
			});
		});
		describe('Check Lang Initilization', function(){
			var oldLang = csgoDataParser.langData;
			it('No Lang', function() {
				csgoDataParser.langData = undefined;
				assert.isFalse(csgoDataParser.isLangInitialized());
			});
			it('Lang is Present', function() {
				csgoDataParser.langData = oldLang;
				assert.isTrue(csgoDataParser.isLangInitialized());
			});
		});
		describe('Private function _getWeaponNameFromTechnicalName', function(){
			var oldLang = csgoDataParser.langData;
			var testWpOK = 'weapon_deagle';
			var returnOK = 'Desert Eagle';
			var testWpKO = 'weapon_deagle_ko';
			var returnNoLang = '#SFUI_WPNHUD_DesertEagle';
			it('Must return \'Deagle\'', function() {
				var returnName = csgoDataParser._getWeaponNameFromTechnicalName(testWpOK);
				assert.equal(returnName,returnOK);
			});
			it('Must return \'undefined\'', function() {
				var returnName = csgoDataParser._getWeaponNameFromTechnicalName(testWpKO);
				assert.isUndefined(returnName);
			});
			it('Must return \'#SFUI_WPNHUD_DesertEagle\'', function() {
				csgoDataParser.langData = undefined;
				var returnName = csgoDataParser._getWeaponNameFromTechnicalName(testWpOK);
				assert.equal(returnName,returnNoLang);
				csgoDataParser.langData = oldLang;
			});
		});
		describe('Private function _getPaintNameAndDefIndexFromTechnicalName', function(){
			var oldLang = csgoDataParser.langData;
			var testPaintOK = 'cu_m4a1_hyper_beast';
			var returnNameOK = 'Hyper Beast';
			var returnDefIndexOk = '430';
			var testPaintKO = 'cu_m4a1_hyper_beast_ko';
			var returnNoLang = '#PaintKit_cu_m4a1_hyper_beast_Tag';
			it('Must return \'Hyper Beast\' and 430', function() {
				var returnName = csgoDataParser._getPaintNameAndDefIndexFromTechnicalName(testPaintOK);
				assert.equal(returnName[0],returnNameOK);
				assert.equal(returnName[1],returnDefIndexOk);
			});
			it('Must return \'undefined\'', function() {
				var returnName = csgoDataParser._getPaintNameAndDefIndexFromTechnicalName(testPaintKO);
				assert.isUndefined(returnName[0]);
				assert.isUndefined(returnName[1]);
			});
			it('Must return \'#PaintKit_cu_m4a1_hyper_beast_Tag\' and 430', function() {
				csgoDataParser.langData = undefined;
				var returnName = csgoDataParser._getPaintNameAndDefIndexFromTechnicalName(testPaintOK);
				assert.equal(returnName[0],returnNoLang);
				assert.equal(returnName[1],returnDefIndexOk);
				csgoDataParser.langData = oldLang;
			});
		});
		describe('Private function _getSkinByWeapon', function(){
			var testWpOK = 'weapon_deagle';
			var testWpKO = 'weapon_deagle_ko';
			it('Must return at least 1 skin', function() {
				var returnArray = csgoDataParser._getSkinsByWeapon(testWpOK);
				assert.operator(returnArray.length, '>', 1);
			});
			it('Must return 0 result', function() {
				var returnArray = csgoDataParser._getSkinsByWeapon(testWpKO);
				assert.equal(returnArray.length, 0);
			});
		});
		describe('Private function _cleanCompositeIconName', function(){
			var icondeagle = 'econ/default_generated/weapon_deagle_hy_ddpat_urb_light';
			var iconknife = 'econ/default_generated/weapon_knife_karambit_hy_ddpat_light';
			it('Deagle | Urban DDPAT', function() {
				var returnObject = csgoDataParser._cleanCompositeIconName(icondeagle, 'weapon_deagle');
				assert.isTrue(returnObject.status);
				assert.equal(returnObject.weaponTechName,'weapon_deagle');
				assert.equal(returnObject.skinTechName,'hy_ddpat_urb');
			});
			it('Karambit | Forest DDPAT', function() {
				var returnObject = csgoDataParser._cleanCompositeIconName(iconknife, 'weapon_knife_karambit');
				assert.isTrue(returnObject.status);
				assert.equal(returnObject.weaponTechName,'weapon_knife_karambit');
				assert.equal(returnObject.skinTechName,'hy_ddpat');
			});
			it('KO', function() {
				var returnObject = csgoDataParser._cleanCompositeIconName(icondeagle, 'weapon_deagle2');
				assert.isFalse(returnObject.status);
			});
		});
		describe('Private function _getItemsByPrefabViaSchema', function(){
			var prefab = 'campaign_prefab';
			var prefabko = 'campaign_prefab2';
			it('Must return at least 1 result', function() {
				var returnArray = csgoDataParser._getItemsByPrefabViaSchema(prefab);
				assert.operator(returnArray.length, '>', 1);
			});
			it('Must return 0 result', function() {
				var returnArray = csgoDataParser._getItemsByPrefabViaSchema(prefabko);
				assert.equal(returnArray.length, 0);
			});
		});
		describe('Private function _getDefIndexOnSchema', function(){
			var indexok = 1;
			var indexko = -10;
			it('Get defIndex 1', function() {
				var returnObject = csgoDataParser._getDefIndexOnSchema(indexok);
				assert.equal(returnObject.name, 'weapon_deagle');
			});
			it('KO', function() {
				var returnObject = csgoDataParser._getDefIndexOnSchema(indexko);
				assert.isUndefined(returnObject);
			});
		});
		describe('Public function getLangValue', function(){
			var oldLang = csgoDataParser.langData;
			var langTag = '#PaintKit_cu_m4a1_hyper_beast_Tag';
			it('Language Defined', function() {
				var returnObject = csgoDataParser.getLangValue(langTag);
				assert.equal(returnObject, 'Hyper Beast');
			});
			it('Language Not Defined', function() {
				csgoDataParser.langData = undefined;
				var returnObject = csgoDataParser.getLangValue(langTag);
				assert.equal(returnObject, langTag);
				csgoDataParser.langData = oldLang;
			});
		});
		describe('Public function getLogger', function(){
			var oldLog = csgoDataParser.logger;
			it('Logger Defined', function() {
				var returnObject = csgoDataParser.getLogger();
				assert.isDefined(returnObject);
			});
			it('Logger Not Defined', function() {
				csgoDataParser.logger = undefined;
				var returnObject = csgoDataParser.getLogger();
				assert.isUndefined(returnObject);
				csgoDataParser.logger = oldLog;
			});
		});
	});
	describe('Integration Test', function(){
		this.timeout(0);
		describe('Public function getWeapons', function(){
			it('Weapons List', function() {
				var returnObject = csgoDataParser.getWeapons();
				assert.operator(returnObject.length, '>', 20);
			});
			it('Weapons List Indexed', function() {
				var returnObject = csgoDataParser.getWeaponsIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 20);
			});
		});
		describe('Public function getCollections', function(){
			it('Collections List', function() {
				var returnObject = csgoDataParser.getCollections();
				assert.operator(returnObject.length, '>', 10);
			});
			it('Collections List Indexed', function() {
				var returnObject = csgoDataParser.getCollectionsIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 10);
			});
		});
		describe('Public function getExteriors', function(){
			it('Exteriors List', function() {
				var returnObject = csgoDataParser.getExteriors();
				assert.operator(returnObject.length, '>', 1);
			});
		});
		describe('Public function getOrigins', function(){
			it('Origins List', function() {
				var returnObject = csgoDataParser.getOrigins();
				assert.operator(returnObject.length, '>', 10);
			});
			it('Origins List Indexed', function() {
				var returnObject = csgoDataParser.getOriginsIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 10);
			});
		});
		describe('Public function getCases', function(){
			it('Cases List', function() {
				var returnObject = csgoDataParser.getCases();
				assert.operator(returnObject.length, '>', 10);
			});
			it('Cases List Indexed', function() {
				var returnObject = csgoDataParser.getCasesIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 10);
			});
		});
		describe('Public function getCaseKeys', function(){
			it('Case Keys List', function() {
				var returnObject = csgoDataParser.getCaseKeys();
				assert.operator(returnObject.length, '>', 10);
			});
			it('Case Keys List Indexed', function() {
				var returnObject = csgoDataParser.getCaseKeysIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 10);
			});
		});
		describe('Public function getStickers', function(){
			it('Stickers List', function() {
				var returnObject = csgoDataParser.getStickers();
				assert.operator(returnObject.length, '>', 100);
			});
			it('Stickers List Indexed', function() {
				var returnObject = csgoDataParser.getStickersIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 100);
			});
		});
		describe('Public function getMusicKits', function(){
			it('Music Kits List', function() {
				var returnObject = csgoDataParser.getMusicKits();
				assert.operator(returnObject.length, '>', 10);
			});
			it('Music Kits List Indexed', function() {
				var returnObject = csgoDataParser.getMusicKitsIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 10);
			});
		});
		describe('Public function getRarities', function(){
			var returnObject = csgoDataParser.getRarities();
			it('Rarities List', function() {
				assert.operator(returnObject.length, '>', 4);
			});
			it('Rarities Unusual Test', function() {
				returnObject.forEach(function(element) {
					if(element.techName === 'unusual'){
						assert.equal(element.weaponName.indexOf('★ '), 0);
					}
				});
			});
			it('Rarities List Indexed', function() {
				var returnObject = csgoDataParser.getRaritiesIndexed();
				assert.operator(Object.keys(returnObject).length, '>', 4);
			});
		});
	});
});