define([
    'vendor/underscore',
    'bedrock/class',
    'tmpl!./tr.mtpl'
], function(_, Class, trTemplate) {
    return Class.extend({
        init: function(options) {
            var self = this;

            _.extend(self, options);

            if (! self.grid) {
                throw Error('Column class (column model) must be instantiated with grid instance');
            }

            self.columns = _.map(self.columnClasses || [], function(cls) {
                return cls({grid: self.grid});
            });
        },
        renderHeaderTr: function() {
            var i, l, columns = this.columns, tr = ['<tr>'];
            for (i = 0, l = columns.length; i < l; i++) {
                tr.push(columns[i].renderTh());
            }
            tr.push('</tr>');
            return tr.join('');
        },
        renderTr: trTemplate
    });
});
