define([
    'vendor/moment',
    './../column',
    'strings'
], function(moment, Column, strings) {
    var fmt = strings.datetime_format || 'YYYY-MM-DD h:mm A';
    return Column.extend({
        getValue: function(model) {
            return moment(model.get(this.get('name'))).format(fmt);
        }
    });
});
