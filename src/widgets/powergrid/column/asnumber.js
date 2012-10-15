define([
    'vendor/jquery',
    'vendor/underscore',
    './../../../util/format'
], function($, _, format) {
    return function asNumber(options) {
        if (options && options.prototype && options.extend) {
            asNumber.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }

        this.defaults = $.extend({}, this.defaults, {
            // leave as null for no decimals
            decimalPlaces: null
        }, options);

        this.cssClasses = _.wrap(this.cssClasses, function(func) {
            return 'number ' +
                func.apply(this, Array.prototype.slice.call(arguments, 1));
        });

        this.getValue = function(model) {
            return format.number(
                model.get(this.get('name')),
                this.get('decimalPlaces'));
        };
    };
});
