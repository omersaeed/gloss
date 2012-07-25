define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    './statefulwidget',
    './grid/row',
    './draggable',
    './tooltip',
    'css!./grid/grid.css'
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
            }).on('click', function(evt) {
                evt.preventDefault();
                return false;
            });
        }
    }, {mixins: [Draggable]});

    return StatefulWidget.extend({
        defaults: {
            rowWidgetClass: Row,
            rows: null,

            // set this to true to automatically bind row click events to
            // .highlight() and make the cursor a pointer
            highlightable: false,

            // when the grid renders a list of models, if `highlightable` is
            // true, then it will check each of them for the field specified by
            // `highlightableField`, and if it is truthy, it will render it as
            // a highlighted field
            //
            // set this to 'null' to disable automatically setting values on
            // the model when a row is highlighted
            highlightableGridModelField: '_selected',

            // because it's so expensive to change an element when it's already
            // in the dom, it's often faster to re-render the entire grid
            // (outside the dom) even though only a portion of it changed.
            // this is where that is adjusted
            tippingPoint: 50
        },

        nodeTemplate: '<div><div class=table-wrapper><table class=grid><thead><tr></tr></thead><tbody></tbody></table></div></div>',

        managedStates: ['disabled'],

        create: function() {
            var self = this, $tr;
            self._super();
            if (!self.$node.children().length) {
                self.$node.append($(self.nodeTemplate).children());
            }
            self.$node.addClass('grid');
            self.options.rows = [];
            self.$table = self.$node.find('table');
            self.$tbody = self.$node.find('tbody');
            if (!self.options.nostyling) {
                self.$node.addClass('standard');
            }

            if (self.options.highlightable) {
                self.on('mousedown.highlightable', 'tbody tr', function() {
                    self._rowInstanceFromTrElement(this).highlight();
                }).$node.addClass('highlightable');
            }

            self.onPageClick('mouseup.unhighlight', self.onPageClickUnhighlight);
            self.update();
        },

        _buildHeader: function() {
            var $tr = this.$table.find('thead tr'),
                self = this;
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
                        var total,
                            thPos = $th.offset(),
                            diff = pos.clientX - thPos.left;
                        if (diff > 0) {
                            self.$table.innerWidth(
                                _.reduce($th.siblings(), function(total, th) {
                                    return total + $(th).outerWidth();
                                }, diff));
                            $th.outerWidth(diff);
                            self.$table.css({tableLayout: 'fixed'});
                        } else {
                            if (resizeHandle.node.style.removeProperty) {
                                resizeHandle.node.style.removeProperty('left');
                            }
                        }
                    });
                    resizeHandle.$node.prependTo($th);
                }
                
                if (col.sortable) {       
                    var $orderSpans = $(' <span class=asc-arrow>&#x25b2;</span><span class=desc-arrow>&#x25bc;</span>');                    
                    if (col.resizable) {
                        $th.find('.buffer').append($orderSpans);
                    } else {
                        $th.append($orderSpans);
                    }
                    $th.addClass('sort-null');
                    $th.on('click', function(evt) {
                        if (col.order === 'asc') {
                            col.order = 'desc';
                        } else {
                            col.order = 'asc';
                        }
                        self._sortData(self, col);
                    });                                   
                } 
                $th.appendTo($tr);
                
                // initial sorting
                if (col.sortable && col.order !== undefined) {
                    self._sortData(self, col);
                }
            });
        },

        _compare: function(colName, colOrder) {
            return function(a,b) {
                var result = 0;
                if (!a[colName] && !b[colName]) {
                    result = 0;
                } else if (!a[colName]) {
                    result = -1;
                } else if (!b[colName]) {
                    result = 1;
                } else {               
                    result = ((a[colName] < b[colName]) ? -1 : ((a[colName] > b[colName]) ? 1 : 0));
                }
                
                result *= colOrder === 'asc'? 1 : -1;
                
                return result;
            };
        },
        
        _initRowsAndHeader: function() {
            var self = this;
            self.options.rows = [];

            self.options.colModel =
                self.options.rowWidgetClass.prototype.defaults.colModel;

            if (! self.col) {
                self.col = _.reduce(self.options.colModel, function(cols, col) {
                    cols[col.name] = col;
                    return cols;
                }, {});
            }
            _.each(self.options.rowWidgetClass.prototype.defaults.events, function(evt) {
                self.on(evt.on, 'tr ' + (evt.selector || ''), function(e) {
                    var i, l, $tr, row, rows = self.options.rows, $el = $(this);
                    if ($el[0].tagName.toLowerCase() === 'tr') {
                        $tr = $el;
                    } else {
                        $tr = $el.closest('tr');
                    }
                    row = self._rowInstanceFromTrElement($tr[0]);
                    if (row) {
                        row[evt.callback](e);
                    }
                });
            });
            self._buildHeader();
        },

        _rowInstanceFromTrElement: function(el) {
            var i, len, rows = this.options.rows || [];
            for (i = 0, len = rows.length; i < len; i++) {
                if (rows[i].node === el) {
                    return rows[i];
                }
            }
        },

        _setModels: function() {
            var startTime = new Date();
            var i, model, newRow, attachTbodyToTable = false,
                options = this.options,
                rowWidgetClass = options.rowWidgetClass,
                models = options.models || [],
                len = models.length,
                rows = options.rows,
                rowsLen = rows.length,
                $tbody = this.$tbody,
                tbody = $tbody[0],
                selectedModel = null;

            // track what was highlighted ONLY IF it's not being tracked in the
            // models, i.e. this.options.highlightableGridModelField is null
            if (this._highlighted && options.highlightableGridModelField == null) {
                selectedModel = this._highlighted.options.model;
            }
                        
            if (this._shouldFullyRender()) {
                $tbody.remove();
                $tbody = this.$tbody = $('<tbody></tbody>');
                options.rows = rows = [];
                rowsLen = 0;
                attachTbodyToTable = true;
            }
            
            if (this._sortedColumn){
                models = models.sort(this._compare(this._sortedColumn.name, this._sortedColumn.order));
            }
            
            this.unhighlight({modifyModel: false});
            
            for (i = 0; i < len; i++) {
                model = models[i];
                if (i >= rowsLen) {
                    newRow = this.makeRow(model, i);
                    $tbody.__append__(newRow.node);
                    rows.push(newRow);
                } else {
                    this.setModel(rows[i], model);
                }
                
                // if the highlighted row is NOT being tracked at the model
                // level (only being tracked by the grid), then highlight the
                // row
                if (selectedModel && model === selectedModel) {
                    this.highlight(rows[i]);

                // if the highlighted row IS being tracked at the model level,
                // then use that to set the highlight
                } else if (options.highlightableGridModelField &&
                           model[options.highlightableGridModelField]) {
                    this.highlight(rows[i]);
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
            // console.log('render time for',this.id,':',new Date() - startTime);
        },

        _shouldFullyRender: function() {
            var options = this.options, models = options.models;
            return !models || models.length - options.rows.length > options.tippingPoint;
        },

        _sortData: function(self, col, ignoreSameColumnSort) {
            var $sortColHeader = self.$node.find('thead th.col-'+ col.name), 
                $sortedColHeader = null;
            // display sort-order indicator
            if (self._sortedColumn) {
                $sortedColHeader = self.$node.find('thead th.col-'+ self._sortedColumn.name);
                $sortedColHeader.removeClass('sort-asc sort-desc').addClass('sort-null');
            } 
            $sortColHeader
                .removeClass('sort-null')
                .addClass(col.order === 'asc'? 'sort-asc': 'sort-desc');
            
            // set will take care of sorting
            self._sortedColumn = col;
            if (self.options.models) {
                self.set('models', self.options.models);                                                        
            }
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
            if (this.highlighted() !== whichRow) {
                this.unhighlight();
                whichRow.$node.addClass('highlight');
                this._highlighted = whichRow;
                if (this.options.highlightableGridModelField) {
                    whichRow.options.model.set(
                        this.options.highlightableGridModelField, true);
                }
                this.trigger('highlight');
            }
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

        unhighlight: function(params) {
            if (!params) {
                params = {modifyModel: true};
            }
            if (this._highlighted) {
                this._highlighted.$node.removeClass('highlight');
                if (this.options.highlightableGridModelField && params.modifyModel) {
                    this._highlighted.options.model.set(
                        this.options.highlightableGridModelField, false);
                }
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
            if (updated.rowWidgetClass) {
                var self = this,
                    tbody = this.$tbody[0],
                    $tr = this.$table.find('thead tr');
                for (var i=0; i < this.options.rows.length; i++) {
                    tbody.removeChild(this.options.rows[i].node);
                }
                $tr.children().remove();
                self._initRowsAndHeader();
            }
        },

        showColumn: function(colName) {
            var self= this;
            self._generateHideColumnCSS();
            if (self.$node.hasClass('hide-col-'+ colName)) {
                self.$node.removeClass('hide-col-'+ colName);
            }
        },
        
        hideColumn: function(colName) {
            var self= this;
            self._generateHideColumnCSS();
            if (!self.$node.hasClass('hide-col-'+ colName)) {
                self.$node.addClass('hide-col-'+ colName);
            }
        },
        
        toggleColumn: function(colName) {
            var self= this;
            self._generateHideColumnCSS();
            if (!self.$node.hasClass('hide-col-'+ colName)) {
                self.hideColumn(colName);
            } else {
                self.showColumn(colName);
            }
        },

        _generateHideColumnCSS: function() {
            var self= this,
                hideColumnCss = '',
                $lastStyleElement = $('style:last');
                
            if (self.hideColumnCssGenerated) {
                return;
            }
                
            _.each(self.options.colModel, function(col, i) {
                hideColumnCss = hideColumnCss + '#' + self.id + '.hide-col-'+ col.name + ' .col-' + col.name + ' { display: none; } ';
            });
            
            // if a style tag exists in the dom then append CSS to the last element otherwise create a new tag for the CSS
            if ($lastStyleElement && $lastStyleElement.length > 0) {
                $lastStyleElement.html( $lastStyleElement.html() + hideColumnCss);
            } else {
                $('<style>').text(hideColumnCss).appendTo('head');
            }
            
            
            self.hideColumnCssGenerated = true;
        }
        
    });
});

