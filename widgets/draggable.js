define([
    'vendor/jquery',
    'link!vendor/gloss/widgets/draggable/draggable.css'
], function($) {
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
                    self.draggableOnMouseDown(evt);
                });
            }
        },
        _draggableCloneEl: function($el) {
            return $el.clone(false, false).insertAfter($el);
        },
        _draggableOnMouseMove: function(evt) {
            this._draggableSetPos(evt, this._draggableOffset);
        },
        _draggableOnMouseUp: function(evt) {
            if (this.options.draggable.clone) {
                this._$draggableEl.remove();
            } else {
                this._$draggableEl.addClass('dragged');
            }
            this._$draggableEl.removeClass('dragging');
            $('body').removeClass('dragging-element');
            $(window).off('mouseup.draggable mousemove.draggable');
            delete this._draggablePos;
            delete this._draggableOffset;
        },
        _draggableSetPos: function(evt, offset) {
            this._$draggableEl.css({
                left: evt.clientX - (offset? offset.left : 0),
                top: evt.clientY - (offset? offset.top : 0)
            });
        },
        _draggableStart: function(evt) {
            var self = this;
            self.off('mouseup.draggable-start mousemove.draggable-start');
            $(window).on('mouseup.draggable', function() {
                self._draggableOnMouseUp();
            }).on('mousemove.draggable', function(evt) {
                self._draggableOnMouseMove(evt);
            });
            $('body').addClass('dragging-element');
            if (self.options.draggable.clone) {
                self._$draggableEl = self._draggableCloneEl(self.$node);
            } else {
                self._$draggableEl = self.$node;
            }
            self._$draggableEl.addClass('dragging');
            self._draggableSetPos(evt, self._draggableOffset);
            self.trigger('dragstart');
        },
        draggableOnMouseDown: function(evt) {
            var self = this;
            self._draggablePos = self.$node.position();
            self._draggableOffset = {
                left: evt.clientX - self._draggablePos.left,
                top: evt.clientY - self._draggablePos.top
            };
            self.on('mousemove.draggable-start', function(evt) {
                self._draggableStart(evt);
            }).on('mouseup.draggable-start', function() {
                self.off('mouseup.draggable-start mousemove.draggable-start');
                delete self._draggablePos;
                delete self._draggableOffset;
            });
        }
    };
});
