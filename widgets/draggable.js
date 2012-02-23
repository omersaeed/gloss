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
            $('body').on('mousemove.drag', function(evt) {
                self._dragOnMouseMove(evt);
            }).on('mouseup.drag', function(evt) {
                self._dragOnMouseUp(evt);
            }).addClass('dragging-element');
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
            $('body')
                .removeClass('dragging-element')
                .off('mouseup.drag mousemove.drag');
            delete this._drag;
        },
        _dragCloneEl: function() {
            return this.$node.clone(false, false);
        },
        _dragSetPos: function(evt, offset) {
            this._drag.$el.css({
                left: evt.clientX - (offset? offset.left : 0),
                top: evt.clientY - (offset? offset.top : 0)
            });
        }
    };
});
