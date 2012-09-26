define([
    './../view',
    './ascollectionviewable',
    './powergrid/columns',
    'tmpl!./powergrid/powergrid.mtpl'
], function(View, asCollectionViewable, Columns, template) {

    var EmptyColumnModel = Columns.extend({});

    var PowerGrid = View.extend({
        defaults: {
            columnsClass: EmptyColumnModel
        },

        template: template,

        init: function() {
            this._super.apply(this, arguments);

            this.$table = this.$el.find('table.rows tbody');

            this.set('columns', this.get('columnsClass')());
        },

        rerender: function() {
            var i, l, rows = [],
                columns = this.get('columns'),
                models = this.get('models');

            if (!columns || !models) {
                return;
            }

            for (i = 0, l = models.length; i < l; i++) {
                rows.push(columns.renderTr(models[i]));
            }

            this.$table.html(rows.join(''));

            return this;
        },

        update: function(updated) {
            if (updated.columns) {
                this.rerender();
            }
            if (updated.models) {
                this.rerender();
            }
        }
    });

    asCollectionViewable.call(PowerGrid.prototype);

    return PowerGrid;
});
