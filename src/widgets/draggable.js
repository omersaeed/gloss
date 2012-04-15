define([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!gloss:core/class',
    'path!gloss:widgets/widget',
    'path!gloss:link!widgets/draggable/draggable.css'
], function($, _, Class, Widget) {
    var defaultTimeout = $.browser.msie && +$.browser.version[0] < 9? 100 : 50,
        whichDrag = 1,
        THROTTLE = 1,
        DEGRADED_THROTTLE = 1, // this doesn't seem to help user experience...
        $doc = $(document),
        $dragEl = $('<div class="global drag-element hidden"></div>')
                .appendTo('body');

    // the scroll manager is a way for separate components to all keep track of
    // the scrolling, position, and dimensions of the dragged object and its
    // container w/o all of the different components indivitually making DOM
    // calls.  this way many calculations can happen in any given mousemove
    // event w/o suffering the performance hit of repeated DOM API calls and
    // possibly reflows
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
                if (!obj.hasOwnProperty('$content')) {
                    throw Error('$content must be set with $container');
                }
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
            window.sd = new Date();
            var self = this, draggable = self.options.draggable, timestamp;
            self._dragOnMouseUp();
            timestamp = new Date();
            self._drag = {
                // the '.position()' call takes ~275 ms on IE8 w/ 300 visible
                // rows, this is a big performance hit, and it's where this
                // function spends all of its time
                pos: draggable.degraded? {left: 0, top: 0} : self.$node.position(),
                offset: { }
            };
            if (new Date() - timestamp > 50) {
                draggable.degraded = true;
                THROTTLE = DEGRADED_THROTTLE;
                self._drag.pos = {left: 0, top: 0};
            }
            self._drag.offset.left = evt.clientX - self._drag.pos.left;
            self._drag.offset.top = evt.clientY - self._drag.pos.top;
            $doc.on('mousemove.drag-start', function(evt) {
                self._dragStart(evt);
            });
            $doc.on('mouseup.drag-start', function() {
                $doc.off('mousemove.drag-start mouseup.drag-start');
                delete self._drag;
            });
        },
        _dragStart: function(evt) {
            var self = this, draggable = self.options.draggable;
            $doc.off('mousemove.drag-start mouseup.drag-start')
                .on('mousemove.drag', function(evt) {
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
                if (! draggable.degraded) {
                    // this takes ~ 275 ms on IE8 w/ 300 visible rows, which is
                    // another big performance hit along w/ the .position()
                    // call in startDrag()
                    self._drag.$el = self._dragCloneEl();
                } else {
                    self._drag.$el = $dragEl.removeClass('hidden');
                }
            } else {
                self._drag.$el = self.$node;
            }
            self._drag.$el.addClass('dragging');
            self._dragSetPos(evt, draggable.degraded? null : self._drag.offset);
            if (draggable.autoScroll) {
                setTimeout(function() {
                    self._dragSetScrollManager();
                }, 100);
            }
            self._drag.throttleIndex = 0;
            self.trigger('dragstart');
        },
        _dragOnMouseMove: function(evt) {
            var _drag = this._drag, scrollTop, diff, scroll = _drag.scroll;
            if (! (_drag.throttleIndex++) % THROTTLE) {
                return;
            }
            _drag.throttleIndex = 0;
            if (scroll) {
                scroll.onMouseMove(evt);
            }
            this._dragSetPos(evt, this.options.draggable.degraded? null : _drag.offset);
        },
        _dragOnMouseUp: function(evt) {
            var draggable = this.options.draggable;
            if (typeof this._drag !== 'undefined') {
                if (evt) {
                    this.trigger('dragend', {
                        clientX: evt.clientX,
                        clientY: evt.clientY
                    });
                }
                if (this._drag.$el) {
                    if (draggable.clone) {
                        if (draggable.degraded) {
                            this._drag.$el.addClass('hidden');
                        } else {
                            this._drag.$el.remove();
                        }
                    } else {
                        this._drag.$el.addClass('dragged');
                    }
                    this._drag.$el.removeClass('dragging');
                }

                if (this._drag.scroll) {
                    this._drag.scroll.stopScroll();
                }
            }

            $doc.off('mouseup.drag mousemove.drag keyup.drag mousemove.drag-start mouseup.drag-start');
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
        },
        _dragSetScrollManager: function() {
            var draggable = this.options.draggable;
            if (this._drag) {
                this._drag.scroll = ScrollManager({
                    $container: draggable.scroll.$container,
                    $content: draggable.scroll.$content
                });
            }
        }
    };
});
