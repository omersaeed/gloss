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
            self.columns = _.map(self.columnClasses || [], function(cls, i) {
                var opts = {grid: grid};
                if (i === 0) {
                    opts.first = true;
                }
                if (i === self.columnClasses.length-1) {
                    opts.last = true;
                }
                return cls(opts).appendTo($tr);
            });
        },
        renderTr: trTemplate
    });
});
