'use strict';
/* jshint node: true */

/**
 * @typedef SkinPaint
 * @type Object
 * @property {String} name I18N name of the paint/skin
 * @property {String} techName Technical name of the paint/skin
 * @property {String} weaponTechName Technical name of the weapon
 * @property {String} fullName I18N Full name of the Skin (doesn't contain Statrak or (Quality) information. Beside, knifes got their little star :p)
 * @property {String} rarity Rarity of this paint (inexplicably, some of them are wrong on items file regarding in-game reality)
 */

/**
 * Standard return for a skin/paint
 * @class Weapon
 */
class SkinPaint {
	/**
	 * @constructor
	 */
	constructor(name, techName, weaponTechName, fullName, defIndex, rarity){
		this.name = name;
		this.techName = techName;
		this.weaponTechName = weaponTechName;
		this.fullName = fullName;
		this.defIndex = defIndex;
		this.rarity = rarity;
	}
}

module.exports = SkinPaint;