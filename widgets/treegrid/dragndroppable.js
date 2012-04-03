define([
    'path!jquery',
    'path!underscore',
    'path!gloss:core/class',
    'path!gloss:widgets/draggable',
    'path!gloss:widgets/draggablerow'
], function($, _, Class, Draggable, DraggableRow) {
    var $doc = $(document),

        // we only want to check the drop target every few times the mousemove
        // event fires, so THROTTLE determines that frequency
        THROTTLE = 1,

        _super = function(name) {
            return DraggableRow[name] || Draggable[name];
        };

    var Dimensions = Class.extend({
        init: function(options) {
            this.top = options.top;
            this.bottom = options.bottom;
            this.scrollManager = options.scrollManager;
            this.$rows = options.$rows;
            this.base = this.scrollManager.scrollTop;
        },

        // returns true if the event occurred in this object's dimensions
        inside: function(evt) {
            var scrollManager = this.scrollManager,
                scrollTop = scrollManager.scrollTop,
                y = evt.clientY,
                shift = scrollTop - this.base;
            return  y > (this.top - shift) && y < (this.bottom - shift);
        },

        // this returns a floating point number, for example, a return value of
        // 2.3 means that the user is hovering over the row whose index is 2
        // (the third row), and is hovering 30% of the way down the row.  that
        // 30% is useful when deciding whether the user wants to drop into the
        // row or next to the row
        getRowIndex: function(evt) {
            var height = this.bottom - this.top,
                scrollTop = this.scrollManager.scrollTop,
                shift = scrollTop - this.base;
            return (evt.clientY - this.top + shift) / height * this.$rows.length;
        }
    });

    var whereInRow = function(where) {
        if (where <= 0.2) {
            return 'before';
        } else if (where > 0.8) {
            return 'after';
        } else {
            return 'in';
        }
    };

    return $.extend({}, DraggableRow, {
        _dragCheckTargets: function(evt) {
            var rowIndex, where, $row, insideTargets, insideNonTargets,
               _drag = this._drag;
            if (! _drag.targets || ! (_drag.dndThrottleIndex++) % THROTTLE) {
                return;
            }
            _drag.dndThrottleIndex = 0;
            insideTargets = _drag.targets.inside(evt);
            insideNonTargets = _drag.nonTargets.inside(evt);
            if (insideTargets && ! insideNonTargets) {
                rowIndex = _drag.targets.getRowIndex(evt);
                where = whereInRow(rowIndex % 1);
                $row = _drag.$visibleRows.eq(parseInt(rowIndex, 10));
                if (_drag.$lastRow && $row[0] !== _drag.$lastRow[0]) {
                    _drag.$lastRow.removeClass('hover');
                    _drag.$insertDiv.addClass('hidden');
                }
                _drag.$lastRow = $row;
                if (where === 'before') {
                    $row.removeClass('hover');
                    _drag.$insertDiv
                        .css({top: $row.position().top - 3})
                        .removeClass('hidden');
                } else if (where === 'after') {
                    $row.removeClass('hover');
                    _drag.$insertDiv
                        .css({top: $row.position().top + $row.outerHeight() - 3})
                        .removeClass('hidden');
                } else {
                    $row.addClass('hover');
                    _drag.$insertDiv.addClass('hidden');
                }
            } else if (_drag.$lastRow) {
                _drag.$lastRow.removeClass('hover');
                _drag.$insertDiv.addClass('hidden');
                delete _drag.$lastRow;
            }
        },
        _dragDrop: function(evt, mousePos) {
            var _drag = this._drag, i, row, dest, rows, rowIndex, where, $row;

            this.off('dragend');

            rows = this.options.grid.options.rows;
            if (! _drag.targets) {
                return;
            }

            rowIndex = _drag.targets.getRowIndex(mousePos);
            where = whereInRow(rowIndex % 1);
            $row = _drag.$visibleRows.eq(parseInt(rowIndex, 10));

            for (i = rows.length-1; i >= 0; i--) {
                if (rows[i].node === $row[0]) {
                    row = rows[i];
                    break;
                }
            }

            if (row) {
                dest = row.options.node.index();
                if (!_drag.targets.inside(mousePos) ||
                    _drag.nonTargets.inside(mousePos)) {
                    return;
                }
                if (this.options.node.par === row.options.node.par &&
                    rowIndex > this.options.node.index()) {
                    dest--;
                }
                if (where === 'before') {
                    this.moveTo(row._parentRow(), dest);
                } else if (where === 'after') {
                    if (row.options.model.isparent &&
                            this.options.grid.getExpanded(row.options.node)) {
                        this.moveTo(row, 0);
                    } else {
                        this.moveTo(row._parentRow(), dest+1);
                    }
                } else {
                    if (row.options.model.isparent &&
                            this.options.grid.getExpanded(row.options.node)) {
                        this.moveTo(row, 0);
                    } else {
                        this.moveTo(row);
                    }
                }
            }
        },
        _dragOnMouseUp: function(evt) {
            if (this._drag) {
                if (this._drag.$insertDiv) {
                    this._drag.$insertDiv.remove();
                }
                _.each(this.options.grid.options.rows, function(row) {
                    row.$node.removeClass('hover');
                });
            }
            _super('_dragOnMouseUp').call(this, evt);
            $doc.off('mousemove.drag-treegrid');
            this.off('dragend');
        },
        _dragStart: function(evt) {
            var self = this, $children , lastChildPos, _drag, children,
                position, width, rows, firstChildPos, lastRowPos, lastChild;
            self.options.grid.unhighlight();

            _super('_dragStart').call(this, evt);

            // do this in a setTimeout since it's not immediately necessary and
            // contains several DOM API calls
            setTimeout(function() {
                _drag = self._drag;
                if (! _drag) {
                    return;
                }
                $children = $(null);
                children = (_drag.children = self._childRows() || []);
                position = _drag.pos;
                width = self.$node.innerWidth();
                rows = (_drag.rows = self.options.grid.options.rows);
                firstChildPos = (_drag.firstChildPos = rows[0].$node.position());
                lastRowPos = (_drag.lastRowPos = _.last(rows).$node.position());

                if ((lastChild = _.last(children))) {
                    lastChildPos = _drag.lastChildPos = lastChild.$node.position();
                } else {
                    lastChildPos = _drag.lastChildPos = _drag.pos;
                }

                self._drag.$visibleRows = self.options.grid.$tbody.find('tr:visible');
                $doc.on('mousemove.drag-treegrid', '#'+self.options.grid.id+' tr', function(evt) {
                    self._dragCheckTargets(evt);
                });
                _.each(children, function(child) {
                    $children = $children.add(child.$node.clone(false, false));
                });
                self._drag.$el.find('tbody').append($children);
                self._drag.$insertDiv = $('<div class="insert hidden">')
                    .width(width)
                    .css({left: position.left})
                    .appendTo(self.options.grid.$node);
                self.on('dragend', function(evt, data) {
                    self._dragDrop(evt, data);
                });

                _drag.dndThrottleIndex = 0;
            }, 50);
        },
        _dragSetScrollManager: function() {
            _super('_dragSetScrollManager').apply(this, arguments);
            var _drag = this._drag, position, $lastChild;
            if (! _drag) {
                return;
            }
            position = _drag.pos;
            $lastChild = (_.last(_drag.children) || this).$node;
            this._drag.nonTargets = Dimensions({
                top: position.top,
                bottom: _drag.lastChildPos.top + $lastChild.innerHeight(),
                scrollManager: this._drag.scroll,
                $rows: this._drag.$visibleRows
            });
            this._drag.targets = Dimensions({
                top: _drag.firstChildPos.top,
                bottom: _drag.lastRowPos.top + _.last(_drag.rows).$node.innerHeight(),
                scrollManager: this._drag.scroll,
                $rows: this._drag.$visibleRows
            });
        }
    });
});


