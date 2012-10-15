define([
    'vendor/jquery',
    './../../../util/format',
    './../column'
], function($, format, Column) {

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

        this.getValue = function(model) {
            var factor = this.get('assumeGb')? 1.0e9 : 1.0;
            return format.bytes(model.get(this.get('name')) * factor);
        };
    };

});

