define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/statefulwidget',
    'vendor/gloss/widgets/grid/row',
    'link!vendor/gloss/widgets/grid/grid.css'
], function($, _, Widget, StatefulWidget, Row) {
    return StatefulWidget.extend({
        defaults: {
            rowWidgetClass: Row,
            rows: null,

            // because it's so expensive to change an element when it's already
            // in the dom, it's often faster to re-render the entire grid
            // (outside the dom) even though only a portion of it changed.
            // this is where that is adjusted
            tippingPoint: 50
        },

        nodeTemplate: '<div><table><thead><tr></tr></thead><tbody></tbody></table></div>',

        create: function() {
            var self = this, $tr;
            self._super();
            if (!self.$node.children().length) {
                self.$node.append($(self.nodeTemplate).find('table'));
            }
            self.$node.addClass('grid');
            self.options.rows = [];
            self.$table = self.$node.find('table');
            self.$tbody = self.$node.find('tbody');
            if (!self.options.colModel) {
                self.options.colModel =
                    self.options.rowWidgetClass.prototype.defaults.colModel;
            }
            if (!self.options.nostyling) {
                self.$node.addClass('standard');
            }
            _.each(self.options.rowWidgetClass.prototype.defaults.events, function(evt) {
                self.on(evt.on, 'tr ' + (evt.selector || ''), function(e) {
                    var i, l, $tr, row, rows = self.options.rows, $el = $(this);
                    if ($el[0].tagName.toLowerCase() === 'tr') {
                        $tr = $el;
                    } else {
                        $tr = $el.closest('tr');
                    }
                    for (i = 0, l = rows.length; i < l; i++) {
                        row = rows[i];
                        if (row.node === $tr[0]) {
                            row[evt.callback](e);
                            break;
                        }
                    }
                });
            });
            $tr = self.$table.find('thead tr');
            _.each(self.options.colModel, function(col) {
                var $th = $('<th>').text(col.label || '');
                if (col.width != null) {
                    $th.width(col.width);
                }
                $th.appendTo($tr);
            });
            self.onPageClick('mouseup.unhighlight', function() {
                self.unhighlight();
                return false; // don't cancel the callback
            });
            self.update();
        },

        _setModels: function() {
            var startTime = new Date();
            var i, model, newRow, attachTbodyToTable = false,
                options = this.options,
                rowWidgetClass = options.rowWidgetClass,
                models = options.models,
                len = models.length,
                rows = options.rows,
                rowsLen = rows.length,
                $tbody = this.$tbody,
                tbody = $tbody[0];

            if (this._shouldFullyRender()) {
                $tbody.remove();
                $tbody = this.$tbody = $('<tbody></tbody>');
                options.rows = rows = [];
                rowsLen = 0;
                attachTbodyToTable = true;
            }

            for (i = 0; i < len; i++) {
                model = models[i];
                if (i >= rowsLen) {
                    newRow = this.makeRow(model, i);
                    $tbody.__append__(newRow.node);
                    rows.push(newRow);
                } else {
                    this.setModel(rows[i], model);
                }
            }

            // in the case where we've removed models, remove the corresponding
            // rows
            for (; i < rowsLen; i++) {
                tbody.removeChild(rows[i].node);
            }
            if (rowsLen > len) {
                rows.remove(len, rowsLen);
            }

            if (attachTbodyToTable) {
                this.$table.__append__($tbody);
            }
            console.log('render time:',new Date() - startTime);
        },

        _shouldFullyRender: function() {
            var options = this.options;
            return options.models.length - options.rows.length > options.tippingPoint;
        },

        add: function(newModels, idx) {
            var options = this.options, models = options.models;
            if (!_.isArray(newModels)) {
                newModels = [newModels];
            }

            if (idx == null) {
                idx = 0;
            }
            this.set('models', Array.prototype.concat(
                models.slice(0, idx),
                newModels,
                models.slice(idx+1, models.length)
            ));
        },

        highlighted: function() {
            return _.find(this.options.rows, function(row) {
                return row.$node.hasClass('highlight');
            });
        },

        makeRow: function(model, index) {
            return this.options.rowWidgetClass(undefined, {
                model: model,
                grid: this,
                parentWidget: this,
                idx: index
            });
        },

        rerender: function() {
            return this.set('models', this.options.models);
        },

        setModel: function(row, model) {
            row.set('model', model);
        },

        unhighlight: function() {
            _.each(this.options.rows, function(row) {
                row.$node.removeClass('highlight');
            });
            return this;
        },

        updateWidget: function(updated) {
            if (updated.models) {
                this._setModels();
                return;
            }
        }
    });
});

