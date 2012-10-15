define([
    'vendor/moment',
    './../column',
    'strings'
], function(moment, Column, strings) {
    var fmt = strings.datetime_format || 'YYYY-MM-DD h:mm A';
    return function asDateTime(options) {
        if (options && options.prototype && options.extend) {
            asDateTime.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }
        this.getValue = function(model) {
            return moment(model.get(this.get('name'))).format(fmt);
        };
    };
});
