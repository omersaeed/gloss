define([
    'vendor/underscore',
    'bedrock/class',
    'tmpl!./columnHeader.mtpl',
    'tmpl!./column.mtpl'
], function(_, Class, columnHeaderTemplate, columnTemplate) {
    return Class.extend({
        init: function(options) {
            var self = this;

            _.extend(self, options || {});
            self.label = self.label || self.name;

            if (! self.grid) {
                throw Error('column must be initialized with grid instance');
            }

            self.grid.on('click', 'th.sortable.col-' + self.name, function() {
                var cur = self.grid.get('sort.direction');
                self.grid.set({
                    'sort.column': self,
                    'sort.direction': cur && /asc/i.test(cur)?
                        'descending' : 'ascending'
                });
            });
        },

        renderTd: columnTemplate,
        renderTh: columnHeaderTemplate
    });
});
