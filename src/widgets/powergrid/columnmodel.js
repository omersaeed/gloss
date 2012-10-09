define([
    'vendor/underscore',
    './../../view',
    'tmpl!./tr.mtpl'
], function(_, View, trTemplate) {
    return View.extend({
        template: '<thead><tr></tr></thead>',
        init: function() {
            var self = this, grid, $tr;

            self._super.apply(this, arguments);

            if (! (grid = self.get('grid'))) {
                throw Error('ColumnModel class must be instantiated with grid instance');
            }

            $tr = self.$el.find('tr');
            self.columns = _.map(self.columnClasses || [], function(cls) {
                return cls({grid: grid}).appendTo($tr);
            });
        },
        renderTr: trTemplate
    });
});
