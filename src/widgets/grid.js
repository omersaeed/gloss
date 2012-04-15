define([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!gloss:widgets/widget',
    'path!gloss:widgets/statefulwidget',
    'path!gloss:widgets/grid/row',
    'path!gloss:widgets/draggable',
    'path!gloss:widgets/tooltip',
    'path!gloss:link!widgets/grid/grid.css'
], function($, _, Widget, StatefulWidget, Row, Draggable, ToolTip) {

    var ResizeHandle = Widget.extend({
        defaults: {
            draggable: {dimensions: {x: true, y: false}}
        },
        nodeTemplate: '<span class=resize-handle></span>',
        create: function() {
            this.$node.on('mousedown', function(evt) {
                evt.preventDefault();
                return false;
            });
        }
    }, {mixins: [Draggable]});

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

        nodeTemplate: '<div><table class=grid><thead><tr></tr></thead><tbody></tbody></table></div>',

        managedStates: ['disabled'],

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
            if (! self.col) {
                self.col = _.reduce(self.options.colModel, function(cols, col) {
                    cols[col.name] = col;
                    return cols;
                }, {});
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
            self._buildHeader();
            self.onPageClick('mouseup.unhighlight', self.onPageClickUnhighlight);
            self.update();
        },

        _buildHeader: function() {
            var $tr = this.$table.find('thead tr');
            _.each(this.options.colModel, function(col, i) {
                var $tooltip = null, $helpIcon = null, $helpText = null;
                if (col.help) {
                    $helpIcon = $('<span>').addClass('icon help').text('?');
                    $helpText = $('<span>').html(col.help);
                    $tooltip = ToolTip($helpText, {target: $helpIcon});
                }

                var resizeHandle,
                    thText = (!col.resizable && col.label) || '',
                    $th = $('<th>').text(thText).addClass('col-'+col.name);
                if (i === 0) {
                    $th.addClass('first');
                }
                if (col.noLeftBorder) {
                    $th.addClass('no-left-border');
                }
                if (col.width != null) {
                    $th.width(col.width);
                }
                if (col.help && !col.resizable) {
                    $th.append($helpIcon).append($helpText);
                }
                if (col.resizable) {
                    var $buffer = $('<span class=buffer/>').text(col.label || '');
                    if (col.help) {
                        $buffer.append($helpIcon).append($helpText);
                    }
                    $th.append($buffer);
                    resizeHandle = ResizeHandle().on('dragend', function(evt, pos) {
                        var thPos = $th.offset(),
                            diff = pos.clientX - thPos.left;
                        if (diff > 0) {
                            $th.outerWidth(diff);
                        } else {
                            if (resizeHandle.node.style.removeProperty) {
                                resizeHandle.node.style.removeProperty('left');
                            }
                        }
                    });
                    resizeHandle.$node.prependTo($th);
                }
                $th.appendTo($tr);
            });
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
            console.log('render time for',this.id,':',new Date() - startTime);
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

        highlight: function(whichRow) {
            this.unhighlight();
            whichRow.$node.addClass('highlight');
            this._highlighted = whichRow;
            this.trigger('highlight');
            return this;
        },

        highlighted: function() {
            return this._highlighted;
        },

        makeRow: function(model, index) {
            return this.options.rowWidgetClass(undefined, {
                model: model,
                grid: this,
                parentWidget: this,
                idx: index
            });
        },

        onPageClickUnhighlight: function() {
            this.unhighlight();
            return false; // don't cancel the callback
        },

        rerender: function() {
            return this.set('models', this.options.models);
        },

        setColWidth: function(col, width) {
            if (_.isString(col)) {
                col = this.col[col];
            }
            col.width = width;
            this.$table.find('thead th.col-'+col.name).outerWidth(width);
        },

        setModel: function(row, model) {
            row.set('model', model);
        },

        unhighlight: function() {
            if (this._highlighted) {
                this._highlighted.$node.removeClass('highlight');
                delete this._highlighted;
                this.trigger('unhighlight');
            }
            return this;
        },

        updateWidget: function(updated) {
            if (updated.models) {
                this._setModels();
                return;
            }
            if (updated.height) {
                this.$node
                    .addClass('fixed-height')
                    .outerHeight(this.options.height);
            }
        }
    });
});
