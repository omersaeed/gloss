define([
    'vendor/jquery',
    'vendor/underscore',
    'link!vendor/gloss/widgets/draggable/draggable.css'
], function($, _) {
    return {
        __mixin__: function(base, prototype, mixin) {
            var draggable;
            if (!prototype.defaults) {
                prototype.defaults = {};
            }
            if (!prototype.defaults.draggable) {
                prototype.defaults.draggable = {};
            }
            draggable = prototype.defaults.draggable;
            if (draggable.autoBind == null) {
                draggable.autoBind = true;
            }
            if (!draggable.dimensions) {
                draggable.dimensions = {x: true, y: true};
            }
        },
        afterInit: function() {
            var self = this;
            if (self.options.draggable.autoBind) {
                self.on('mousedown', function(evt) {
                    self.startDrag(evt);
                });
            }
        },
        startDrag: function(evt) {
            var self = this;
            self._drag = {
                pos: self.$node.position(),
                offset: { }
            };
            self._drag.offset.left = evt.clientX - self._drag.pos.left;
            self._drag.offset.top = evt.clientY - self._drag.pos.top;
            self.on('mousemove.drag-start', function(evt) {
                self._dragStart(evt);
            }).on('mouseup.drag-start', function() {
                self.off('mouseup.drag-start mousemove.drag-start');
                delete self._drag;
            });
        },
        _dragStart: function(evt) {
            var self = this;
            self.off('mouseup.drag-start mousemove.drag-start');
            $(document).on('mousemove.drag', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self._dragOnMouseMove(evt);
                return false;
            }).on('mouseup.drag', function(evt) {
                self._dragOnMouseUp(evt);
            });
            $('body').addClass('dragging-element');
            if (self.options.draggable.clone) {
                self._drag.$el = self._dragCloneEl();
            } else {
                self._drag.$el = self.$node;
            }
            self._drag.$el.addClass('dragging');
            self._dragSetPos(evt, self._drag.offset);
            self.trigger('dragstart');
        },
        _dragOnMouseMove: function(evt) {
            this._dragSetPos(evt, this._drag.offset);
        },
        _dragOnMouseUp: function(evt) {
            if (typeof this._drag !== 'undefined') {
                this.trigger('dragend', {
                    clientX: evt.clientX,
                    clientY: evt.clientY
                });
                if (this.options.draggable.clone) {
                    this._drag.$el.remove();
                } else {
                    this._drag.$el.addClass('dragged');
                }
                this._drag.$el.removeClass('dragging');
            }
            $(document).off('mouseup.drag mousemove.drag');
            $('body').removeClass('dragging-element')
            delete this._drag;
        },
        _dragCloneEl: function() {
            return this.$node.clone(false, false);
        },
        _dragSetPos: function(evt, offset) {
            var val = {}, dims = this.options.draggable.dimensions;
            if (dims.x) {
                val.left = evt.clientX - (offset? offset.left : 0);
            }
            if (dims.y) {
                val.top = evt.clientY - (offset? offset.top : 0);
            }
            this._drag.$el.css(val);
        }
    };
});
