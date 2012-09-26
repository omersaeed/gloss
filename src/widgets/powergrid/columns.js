define([
    'vendor/underscore',
    'bedrock/class'
], function(_, Class) {
    return Class.extend({
        init: function() {
            this.columns = _.map(this.columnClasses || [], function(cls) {
                return cls();
            });
        },
        renderTr: function(model) {
            var i, l, columns = this.columns, tr = ['<tr>'];
            for (i = 0, l = columns.length; i < l; i++) {
                tr.push(columns[i].renderTd(model));
            }
            tr.push('</tr>');
            return tr.join('');
        }
    });
});
