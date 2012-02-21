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
    return $.extend({}, DraggableRow, {
        // _draggableOnMouseMove: function(evt) {
        //     console.log('in the draggable mouse move:',evt.clientX,evt.clientY,evt.target);
        //     _super('_draggableOnMouseMove').call(this, evt);
        // },
        _draggableCheckTargets: function(evt) {
            if (inside(evt, this._targets) && ! inside(evt, this._nonTargets)) {
                console.log('over eligible row');
            }
        },
        _draggableOnMouseUp: function(evt) {
            _super('_draggableOnMouseUp').call(this, evt);
            this.options.grid.off('mousemove.draggable-treegrid');
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
        }
    });
});


