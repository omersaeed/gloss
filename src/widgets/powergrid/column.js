define([
    'vendor/underscore',
    './../../view',
    'tmpl!./th.mtpl',
    'tmpl!./td.mtpl'
], function(_, View, thTemplate, tdTemplate) {
    return View.extend({
        template: thTemplate,
        init: function() {
            var self = this, grid;

            self._super.apply(this, arguments);

            if (! (grid = self.get('grid'))) {
                throw Error('column must be initialized with grid instance');
            }

            grid.on('click', 'th.sortable.col-' + self.get('name'), function() {
                var cur = self.get('sort');
                self.set('sort', /asc/i.test(cur)? 'descending' : 'ascending');
            });
        },

        renderTd: tdTemplate,

        update: function(updated) {
            if (updated.sort) {
                this.render();
            }
            this.trigger('columnchange', {column: this, updated: updated});
        }
    });
});
