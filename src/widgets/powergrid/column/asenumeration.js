define([
    'vendor/jquery',
    'vendor/underscore',
    './../../../util/format',
    './../column'
], function($, _, format, Column) {

    return function asEnumeration(options) {
        if (options && options.prototype && options.extend) {
            asEnumeration.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }

        this.defaults = $.extend({}, this.defaults, {
            mapping: null,      // enumeration mappings: {
                                //  enumerationValue1: '<display Value 1>',
                                //  enumerationValue2: '<display Value 2>',
                                //  ...
                                // }
            
            // This option will be used to define default mapping to be used 
            // when either model value is null 
            // or enumeration mapping is not defined for that particular value.
            // Entry for this should exist in the mapping defined above
            'default': 'not_applicable'  
        }, options);

        this.cssClasses = _.wrap(this.cssClasses, function(func, model) {
            // add enumeration value to CSS, to handle value specific formating 
            var classes = func.apply(this, Array.prototype.slice.call(arguments, 1)); 
            return model ? this.getValue(model) + ' ' + classes : 
                classes;
        });
        
        this.getSortValue = function(model) {
            return this._lookup(this.getValue(model), model);
        };
        
        this._lookup = function(value, model) {
            var mapping = this.get('mapping'),
                transformedValue = mapping[this.get('default')];
            
            if (typeof value !== 'undefined' && mapping[value]) {
                transformedValue = mapping[value];
            }
            return transformedValue;
        };

        this.formatValue = function(value, model) {
            return this._lookup(value, model);
        };
    };

});

