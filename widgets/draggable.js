define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/core/class',
    'vendor/gloss/widgets/widget',
    'link!vendor/gloss/widgets/draggable/draggable.css'
], function($, _, Class, Widget) {
    var defaultTimeout = $.browser.msie && +$.browser.version[0] < 9? 100 : 50;
    var ScrollManager = Class.extend({
        defaults: {
            wait: 500,
            areaThreshold: 75,
            timeout: defaultTimeout
        },
        $window: $(window),
        $document: $(document),
        init: function(options) {
            this.options = $.extend({}, this.defaults, options);
            this._state = {};
            this._setContainerAndContent(
                this.options.$container || this.$window,
                this.options.$content || this.$document);
            this._setWindowScrollTop();
        },
        _setContainerAndContent: function($container, $content) {
            this.$container = $container;
            this.$content = $content;
            this.containerHeight = this.$container.innerHeight();
            this.contentHeight = this.$content.outerHeight();
            this._disabled = this.contentHeight <= this.containerHeight;
            // if (this._disabled) {
            //     return;
            // }
            if ((this._containerIsWindow = $container[0] === window)) {
                this.containerPosition = {top: 0, left: 0};
            } else {
                this.containerPosition = this.$container.position();
            }
            this.containerTop = this.containerPosition.top;
            this.maxScroll = this.contentHeight - this.containerHeight;
            this.scrollTop = this.$container.scrollTop();
        },
        _setWindowScrollTop: function() {
            this.windowScrollTop = this.$container[0] === window?
                this.scrollTop : this.$window.scrollTop();
        },
        onMouseMove: function(evt) {
            var scrollTop, y = evt.clientY - this.containerTop,
                _state = this._state,
                area = _state.area;
            if (this._disabled) {
                return;
            }
            scrollTop = this.scrollTop;
            this._state.y = y;
            if (y < this.options.areaThreshold && scrollTop > 0) {
                if (area !== 'top') {
                    _state.area = 'top';
                    this.startScroll();
                }
            } else if (y > this.containerHeight - this.options.areaThreshold &&
                    scrollTop < this.maxScroll) {
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
        set: function(key, val) {
            var obj = {}, resetDisabled = false;
            if (typeof val !== 'undefined') {
                obj[key] = val;
            } else {
                obj = key;
            }
            if (obj.hasOwnProperty('$container')) {
                // assume that if they're setting $container, they're setting
                // $content
                this._setContainerAndContent(obj.$container, obj.$content);
            }
        },
        scroll: function() {
            var self = this, _state = self._state,
                now = new Date(),
                scrollTop = self.scrollTop;
            if (!_state.scrolling) {
                return;
            }
            if (!_state.wait) {
                _state.wait = now;
            }
            if (now - _state.wait > this.options.wait &&
                    scrollTop >= 0 && scrollTop <= self.maxScroll) {
                scrollTop += self.step();
                if (scrollTop < 0) {
                    scrollTop = 0;
                }
                if (scrollTop > self.maxScroll) {
                    scrollTop = self.maxScroll;
                }
                self.scrollTop = scrollTop;
                if (self._containerIsWindow) {
                    self.windowScrollTop = scrollTop;
                }
                self.$container.scrollTop(scrollTop);
            }
            setTimeout(function() {
                self.scroll();
            }, self.options.timeout);
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
                step = (inTop? 1 - pct : pct) * 5 + (inTop? -1 : 1),
                timeStep = step * this.options.timeout / 15;
            return inTop? -1 * timeStep : timeStep;
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
            if (draggable.autoScroll && !draggable.scroll) {
                draggable.scroll = {};
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
            var self = this, draggable = self.options.draggable;
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
            if (draggable.clone) {
                self._drag.$el = self._dragCloneEl();
            } else {
                self._drag.$el = self.$node;
            }
            self._drag.$el.addClass('dragging');
            self._dragSetPos(evt, self._drag.offset);
            if (draggable.autoScroll) {
                self._drag.scroll = ScrollManager({
                    $container: draggable.scroll.$container,
                    $content: draggable.scroll.$content
                });
            }
            self.trigger('dragstart');
        },
        _dragOnMouseMove: function(evt) {
            var _drag = this._drag, scrollTop, diff, scroll = _drag.scroll;
            if (scroll) {
                scroll.onMouseMove(evt);
                // _drag.scrollTop = scroll.scrollTop;
                // _drag.scrollTop = 0;
            }
            this._dragSetPos(evt, _drag.offset);
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
