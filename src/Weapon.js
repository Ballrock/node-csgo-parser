'use strict';
/* jshint node: true */

/**
 * @typedef Weapon
 * @type Object
 * @property {String} name I18N name of the weapon
 * @property {String} techName Technical name of the weapon
 * @property {String} type Weapon category (Pistol, Rifle, SMG...)
 * @property {String} defIndex Technical index in CSGO Schema
 * @property {Array.<SkinPaint>} skins List of skins for this Weapon
 */

/**
 * Standard return for a Weapon.
 * @class
 */
class Weapon {
	/** @constructor */
	constructor(name, techName, type, defIndex, skins){
		this.name = name;
		this.techName = techName;
		this.type = type;
		this.defIndex = defIndex;
		this.skins = skins;
	}
	
}

module.exports = Weapon;