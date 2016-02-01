'use strict';
/* jshint node: true */

 /**
 * @typedef Collection
 * @type Object
 * @property {String} name I18N name of the collection
 * @property {String} techName Technical name of the collection
 * @property {Array.<SkinPaint>} content skins List of skins for this Collection (Doe'nt contain knifes)
 */

/**
 * Standard return for a collection
 * @class Weapon
 */
class Collection {
	/**
	 * @constructor
	 */
	constructor(name, techName, content){
		this.name = name;
		this.techName = techName;
		this.content = content;
	}
}

module.exports = Collection;