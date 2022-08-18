# Node-CSGO-Parser

[![Build Status](https://api.travis-ci.org/Ballrock/node-csgo-parser.svg?branche=master)](https://travis-ci.org/Ballrock/node-csgo-parser)
[![Code Climate](https://codeclimate.com/github/Ballrock/node-csgo-parser/badges/gpa.svg)](https://codeclimate.com/github/Ballrock/node-csgo-parser)
[![Test Coverage](https://codeclimate.com/github/Ballrock/node-csgo-parser/badges/coverage.svg)](https://codeclimate.com/github/Ballrock/node-csgo-parser/coverage)
[![Issue Count](https://codeclimate.com/github/Ballrock/node-csgo-parser/badges/issue_count.svg)](https://codeclimate.com/github/Ballrock/node-csgo-parser)
[![npm](https://img.shields.io/npm/dt/node-csgo-parser.svg)](https://www.npmjs.com/package/node-csgo-parser)

Extract Items/Skins/... from raw VDF data files

---
## TODOs

- [ ] Refactoring... This file will be too long
- [ ] Generalization isDatasInitialized
- [ ] Better handle of Little Endian for vdf / Hack dependency
- [ ] Datamining File for more informations
- [ ] DEBUG - Better Handle of Knifes and Rarities (My god, need so much hack ><. Volvo... that's not really clean ^^')
- [ ] To ES6
- [ ] Optimize Performances
- [ ] defindex to int ?

## Installation

`npm install node-csgo-parser --save`

## Usage

``` js
var parser = require('./csgo-data-parser'),

var schemaFilePath = './test/test-data/schema.txt', 
	langFilePath = './test/test-data/csgo_english.txt',
	itemsFilePath = './test/test-data/items_game.txt',
	outLogFilePath = './out/logs/parser.log';

var csgoDataParser = new parser(schemaFilePath, langFilePath, itemsFilePath, 'debug', outLogFilePath);
```

Must pass schema file (like *schema.txt*), language file (like *csgo_english.txt*) and item file (like *item_data.txt*) at VDF format

- **Schema file** can be find in [Steam API](https://lab.xpaw.me/steam_api_documentation.html#IEconItems_730_GetSchema_v2) or as a JSON on api.steampowered.com using your web API key (https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=<API_KEY>&language=en)
- **Language file** can be find in game data files (*steam-data*/csgo/resource/csgo_*language*.txt) or on Github [GameTracking-CSGO](https://github.com/SteamDatabase/GameTracking-CSGO/blob/master/csgo/resource/csgo_english.txt)
- **Items File** can be find both in game data files () and in [Steam API](https://lab.xpaw.me/steam_api_documentation.html#IEconItems_730_GetSchemaURL_v2) (Note : You need do get the items_game_url information) or safely on Github [GameTracking-CSGO](https://github.com/SteamDatabase/GameTracking-CSGO/blob/master/csgo/scripts/items/items_game.txt)

### Example

A sample script is at `example.js`.

## API Documentation

* [CSGODataParser](#CSGODataParser)
    * [new CSGODataParser(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath)](#new_CSGODataParser_new)
    * [.getLogger()](#CSGODataParser+getLogger) ⇒ <code>winston.Logger</code>
    * [.isDatasInitialized()](#CSGODataParser+isDatasInitialized) ⇒ <code>boolean</code>
    * [.isLangInitialized()](#CSGODataParser+isLangInitialized) ⇒ <code>boolean</code>
    * [.getLangValue(keyLang)](#CSGODataParser+getLangValue) ⇒ <code>String</code>
    * [.getWeapons()](#CSGODataParser+getWeapons) ⇒ <code>Array.&lt;Weapon&gt;</code>
    * [.getCollections()](#CSGODataParser+getCollections) ⇒ <code>Array.&lt;Collection&gt;</code>
    * [.getExteriors()](#CSGODataParser+getExteriors) ⇒ <code>Array.&lt;String&gt;</code>
    * [.getCases()](#CSGODataParser+getCases) ⇒ <code>Array.&lt;Prefab&gt;</code>
    * [.getCaseKeys()](#CSGODataParser+getCaseKeys) ⇒ <code>Array.&lt;Prefab&gt;</code>
    * [.getStickers()](#CSGODataParser+getStickers) ⇒ <code>Array.&lt;Sticker&gt;</code>
    * [.getMusicKits()](#CSGODataParser+getMusicKits) ⇒ <code>Array.&lt;MusicKit&gt;</code>
    * [.getRaritiesIndex()](#CSGODataParser+getRaritiesIndex) ⇒ <code>Array.&lt;Rarity&gt;</code>

<a name="new_CSGODataParser_new"></a>
### new CSGODataParser(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath)

| Param | Type | Description |
| --- | --- | --- |
| schemaFilePath | <code>String</code> | Path to schema file. |
| langFilePath | <code>String</code> | Path to csgo_*lang* file. |
| itemsFilePath | <code>String</code> | Path to items_game file. |
| logLevel | <code>String</code> | Winston Log Level, if > info no timing data for generations. |
| logFilePath | <code>String</code> | Choosen file path to write logs. |

<a name="CSGODataParser+getLogger"></a>
### csgoDataParser.getLogger() ⇒ <code>winston.Logger</code>
Return the parser's logger.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>winston.Logger</code> - Winston based Parser's Logger.
**Access:** public  
<a name="CSGODataParser+isDatasInitialized"></a>
### csgoDataParser.isDatasInitialized() ⇒ <code>boolean</code>
Check if datas files are OK.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>boolean</code> - True if datas initialized, false otherwise  
**Access:** public  
<a name="CSGODataParser+isLangInitialized"></a>
### csgoDataParser.isLangInitialized() ⇒ <code>boolean</code>
Check if lang file is OK.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>boolean</code> - True if initialized, false otherwise  
**Access:** public  
<a name="CSGODataParser+getLangValue"></a>
### csgoDataParser.getLangValue(keyLang) ⇒ <code>String</code>
Get the lang value from valve key i18n values.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>String</code> - traduction if langfile initialized and key is present, key otherwise  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| keyLang | <code>String</code> | valve key i18n values (like #PaintKit_aa_fade_Tag) |

<a name="CSGODataParser+getWeapons"></a>
### csgoDataParser.getWeapons() ⇒ <code>Array.&lt;Weapon&gt;</code>
Generate bases Weapons data from schema's data.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Weapon&gt;</code> - List of Objects. One object represent one Weapon.  
**Access:** public  
<a name="CSGODataParser+getCollections"></a>
### csgoDataParser.getCollections() ⇒ <code>Array.&lt;Collection&gt;</code>
Generate collection's data from itemsgame's data.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Collection&gt;</code> - List of Collections. One object represent one Collection.  
**Access:** public  
<a name="CSGODataParser+getExteriors"></a>
### csgoDataParser.getExteriors() ⇒ <code>Array.&lt;String&gt;</code>
Generate exteriors.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;String&gt;</code> - One string represent one exterior type - I18N Name  
**Access:** public  
<a name="CSGODataParser+getCases"></a>
### csgoDataParser.getCases() ⇒ <code>Array.&lt;Prefab&gt;</code>
Generate Weapon/Stickers skin Case list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Prefab&gt;</code> - List of Object. One object represent one case  
**Access:** public  
<a name="CSGODataParser+getCaseKeys"></a>
### csgoDataParser.getCaseKeys() ⇒ <code>Array.&lt;Prefab&gt;</code>
Generate Weapon/Stickers skin Case keys list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Prefab&gt;</code> - List of Object. One object represent one case key  
**Access:** public  
<a name="CSGODataParser+getStickers"></a>
### csgoDataParser.getStickers() ⇒ <code>Array.&lt;Sticker&gt;</code>
Generate Stickers list.
Note : Some unknown stickers are present in the item_game file so they have a rarity set to "default" (id 2 to 12)

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Sticker&gt;</code> - List of Sticker. One object represent one sticker  
**Access:** public  
<a name="CSGODataParser+getMusicKits"></a>
### csgoDataParser.getMusicKits() ⇒ <code>Array.&lt;MusicKit&gt;</code>
Generate MusicKits list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;MusicKit&gt;</code> - List of MusicKit. One object represent one music kit  
**Access:** public  
<a name="CSGODataParser+getRaritiesIndex"></a>
### csgoDataParser.getRaritiesIndex() ⇒ <code>Array.&lt;Rarity&gt;</code>
Generate Rarities index.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array.&lt;Rarity&gt;</code> - List of Rarity objects. One object represent one rarity.  
**Access:** public  
