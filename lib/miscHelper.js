'use strict';

/**
 * Prototype Object
 * Normalized search in keys (Valve seems to like put different case type between lang file and schema).
 * @this {Object} Object to get value of
 * @param {String} Unnormalized value 
 * @return {Object} Data.
 * @private
 */
Object.defineProperty(Object.prototype, 'getValue', {
    value: function (prop) {
        var self = this;
        for (var key in self) {
            if (key.toLowerCase() === prop.toLowerCase()) {
                return self[key];
            }
            
        }
    }
});

/**
 * Prototype String
 * Remove # on i18n key for lang search.
 * @this {String} i18n key
 * @return {String} i18n key without #.
 * @private
 */
Object.defineProperty(String.prototype, 'prepareLang', {
	value: function() {
		var self=this;
		if (self.charAt(0) === '#') {
			self=self.slice(1);
		}
		return self;
	}
});

/**
 * Prototype Array
 * HashTable light implementation, only push once. If object already present, do nothing
 * @this {Array} HashTable Array
 * @private
 */
Object.defineProperty(Array.prototype, 'pushUnique', {
	value: function(value) {
		var self=this;
		var isPresent = false;
		for (var key in self) {
			if (value === self[key]) {
				isPresent = true;
			}
		}
		if (!isPresent) {
			self.push(value);
		}
	}
});

/**
 * Prototype Array
 * HashTable light implementation, only push once named object. If object already present, do nothing
 * @this {Array} HashTable Array
 * @private
 */
Object.defineProperty(Array.prototype, 'pushUniqueNamedObject', {
	value: function(value) {
		var self=this;
		var isPresent = false;
		for (var key in self) {
			if (value.name === self[key].name) {
				isPresent = true;
			}
		}
		if (!isPresent) {
			self.push(value);
		}
	}
});

/**
 * Prototype String
 * Split itself on space to check if value is present
 * @this {String} String to check on split
 * @param {String} value Value to check in this
 * @return {boolean} true if present, false otherwise
 * @private
 */
Object.defineProperty(String.prototype, 'containsOnSpaceSplit', {
	value: function(value) {
		var self=this;
		var splitArray=self.split(' ');
		var isPresent = false;
		for (var key in splitArray) {
			if (splitArray[key] === value) {
				isPresent = true;
			}
		}
		return isPresent;
	}
});

/**
 * Generate a timer
 * @return {Array} Returns the current high-resolution real time in a [seconds, nanoseconds] tuple Array. 
 * @private
 */
exports.generateTimer = function(){
    return process.hrtime();
};

/**
 * Get the result diff timer
 * @param {Array} timer to diff with
 * @return {Float} Diff. 
 * @private
 */
exports.resultTimer = function(timer){
    var diff = process.hrtime(timer);
    return ((diff[0]*1e9+diff[1])*1e-9).toFixed(4);
};



