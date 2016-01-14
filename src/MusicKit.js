'use strict';
/* jshint node: true */

/**
 * @typedef MusicKit
 * @type Object
 * @property {String} name I18N name of the music kit
 * @property {String} techName Technical name of the music kit
 * @property {String} defIndex Index/Key of the music kit
 */

/**
 * Standard return for a MusicKit.
 * @class
 */
class MusicKit {
	/** @constructor */
	constructor(name, techName, defIndex){
		this.name = name;
		this.techName = techName;
		this.defIndex = defIndex;
	}
	
}

module.exports = MusicKit;