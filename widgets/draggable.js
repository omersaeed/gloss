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
        __updateWidget__: function(updated) {
            var self = this;
            if (updated.dragTargets && self._drag) {
                _.each(self.options.dragTargets, function(target) {
                    target.on('mouseover.drag', function(evt) {
                        target._dropOnDragOver(evt, self);
                    }).on('mouseout.drag', function(evt) {
                        target._dropOnDragOut(evt, self);
                    }).on('mousemove.drag', function(evt) {
                        target._dropOnDrag(evt, self);
                    });
                });
            }
        },
        afterInit: function() {
            var self = this;
            if (self.options.draggable.autoBind) {
                self.on('mousedown', function(evt) {
                    // self.draggableOnMouseDown(evt);
                    self.startDrag(evt);
                });
            }
        },
        _draggableCloneEl: function() {
            return this.$node.clone(false, false);
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
            $('body').removeClass('dragging-element')
                .off('mouseup.draggable mousemove.draggable');
            delete this._draggablePos;
            delete this._draggableOffset;
            this.trigger('dragend', {clientX: evt.clientX, clientY: evt.clientY});
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
            $('body').on('mouseup.draggable', function(evt) {
                self._draggableOnMouseUp(evt);
            }).on('mousemove.draggable', function(evt) {
                self._draggableOnMouseMove(evt);
            }).addClass('dragging-element');
            if (self.options.draggable.clone) {
                self._$draggableEl = self._draggableCloneEl();
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
        },


        // startDrag: function(evt) {
        //     var self = this;
        //     if (self._drag) {
        //         delete self._drag;
        //     }
        //     self._drag = {
        //         startPos: self.$node.position(),
        //         startOffset: { }
        //     };
        //     self._drag.startOffset.left = evt.clientX - self._drag.startPos.left;
        //     self._drag.startOffset.top = evt.clientY - self._drag.startPos.top;
        //     self.on('mousemove.dragStart', function(evt) {
        //         self._dragStart(evt);
        //     }).on('mouseup.dragCancel', function(evt) {
        //         self.off('mousemove.dragStart mouseup.dragCancel');
        //         delete self._drag;
        //     });
        // },
        // _dragCloneEl: function() {
        //     return this.$node.clone(false, false);
        // },
        // _dragSetPos: function(evt, offset) {
        //     this._drag.$el.css({
        //         left: evt.clientX - (offset? offset.left : 0),
        //         top: evt.clientY - (offset? offset.top : 0)
        //     });
        // },
        // _dragStart: function(evt) {
        //     var self = this, _drag = self._drag;
        //     self.off('mousemove.dragStart mouseup.dragCancel');
        //     $('body').on('mouseup.drag', function(evt) {
        //         self._dragOnMouseUp(evt);
        //     }).on('mousemove.drag', function(evt) {
        //         self._dragOnMouseMove(evt);
        //     }).addClass('dragging-element');
        //     if (self.options.draggable.clone) {
        //         _drag.$el = self._dragCloneEl();
        //     } else {
        //         _drag.$el = self.$node;
        //     }
        //     _drag.$el.removeClass('dragged').addClass('dragging');
        //     self._dragSetPos(evt, _drag.startOffset);
        //     self.trigger('dragstart');
        // },
        // _dragOnMouseMove: function(evt) {
        //     this._dragSetPos(evt, this._drag.startOffset);
        // },
        // _dragOnMouseUp: function(evt) {
        //     var self = this;
        //     self.trigger('dragend', {clientX: evt.clientX, clientY: evt.clientY});
        //     _.each(self.options.dragTargets, function(target) {
        //         target.trigger('dragend', evt, self)
        //             .off('mouseover.drag mouseout.drag mousemove.drag');
        //     });
        //     if (self.options.draggable.clone) {
        //         self._drag.$el.remove();
        //     } else {
        //         self._drag.$el.addClass('dragged');
        //     }
        //     self._drag.$el.removeClass('dragging');
        //     $('body')
        //         .removeClass('dragging-element')
        //         .off('mouseup.drag mousemove.drag');
        //     delete self._drag;
       // }
    };
});
