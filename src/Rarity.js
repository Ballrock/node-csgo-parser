'use strict';
/* jshint node: true */

/**
 * @typedef Rarity
 * @type Object
 * @property {String} techName Technical name of the rarity
 * @property {String} weaponName I18N name applied to a weapon
 * @property {String} miscName I18N name applied to others objects (Medal, Music, ...)
 * @property {String} defIndex defIndex Index/Key of the Perfab Object
 * @property {String} color Hexadecimal color value that represent the quality
 */

/**
 * Standard return for a skin/paint
 * @class Weapon
 */
class Rarity {
	/**
	 * @constructor
	 */
	constructor(techName, weaponName, miscName, defIndex, color){
		this.techName = techName;
		this.weaponName = weaponName;
		this.miscName = miscName;
		this.defIndex = defIndex;
		this.color = color;
	}
}

module.exports = Rarity;