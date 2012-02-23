define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/draggable',
    'vendor/gloss/widgets/draggablerow',
    'vendor/gloss/widgets/droppable'
], function($, _, Draggable, DraggableRow, Droppable) {
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
        _draggableCheckTargets: function(evt) {
            var rowIndex, where, $row/*, rows = this.options.grid.options.rows*/;
            if (inside(evt, this._targets) && ! inside(evt, this._nonTargets)) {
                rowIndex = getRowIndex(evt, this._targets, this._$visibleRows);
                where = whereInRow(rowIndex % 1);
                $row = this._$visibleRows.eq(parseInt(rowIndex, 10));
                if (this._$lastRow && $row[0] !== this._$lastRow[0]) {
                    this._$lastRow.removeClass('hover');
                    this._$insertDiv.addClass('hidden');
                }
                this._$lastRow = $row;
                if (where === 'before') {
                    $row.removeClass('hover');
                    this._$insertDiv
                        .css({top: $row.position().top - 3})
                        .removeClass('hidden');
                } else if (where === 'after') {
                    $row.removeClass('hover');
                    this._$insertDiv
                        .css({top: $row.position().top + $row.outerHeight() - 3})
                        .removeClass('hidden');
                } else {
                    $row.addClass('hover');
                    this._$insertDiv.addClass('hidden');
                }
            } else if (this._$lastRow) {
                this._$lastRow.removeClass('hover');
                this._$insertDiv.addClass('hidden');
                delete this._$lastRow;
            }
        },
        _draggableDrop: function(evt, mousePos) {
            // var self = this, visibleRowIndex, rowIndex, row, where, dest, i,
            //     rows = self.options.grid.options.rows,
            //     $visibleRows = self.options.grid.$tbody.find('tr:visible');
                // rowIndex = getRowIndex(mousePos, self._targets, rows),
                // row = rows[parseInt(rowIndex, 10)],
                // where = whereInRow(rowIndex % 1),
                // dest = row.options.idx;
            var i;
            var row;
            var dest;
            var rows = this.options.grid.options.rows;
            var rowIndex = getRowIndex(mousePos, this._targets, this._$visibleRows);
            var where = whereInRow(rowIndex % 1);
            var $row = this._$visibleRows.eq(parseInt(rowIndex, 10));
            for (i = rows.length-1; i >= 0; i--) {
                if (rows[i].node === $row[0]) {
                    row = rows[i];
                    break;
                }
            }
            dest = row.options.node.index();
            if (!inside(mousePos, this._targets) ||
                inside(mousePos, this._nonTargets)) {
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
        },
        _draggableOnMouseUp: function(evt) {
            _super('_draggableOnMouseUp').call(this, evt);
            this.options.grid.off('mousemove.draggable-treegrid');
            // this._droppedIndex = getRowIndex(evt, this._targets, this._$visibleRows);
            // this._$droppedOn = this._$visibleRows.eq(parseInt(this._droppedIndex, 10));
            delete this._targets;
            delete this._nonTargets;
            this._$insertDiv.remove();
            delete this._$insertDiv;
            _.each(this.options.grid.options.rows, function(row) {
                row.$node.removeClass('hover');
            });
            delete this._$visibleRows;
        },
        _draggableStart: function(evt) {
            var self = this, $children = $(null),
                children = self._childRows() || [],
                position = self.$node.position(),
                width = self.$node.innerWidth(),
                rows = self.options.grid.options.rows,
                firstChildPos = rows[0].$node.position(),
                lastRowPos = _.last(rows).$node.position(),
                lastChildPos = (_.last(children) || self).$node.position();
            _super('_draggableStart').call(self, evt);
            self._nonTargets = {
                top: position.top,
                bottom: lastChildPos.top + (_.last(children) || self).$node.innerHeight()
            };
            self._targets = {
                top: firstChildPos.top,
                bottom: lastRowPos.top + _.last(rows).$node.innerHeight()
            };
            self._$visibleRows = self.options.grid.$tbody.find('tr:visible');
            self.options.grid.on('mousemove.draggable-treegrid', 'tr', function(evt) {
                self._draggableCheckTargets(evt);
            });
            _.each(children, function(child) {
                $children = $children.add(child.$node.clone(false, false));
            });
            self._$draggableEl.find('tbody').append($children);
            self._$insertDiv = $('<div class="insert hidden">')
                .width(width)
                .css({left: position.left})
                .appendTo(self.options.grid.$node);
            self.on('dragend', function(evt, data) {
                self._draggableDrop(evt, data);
            });
        }
    });

    // return $.extend({}, DraggableRow, Droppable, {
    //     __mixin__: function(base, prototype, mixin) {
    //         DraggableRow.__mixin__.apply(this, arguments);
    //         Droppable.__mixin__.apply(this, arguments);
    //     },
    //     __updateWidget__: function(updated) {
    //         var self = this;
    //         if (updated.dragTargets && self._drag) {
    //             self.options.grid.on('mousemove.drag', function(evt) {
    //                 self._deliverToTarget(evt);
    //             });
    //         }
    //     },
    //     afterInit: function() {
    //         var self = this;
    //         DraggableRow.afterInit.apply(self, arguments);
    //         Droppable.afterInit.apply(self, arguments);
    //     },
    //     ondragstart: function(evt) {
    //         var self = this,
    //             grid = self.options.grid,
    //             $targets = $(null),
    //             idx = self.options.idx,
    //             childRows = self._childRows(),
    //             lastChildIdx = (_.last(childRows) || self).options.idx;

    //         self.set('dragTargets', _.chain(self.options.grid.options.rows)
    //             .filter(function(row) {
    //                 return row.options.idx < idx || row.options.idx > lastChildIdx;
    //             })
    //             .filter(function(row) {
    //                 return row.$node.is(':visible');
    //             })
    //             .value());

    //         self._drag.$visibleRows = $(_.pluck(self.options.dragTargets, 'node'));

    //         $(_.map(childRows, function(row) { return row.$node[0]; }))
    //             .clone(false, false)
    //             .appendTo(self._drag.$el.find('tbody'));

    //         this._drag.targetDim = {
    //             top: grid.rows[0].$node.position().top,
    //             bottom: _.last(grid.rows).$node.position().top +
    //                     _.last(grid.rows).$node.outerHeight()
    //         };
    //         this._drag.nonTargetDim = {
    //             top: this.$node.position().top,
    //             bottom: _.last(childRows).position().top + 
    //                     _.last(childRows).$node.outerHeight()
    //         };
    //     },
    //     _deliverToTarget: function(evt) {
    //         if (!inside(evt, this._drag.targetDim) || inside(evt, this._drag.nonTargetDim)) {
    //             return undefined;
    //         }
    //         console.log(evt);
    //     },
    //     _dragOnMouseUp: function(evt) {
    //         Draggable._dragOnMouseUp.apply(this, arguments);
    //         this.options.grid.off('mousemove.drag');
    //     }
    // });
});


