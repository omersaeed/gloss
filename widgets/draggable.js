define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/core/class',
    'vendor/gloss/widgets/widget',
    'link!vendor/gloss/widgets/draggable/draggable.css'
], function($, _, Class, Widget) {
    var ScrollManager = Class.extend({
        defaults: {
            wait: 500,
            areaThreshold: 75
        },
        $window: $(window),
        $document: $(document),
        init: function(options) {
            this.options = $.extend({}, this.defaults, options);
            this.containerHeight = this.$window.innerHeight();
            this.contentHeight = this.$document.outerHeight();
            this._state = {};
            this._disabled = this.contentHeight <= this.containerHeight;
        },
        onMouseMove: function(evt, scrollTop) {
            var y = evt.clientY,
                _state = this._state,
                area = _state.area;
            if (this._disabled) {
                return;
            }
            this._state.y = y;
            if (y < this.options.areaThreshold && scrollTop > 0) {
                if (area !== 'top') {
                    _state.area = 'top';
                    this.startScroll();
                }
            } else if (y > this.containerHeight - this.options.areaThreshold &&
                    scrollTop < this.contentHeight - this.containerHeight) {
                if (area !== 'bottom') {
                    _state.area = 'bottom';
                    this.startScroll();
                }
            } else {
                if (area != null) {
                    delete _state.area;
                    delete _state.wait;
                    this.stopScroll();
                }
            }
        },
        scroll: function() {
            var self = this, _state = self._state, now = new Date();
            if (!_state.scrolling) {
                return;
            }
            if (! _state.wait) {
                _state.wait = now;
            }
            if (now - _state.wait > this.options.wait) {
                self.$window.scrollTop(self.$window.scrollTop() + self.step());
            }
            setTimeout(function() {
                self.scroll();
            }, 15);
        },
        startScroll: function() {
            this._state.scrolling = true;
            this.scroll();
        },
        step: function() {
            var _state = this._state,
                inTop = _state.area === 'top',
                thresh = this.options.areaThreshold,
                start = inTop? 0 : this.containerHeight - thresh,
                pct = (_state.y - start) / thresh,
                step = (inTop? 1 - pct : pct) * 5 + (inTop? -1 : 1);
            return inTop? -1 * step : step;
        },
        stopScroll: function() {
            this._state.scrolling = false;
        }
    });

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
            if (typeof self.node.onselectstart !== 'undefined') {
                self.node.onselectstart = function() {
                    return false;
                };
            }
        },
        startDrag: function(evt) {
            var self = this;
            self._dragOnMouseUp();
            window._dragWidget = self;
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
            }).on('keyup.drag', function(evt) {
                if (Widget.identifyKeyEvent(evt) === 'escape') {
                    self._dragOnMouseUp();
                }
            });
            $('body').addClass('dragging-element');
            if (self.options.draggable.clone) {
                self._drag.$el = self._dragCloneEl();
            } else {
                self._drag.$el = self.$node;
            }
            self._drag.$el.addClass('dragging');
            self._dragSetPos(evt, self._drag.offset);
            if (self.options.draggable.autoScroll) {
                self._drag.scroll = ScrollManager();
            }
            self.trigger('dragstart');
        },
        _dragOnMouseMove: function(evt) {
            var _drag = this._drag, scrollTop, diff;
            this._dragSetPos(evt, _drag.offset);
            if (_drag.scroll) {
                scrollTop = _drag.scroll.$window.scrollTop();

                diff = scrollTop - _drag.scrollTop;
                if (diff) {
                    _drag.offset.top -= diff;
                }
                _drag.scrollTop = scrollTop;

                _drag.scroll.onMouseMove(evt, _drag.scrollTop);
            }
        },
        _dragOnMouseUp: function(evt) {
            if (typeof this._drag !== 'undefined') {
                if (evt) {
                    this.trigger('dragend', {
                        clientX: evt.clientX,
                        clientY: evt.clientY
                    });
                }
                if (this._drag.$el) {
                    if (this.options.draggable.clone) {
                        this._drag.$el.remove();
                    } else {
                        this._drag.$el.addClass('dragged');
                    }
                    this._drag.$el.removeClass('dragging');
                }

                if (this._drag.scroll) {
                    this._drag.scroll.stopScroll();
                }
            }

            $(document).off('mouseup.drag mousemove.drag keyup.drag');
            // b/c of an IE8 quirk, these may have been set and never unset
            this.off('mouseup.drag-start mousemove.drag-start');
            $('body').removeClass('dragging-element');

            delete this._drag;
            if (window._dragWidget && window._dragWidget !== this) {
                window._dragWidget._dragOnMouseUp();
            }
            window._dragWidget = null;
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
