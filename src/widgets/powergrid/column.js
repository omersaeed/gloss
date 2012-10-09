define([
    'vendor/underscore',
    './../../view',
    'tmpl!./th.mtpl',
    'tmpl!./td.mtpl'
], function(_, View, thTemplate, tdTemplate) {
    var outerWidth = function($el, width) {
        var actualWidth = width - _.reduce([
                'margin-left', 'border-left-width', 'padding-left',
                'border-right-width', 'margin-right', 'padding-right'
            ], function(memo, p) {
                return memo + parseInt($el.css(p), 10);
            }, 0);
        $el.css({
            width:    actualWidth,
            minWidth: actualWidth,
            maxWidth: actualWidth
        });
    };
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

        get: function(key) {
            return key === 'width'?
                this.$el.outerWidth() : this._super.apply(this, arguments);
        },

        renderTd: tdTemplate,

        update: function(updated) {
            var newWidth;
            if (updated.sort) {
                this.render();
            }
            if (updated.width) {
                newWidth = View.prototype.get.call(this, 'width');
                this.get('grid').set('fixedLayout', true);
                outerWidth(this.$el, newWidth);
            }
            this.trigger('columnchange', {column: this, updated: updated});
        }
    });
});
