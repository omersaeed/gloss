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
            columnsClass: EmptyColumnModel,

            // coule be true, false, or 'multi'
            selectable: false,

            // this is the attribute set on the model corresponding to which
            // grid row is selected. so if you want to know which model is
            // selected in a grid, you can do something like:
            //
            //     grid.get('collection').where(grid.get('selectedAttr'), true);
            //
            // if this is left as 'null', then selectedAttr will be set to
            // something unique to the grid instance at instantiation time.
            //
            // this, of course, doesn't matter if 'selectable' is false
            selectedAttr: null
        },

        template: template,

        init: function() {
            var selectable;

            this._super.apply(this, arguments);

            this.$tbody = this.$el.find('table.rows tbody');

            this.$thead = this.$el.find('table.header thead');

            this.set('columnModel',
                this.get('columnModelClass')({grid: this}), {silent: true});

            if (this.get('selectedAttr') == null) {
                this.set({
                    selectedAttr: '_' + this.el.id + '_selected'
                }, {silent: true});
            }

            if ((selectable = this.get('selectable'))) {
                var method = /multi/i.test(selectable)?
                    '_onMultiselectableRowClick' : '_onSelectableRowClick';
                this.on('click', 'tbody tr', _.bind(this[method], this));
            }

            // for testing and debugging purposes
            this._renderCount = this._renderRowCount = 0;

            this.update(this.options);
        },

        _modelFromTr: function(tr) {
            return this.get('models')[this.$tbody.children('tr').index(tr)];
        },

        _onModelChange: function(eventName, coll, model, changed) {
            console.log(this.el.id+' changing '+model.get("text_field"));
            this.rerender(model);
        },

        _onSelectableRowClick: function(evt) {
            var selectedModel = this._modelFromTr(evt.currentTarget);
            this.select(selectedModel);
        },

        _rerender: function() {
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

            this._renderCount++;
            console.log([
                    'render time for',
                    this.get('models').length+':',
                    Date.now() - start
                ].join(' '));
        },

        _rerenderRow: function(model) {
            var currentRow = this._trFromModel(model);
            $(this.get('columnModel').renderTr(model)).insertAfter(currentRow);
            $(currentRow).remove();
            this._renderRowCount++;
            console.log('rerendered row for',
                    model.get(this.get('columnModel').columns[0].name));
        },

        _sort: function(opts) {
            var ascending, self = this, column = self.get('sort.column');
            if (!column.sortable || !self.get('models')) {
                return;
            }
            ascending = self.get('sort.direction').search(/asc/i),
            self.set('models',
                // copy the models array then sort it
                self.get('models').slice(0).sort(function(a, b) {
                    return (ascending? 1 : -1) * sort.userFriendly(
                        a.get(column.name), b.get(column.name));
                }), opts);
        },

        _trFromModel: function(model) {
            return this.$tbody.children('tr').eq(
                _.indexOf(this.get('models'), model));

        },

        rerenderHeader: function() {
            this.$thead.html(this.get('columnModel').renderHeaderTr());
            return this;
        },

        rerender: function() {
            var method = arguments.length > 0? '_rerenderRow' : '_rerender';
            this[method].apply(this, arguments);
            return this;
        },

        select: function(model) {
            var models = this.get('models'), a = this.get('selectedAttr');

            if (!/multi/i.test(this.get('selectable'))) {
                _.each(models, function(m) {
                    if (m !== model && m.get(a)) {
                        m.del(a);
                    }
                });
            }

            model.set(a, true);

            return this;
        },

        unselect: function(model) {
            var models = this.get('models'),
                a = this.get('selectedAttr'),
                unselectModels = _.isArray(model)? [model] : model,
                changed = [];

            _.each(models, function(m) {
                if (m.get(a)) {
                    if (!unselectModels || _.indexOf(unselectModels, m) >= 0) {
                        changed.push(m);
                    }
                }
                m.del(a, {silent: true});
            });

            if (changed.length > 1) {
                this.rerender();
            } else if (changed.length === 1) {
                this.rerender(changed[0]);
            }

            return this;
        },

        update: function(updated) {
            var colName, rerenderHeader, rerender, sort;

            rerenderHeader = rerender = sort = false;

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
                rerenderHeader = rerender = sort = true;
            }
            if (updated.models) {
                rerender = true;
                if (this.get('sort.column')) {
                    sort = true;
                }
            }
            if (updated.collection) {
                this.get('collection')
                    .on('change', _.bind(this._onModelChange, this));
            }

            if (sort) {
                this._sort({silent: true});
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
