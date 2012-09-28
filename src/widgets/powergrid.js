// TODO:
//  - grid row selection
//       - multi-selection
//  - settable column widths
//       - setting column widths via CSS
//       - setting via column model config
//       - re-setting widths
//       - resizeable via DnD
//  - hide/show column
//  - static header
//  - edit row
//  - re-render only one row?
//       - maybe just add support for responding to collection 'change' events?
define([
    'vendor/jquery',
    'vendor/underscore',
    './../view',
    './ascollectionviewable',
    './powergrid/columnmodel',
    './../util/sort',
    'tmpl!./powergrid/powergrid.mtpl',
    'css!./powergrid/powergrid.css'
], function($, _, View, asCollectionViewable, ColumnModel, sort, template) {

    var EmptyColumnModel = ColumnModel.extend({});

    var PowerGrid = View.extend({
        defaults: {
            columnsClass: EmptyColumnModel
        },

        template: template,

        init: function() {
            this._super.apply(this, arguments);

            this.$tbody = this.$el.find('table.rows tbody');

            this.$thead = this.$el.find('table.header thead');

            this.set('columnModel',
                this.get('columnModelClass')({grid: this}), {silent: true});

            this.update(this.options);
        },

        _sort: function(opts) {
            var self = this,
                ascending = self.get('sort.direction').search(/asc/i),
                column = self.get('sort.column');
            if (!column.sortable || !self.get('models')) {
                return;
            }
            self.set('models',
                // copy the models array then sort it
                self.get('models').slice(0).sort(function(a, b) {
                    return (ascending? 1 : -1) * sort.userFriendly(
                        a.get(column.name), b.get(column.name));
                }), opts);
        },

        rerenderHeader: function() {
            this.$thead.html(this.get('columnModel').renderHeaderTr());
        },

        rerender: function() {
            var i, l, rows = [],
                columns = this.get('columnModel'),
                models = this.get('models');

            var start = Date.now();

            if (!columns || !models) {
                return;
            }

            for (i = 0, l = models.length; i < l; i++) {
                rows.push(columns.renderTr(models[i]));
            }

            this.$tbody.html(rows.join(''));

            console.log('render time for',this.get('models').length+':',Date.now() - start);

            return this;
        },

        update: function(updated) {
            var colName,
                rerenderHeader = false,
                rerender = false,
                alreadySorted = false;

            if (updated.columnModel) {
                rerenderHeader = rerender = true;
            }
            if (this.get('columnModel') &&
                updated.sort || updated['sort.direction'] || updated['sort.column']) {
                if (_.isString(this.get('sort.column'))) {
                    colName = this.get('sort.column');
                    this.set('sort.column',
                        _.find(this.get('columnModel').columns, function(c) {
                            return c.name === colName;
                        }), {silent: true});
                }
                this._sort({silent: true});
                alreadySorted = true;
                rerenderHeader = rerender = true;
            }
            if (updated.models) {
                rerender = true;
                if (this.get('sort.column') && !alreadySorted) {
                    this._sort({silent: true});
                }
            }

            if (rerenderHeader) {
                this.rerenderHeader();
            }
            if (rerender) {
                this.rerender();
            }
        }
    });

    asCollectionViewable.call(PowerGrid.prototype);

    return PowerGrid;
});
