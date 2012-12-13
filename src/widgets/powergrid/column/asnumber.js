define([
    'vendor/jquery',
    'vendor/underscore',
    './../../../util/format',
    'tmpl!./asnumber.mtpl'
], function($, _, format, template) {
    function asNumber(options) {
        if (options && options.prototype && options.extend) {
            asNumber.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }

        this.defaults = $.extend({}, this.defaults, {
            // leave as null for no decimals
            decimalPlaces: null,
            decimalPoint: '.',
            thousandsSep: ','
        }, options);

        this.cssClasses = _.wrap(this.cssClasses, function(func) {
            return 'number ' +
                func.apply(this, Array.prototype.slice.call(arguments, 1));
        });

        this.formatValue = asNumber.format;

        this.getTitle = function(formatted, value) {
            return value == null? '' :
                format.number(value, this.get('decimalPlaces',
                                     this.get('decimalPoint'),
                                     this.get('thousandsSep')));
        };
    }

    asNumber.format = function(value, model) {
        var places = this.get('decimalPlaces'),
            decimalPoint = this.get('decimalPoint'),
            thousandsSep = this.get('thousandsSep'),
            formatted = (value != null?  format.number(value, places, decimalPoint, thousandsSep) : '')
                .split(decimalPoint);
        return template({
            value: value,
            integer: formatted[0],
            decimal: formatted[1] || '',
            places: this.get('decimalPlaces')
        });
    };

    return asNumber;
});
