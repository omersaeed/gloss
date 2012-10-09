define([
    'vendor/underscore',
    './../../view',
    'tmpl!./tr.mtpl'
], function(_, View, trTemplate) {
    return View.extend({
        template: '<thead><tr></tr></thead>',
        init: function() {
            var self = this, grid;

            self._super.apply(this, arguments);

            if (! (grid = self.get('grid'))) {
                throw Error('ColumnModel class must be instantiated with grid instance');
            }

            self.columns = _.map(self.columnClasses || [], function(cls) {
                return cls({grid: grid}).appendTo(self.$el.find('tr'));
            });
        },
        renderTr: trTemplate
    });
});
