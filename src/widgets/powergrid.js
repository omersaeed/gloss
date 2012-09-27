define([
    'vendor/jquery',
    './../view',
    './ascollectionviewable',
    './powergrid/columns',
    'tmpl!./powergrid/powergrid.mtpl',
    'css!./powergrid/powergrid.css'
], function($, View, asCollectionViewable, Columns, template) {

    var EmptyColumnModel = Columns.extend({});

    var PowerGrid = View.extend({
        defaults: {
            columnsClass: EmptyColumnModel
        },

        template: template,

        init: function() {
            var columns;

            this._super.apply(this, arguments);

            this.$tbody = this.$el.find('table.rows tbody');

            this.$thead = this.$el.find('table.header thead');

            this.set('columns', columns = this.get('columnsClass')());
        },

        _renderHeader: function() {
            this.$thead.html(this.get('columns').renderHeaderTr());
        },

        _setHeaderWidths: function() {
            var $tr = $(this.$tbody[0].childNodes[0]),
                $ths = this.$thead.find('th');

            $tr.children().each(function(i, el) {
                var $th = $ths.eq(i),
                    thWidth = $th.outerWidth(),
                    $td = $(el),
                    tdWidth = $td.outerWidth();
                if (thWidth > tdWidth) {
                    $td.outerWidth($th.outerWidth());
                } else {
                    $th.outerWidth($td.outerWidth());
                }
            });
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

            this.$tbody.html(rows.join(''));

            this._setHeaderWidths();

            return this;
        },

        update: function(updated) {
            if (updated.columns) {
                this._renderHeader();
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
