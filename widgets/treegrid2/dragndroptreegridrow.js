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
    var rowIndex = function(evt, dims, rows) {
        var height = dims.bottom - dims.top;
        return (evt.clientY - dims.top) / height * rows.length;
    };
    return $.extend({}, DraggableRow, {
        _draggableCheckTargets: function(evt) {
            var idx, where, row, rows = this.options.grid.options.rows;
            if (inside(evt, this._targets) && ! inside(evt, this._nonTargets)) {
                idx = rowIndex(evt, this._targets, rows);
                where = idx % 1;
                row = rows[parseInt(idx, 10)];
                if (this._lastRow && row !== this._lastRow) {
                    this._lastRow.$node.removeClass('hover');
                    this._$insertDiv.addClass('hidden');
                }
                this._lastRow = row;
                if (where <= 0.2) {
                    row.$node.removeClass('hover');
                    this._$insertDiv
                        .css({top: row.$node.position().top - 3})
                        .removeClass('hidden');
                } else if (where >= 0.8) {
                    row.$node.removeClass('hover');
                    this._$insertDiv
                        .css({top: row.$node.position().top + row.$node.outerHeight() - 3})
                        .removeClass('hidden');
                } else {
                    row.$node.addClass('hover');
                    this._$insertDiv.addClass('hidden');
                }
            } else if (this._lastRow) {
                this._lastRow.$node.removeClass('hover');
                this._$insertDiv.addClass('hidden');
                delete this._lastRow;
            }
        },
        _draggableOnMouseUp: function(evt) {
            _super('_draggableOnMouseUp').call(this, evt);
            this.options.grid.off('mousemove.draggable-treegrid');
            delete this._targets;
            delete this._nonTargets;
            this._$insertDiv.remove();
            delete this._$insertDiv;
            _.each(this.options.grid.options.rows, function(row) {
                row.$node.removeClass('hover');
            });
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
        }
    });
});


