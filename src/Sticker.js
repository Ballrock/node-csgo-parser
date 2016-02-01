'use strict';
/* jshint node: true */

/**
 * @typedef Sticker
 * @type Object
 * @property {String} name I18N name of the sticker
 * @property {String} techName Technical name of the sticker
 * @property {String} defIndex Index/Key of the sticker
 * @property {String} rarity Rarity of this sticker
 */

/**
 * Standard return for a Sticker.
 * @class
 */
class Sticker {
	/** @constructor */
	constructor(name, techName, defIndex,rarity){
		this.name = name;
		this.techName = techName;
		this.defIndex = defIndex;
		this.rarity = rarity;
	}
	
}

module.exports = Sticker;