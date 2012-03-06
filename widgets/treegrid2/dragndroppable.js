define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/draggable',
    'vendor/gloss/widgets/draggablerow'
], function($, _, Draggable, DraggableRow) {
    var _super = function(name) {
        return DraggableRow[name] || Draggable[name];
    };
    var inside = function(evt, dims) {
        var y = evt.clientY;
        return y > dims.top && y < dims.bottom;
    };

    // this returns a floating point number, for example, a return value of 2.3
    // means that the user is hovering over the row whose index is 2 (the third
    // row), and is hovering 30% of the way down the row.  that 30% is useful
    // when deciding whether the user wants to drop into the row or next to the
    // row
    var getRowIndex = function(evt, dims, $rows) {
        var height = dims.bottom - dims.top;
        return (evt.clientY - dims.top) / height * $rows.length;
    };

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
            var rowIndex, where, $row/*, rows = this.options.grid.options.rows*/;
            if (inside(evt, this._drag.targets) && ! inside(evt, this._drag.nonTargets)) {
                rowIndex = getRowIndex(evt, this._drag.targets, this._drag.$visibleRows);
                where = whereInRow(rowIndex % 1);
                $row = this._drag.$visibleRows.eq(parseInt(rowIndex, 10));
                if (this._drag.$lastRow && $row[0] !== this._drag.$lastRow[0]) {
                    this._drag.$lastRow.removeClass('hover');
                    this._drag.$insertDiv.addClass('hidden');
                }
                this._drag.$lastRow = $row;
                if (where === 'before') {
                    $row.removeClass('hover');
                    this._drag.$insertDiv
                        .css({top: $row.position().top - 3})
                        .removeClass('hidden');
                } else if (where === 'after') {
                    $row.removeClass('hover');
                    this._drag.$insertDiv
                        .css({top: $row.position().top + $row.outerHeight() - 3})
                        .removeClass('hidden');
                } else {
                    $row.addClass('hover');
                    this._drag.$insertDiv.addClass('hidden');
                }
            } else if (this._drag.$lastRow) {
                this._drag.$lastRow.removeClass('hover');
                this._drag.$insertDiv.addClass('hidden');
                delete this._drag.$lastRow;
            }
        },
        _dragDrop: function(evt, mousePos) {
            var i, row, dest,
                rows = this.options.grid.options.rows,
                rowIndex = getRowIndex(mousePos, this._drag.targets, this._drag.$visibleRows),
                where = whereInRow(rowIndex % 1),
                $row = this._drag.$visibleRows.eq(parseInt(rowIndex, 10));
            this.off('dragend');
            for (i = rows.length-1; i >= 0; i--) {
                if (rows[i].node === $row[0]) {
                    row = rows[i];
                    break;
                }
            }
            if (row) {
                dest = row.options.node.index();
                if (!inside(mousePos, this._drag.targets) ||
                    inside(mousePos, this._drag.nonTargets)) {
                    return;
                }
                if (this.options.node.par === row.options.node.par &&
                    rowIndex > this.options.node.index()) {
                    dest--;
                }
                if (where === 'before') {
                    this.moveTo(row._parentRow(), dest);
                } else if (where === 'after') {
                    this.moveTo(row._parentRow(), dest+1);
                } else {
                    this.moveTo(row);
                }
            }
        },
        _dragOnMouseUp: function(evt) {
            this._drag.$insertDiv.remove();
            _super('_dragOnMouseUp').call(this, evt);
            $(document).off('mousemove.drag-treegrid');
            _.each(this.options.grid.options.rows, function(row) {
                row.$node.removeClass('hover');
            });
            this.off('dragend');
        },
        _dragStart: function(evt) {
            var self = this, $children = $(null),
                children = self._childRows() || [],
                position = self.$node.position(),
                width = self.$node.innerWidth(),
                rows = self.options.grid.options.rows,
                firstChildPos = rows[0].$node.position(),
                lastRowPos = _.last(rows).$node.position(),
                lastChildPos = (_.last(children) || self).$node.position();
            self.options.grid.unhighlight();
            _super('_dragStart').call(self, evt);
            self._drag.nonTargets = {
                top: position.top,
                bottom: lastChildPos.top + (_.last(children) || self).$node.innerHeight()
            };
            self._drag.targets = {
                top: firstChildPos.top,
                bottom: lastRowPos.top + _.last(rows).$node.innerHeight()
            };
            self._drag.$visibleRows = self.options.grid.$tbody.find('tr:visible');
            $(document).on('mousemove.drag-treegrid', '#'+self.options.grid.id+' tr', function(evt) {
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
        }
    });
});


