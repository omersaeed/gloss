define([
    'vendor/jquery',
    'link!vendor/gloss/widgets/draggable/draggable.css'
], function($) {
    return {
        __mixin__: function(base, prototype, mixin) {
            if (! base.defaults.draggable) {
                base.defaults.draggable = {};
            }
            if (base.defaults.draggable.autoBind == null) {
                base.defaults.draggable.autoBind = true;
            }
        },
        afterInit: function() {
            var self = this;
            if (self.options.draggable.autoBind) {
                self.on('mousedown', function(evt) {
                    self._draggableOnMousedown(evt);
                }).on('mouseup', function(evt) {
                    self._draggableOnMouseup(evt);
                });
            }
        },
        _draggableOnMousedown: function(evt) {
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
        _draggableStart: function(evt) {
            var self = this;
            self.off('mouseup.draggable-start mousemove.draggable-start');
            $(window).on('mouseup.draggable', function() {
                self._draggableOnMouseup();
            }).on('mousemove.draggable', function(evt) {
                self._draggableOnMouseMove(evt);
            });
            $('body').addClass('dragging');
            if (self.options.draggable.clone) {
                self._$draggableEl = self.$node.clone();
            } else {
                self._$draggableEl = self.$node;
            }
            self._$draggableEl.addClass('dragging');
            self._draggableSetPos(evt, self._draggableOffset);
            self.trigger('dragstart');
        },
        _draggableSetPos: function(evt, offset) {
            this._$draggableEl.css({
                left: evt.clientX - (offset? offset.left : 0),
                top: evt.clientY - (offset? offset.top : 0)
            });

        },
        _draggableOnMouseMove: function(evt) {
            this._draggableSetPos(evt, this._draggableOffset);
        },
        _draggableOnMouseup: function(evt) {
            if (!this.options.draggable.clone) {
                this._$draggableEl.addClass('dragged');
            }
            this._$draggableEl.removeClass('dragging');
            $('body').removeClass('dragging');
            $(window).off('mouseup.draggable mousemove.draggable');
            delete this._draggablePos;
            delete this._draggableOffset;
        }
    };
});
