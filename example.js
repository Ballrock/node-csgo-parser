'use strict';
/* jshint node: true */

var fs = require('fs'),
	parser = require('./lib/csgo-data-parser'),
	misc = require('./lib/miscHelper');

var schemaFilePath = './test/test-data/schema.txt', 
	langFilePath = './test/test-data/csgo_english.txt',
	itemsFilePath = './test/test-data/items_game.txt',
	outDataFilePath = './out/data_' + Date.now() + '.json',
	outLogFilePath = './out/logs/parser.log';

var csgoDataParser = new parser(schemaFilePath, langFilePath, itemsFilePath, 'debug', outLogFilePath);

var timer = misc.generateTimer();

var infos={};
infos.baseWeapons = csgoDataParser.getWeapons();
infos.exteriors = csgoDataParser.getExteriors();
infos.origins = csgoDataParser.getOrigins();
infos.collections = csgoDataParser.getCollections();
infos.cases = csgoDataParser.getCases();
infos.casekeys = csgoDataParser.getCaseKeys();
infos.stickers = csgoDataParser.getStickers();
infos.musickits = csgoDataParser.getMusicKits();
infos.rarities = csgoDataParser.getRarities();

csgoDataParser.getLogger().info('');
csgoDataParser.getLogger().info('-----------------------------------------');
csgoDataParser.getLogger().info('-----------------------------------------');
csgoDataParser.getLogger().info('');
csgoDataParser.getLogger().info('End Generations [' + misc.resultTimer(timer) +'s]');

var fd = fs.openSync(outDataFilePath, 'w');
fs.writeSync(fd, JSON.stringify(infos,null,4));
fs.closeSync(fd);