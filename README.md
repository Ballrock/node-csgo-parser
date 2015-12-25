# Node-CSGO-Parser

![Build Status](https://api.travis-ci.org/Ballrock/node-csgo-parser.svg?branche=master)
[![Code Climate](https://codeclimate.com/github/Ballrock/node-csgo-parser/badges/gpa.svg)](https://codeclimate.com/github/Ballrock/node-csgo-parser)
[![npm](https://img.shields.io/npm/dt/node-csgo-parser.svg)](https://www.npmjs.com/package/node-csgo-parser)

Extract Items/Skins/... from raw VDF data files

---
## TODOs

- [ ] Generalization isDatasInitialized
- [ ] Better handle of Little Endian for vdf / Hack dependency
- [ ] Items image download (unique method)
- [ ] Generate technical unique id for each datas
- [ ] Retrieve Item Quality
- [ ] Datamining File for more informations

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

Must passing schema file (like *schema.txt*), language file (like *csgo_english.txt*) and item file (like *item_data.txt*) at VDF format

- **Schema file** can be find in [Steam API](https://lab.xpaw.me/steam_api_documentation.html#IEconItems_730_GetSchema_v2)
- **Language file** can be find in game data file (*steam-data*/csgo/resource/csgo_*language*.txt)
- **Items File** can be find both in game data file () and in [Steam API](https://lab.xpaw.me/steam_api_documentation.html#IEconItems_730_GetSchemaURL_v2) (Note : You need do get the items_game_url information)

### Example

A sample script is at `example.js`.

## API Documentation

* [CSGODataParser](#CSGODataParser)
    * [new CSGODataParser(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath)](#new_CSGODataParser_new)
    * [.getLogger()](#CSGODataParser+getLogger) ⇒ <code>winston.Logger</code>
    * [.isDatasInitialized()](#CSGODataParser+isDatasInitialized) ⇒ <code>boolean</code>
    * [.isLangInitialized()](#CSGODataParser+isLangInitialized) ⇒ <code>boolean</code>
    * [.getLangValue(keyLang)](#CSGODataParser+getLangValue) ⇒ <code>String</code>
    * [.getWeapons()](#CSGODataParser+getWeapons) ⇒ <code>Array</code>
    * [.getCollections()](#CSGODataParser+getCollections) ⇒ <code>Array</code>
    * [.getExteriors()](#CSGODataParser+getExteriors) ⇒ <code>Array</code>
    * [.getCases()](#CSGODataParser+getCases) ⇒ <code>Array</code>
    * [.getCaseKeys()](#CSGODataParser+getCaseKeys) ⇒ <code>Array</code>
    * [.getStickers()](#CSGODataParser+getStickers) ⇒ <code>Array</code>
    * [.getMusicKits()](#CSGODataParser+getMusicKits) ⇒ <code>Array</code>

<a name="new_CSGODataParser_new"></a>
### new CSGODataParser(schemaFilePath, langFilePath, itemsFilePath, logLevel, logFilePath)
Parser of CSGOData.


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
### csgoDataParser.getWeapons() ⇒ <code>Array</code>
Generate bases Weapons data from schema's data.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of Objects. One object represent one Weapon.  
**Access:** public  
<a name="CSGODataParser+getCollections"></a>
### csgoDataParser.getCollections() ⇒ <code>Array</code>
Generate collection's data from itemsgame's data.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of Objects. One object represent one Weapon.  
**Access:** public  
<a name="CSGODataParser+getExteriors"></a>
### csgoDataParser.getExteriors() ⇒ <code>Array</code>
Generate exteriors.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of String. One string represent one exterior type.  
**Access:** public  
<a name="CSGODataParser+getCases"></a>
### csgoDataParser.getCases() ⇒ <code>Array</code>
Generate Weapon/Stickers skin Case list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of String. One string represent one case.  
**Access:** public  
<a name="CSGODataParser+getCaseKeys"></a>
### csgoDataParser.getCaseKeys() ⇒ <code>Array</code>
Generate Weapon/Stickers skin Case keys list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of String. One string represent one case key.  
**Access:** public  
<a name="CSGODataParser+getStickers"></a>
### csgoDataParser.getStickers() ⇒ <code>Array</code>
Generate Stickers list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of String. One string represent one sticker.  
**Access:** public  
<a name="CSGODataParser+getMusicKits"></a>
### csgoDataParser.getMusicKits() ⇒ <code>Array</code>
Generate MusicKits list.

**Kind**: instance method of <code>[CSGODataParser](#CSGODataParser)</code>  
**Returns**: <code>Array</code> - List of String. One string represent one music kit  
**Access:** public  

