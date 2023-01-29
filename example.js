'use strict';
/* jshint node: true */

const fs = require('fs'),
	parser = require('./lib/csgo-data-parser'),
	misc = require('./lib/miscHelper'),
	path = require('path');

const schemaFilePath = './test/test-data/schema.txt',
	langFilePath = './test/test-data/csgo_english.txt',
	itemsFilePath = './test/test-data/items_game.txt',
	outDataFilePath = './out/data_' + Date.now() + '.json',
	outLogFilePath = './out/logs/parser.log';

// create the output log directory if it doesn't exist
const outLogDir = path.dirname(outLogFilePath)
if (!fs.existsSync(outLogDir)){
	fs.mkdirSync(outLogDir, { recursive: true });
}

const csgoDataParser = new parser(schemaFilePath, langFilePath, itemsFilePath, 'debug', outLogFilePath);

const timer = misc.generateTimer();

const infos={};
infos.stickers = csgoDataParser.getStickersMap();
infos.origins = csgoDataParser.getOrigins();
infos.collections = csgoDataParser.getCollections();
infos.cases = csgoDataParser.getCases();
infos.casekeys = csgoDataParser.getCaseKeys();
infos.musickits = csgoDataParser.getMusicKits();
infos.exteriors = csgoDataParser.getExteriors();
infos.rarities = csgoDataParser.getRarities();
infos.baseWeapons = csgoDataParser.getWeapons();
infos.skins = csgoDataParser.getSkinsMap();

csgoDataParser.getLogger().info('');
csgoDataParser.getLogger().info('-----------------------------------------');
csgoDataParser.getLogger().info('-----------------------------------------');
csgoDataParser.getLogger().info('');
csgoDataParser.getLogger().info('End Generations [' + misc.resultTimer(timer) +'s]');

// create the output data directory if it doesn't exist
const outDataDir = path.dirname(outDataFilePath)
if (!fs.existsSync(outDataDir)){
	fs.mkdirSync(outDataDir, { recursive: true });
}

const fd = fs.openSync(outDataFilePath, 'w');
fs.writeSync(fd, JSON.stringify(infos));
fs.closeSync(fd);
