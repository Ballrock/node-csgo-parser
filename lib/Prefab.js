'use strict';
/* jshint node: true */

/**
 * @typedef Prefab
 * @type Object
 * @property {String} name I18N name of the prefab object
 * @property {String} techName Technical name of the prefab object
 * @property {String} defIndex Index/Key of the prefab 
 * @property {String} type Type of the prefab object
 */

/**
 * Standard return for a Prefab.
 * @class
 */
class Prefab {
	/** @constructor */
	constructor(name, techName, defIndex, type){
		this.name = name;
		this.techName = techName;
		this.defIndex = defIndex;
		this.type = type;
	}
	
}

module.exports = Prefab;