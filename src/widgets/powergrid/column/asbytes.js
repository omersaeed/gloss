define([
    'vendor/jquery',
    'vendor/underscore',
    './../../../util/format',
    './../column'
], function($, _, format, Column) {

    return function asBytes(options) {
        if (options && options.prototype && options.extend) {
            asBytes.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }

        this.defaults = $.extend({}, this.defaults, {
            // mesh defaults to sending bytes in GB, but it gives no indication
            // that this is the case. this should be fixed, but for now we'll
            // just leave this little breadcrumb
            assumeGb: true
        }, options);

        this.cssClasses = _.wrap(this.cssClasses, function(func) {
            return 'bytes ' +
                func.apply(this, Array.prototype.slice.call(arguments, 1));
        });

        this.formatValue = function(value, model) {
            var factor = this.get('assumeGb')? 1.0e9 : 1.0;
            return format.bytes(value * factor);
        };
    };

});

