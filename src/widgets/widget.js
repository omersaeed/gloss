define([
    'vendor/jquery',
    'vendor/jquery-ui',
    'vendor/underscore',
    'bedrock/class',
    'css!./../style/base.css'
], function($, ui, _, Class) {
    var isArray = _.isArray, slice = Array.prototype.slice;

    var inBody = function($node) {
        return $node.parents('body').length > 0;
    };

    var Registry = Class.extend({
        init: function() {
            this.roots = [];
            this.widgets = {};
        },

        add: function(widget, parentWidget, childWidgets) {
            var id = widget.id;
            if (!this.widgets[id]) {
                this.widgets[id] = widget;
            } else {
                throw new Error('duplicate widget id: ' + id);
            }
            if (arguments.length > 1) {
                parentWidget._childWidgets.push(widget);
                widget._parentWidget = parentWidget;
                widget._childWidgets = childWidgets;
            } else if (inBody(widget.$node)) {
                this._injectWidget(widget);
            }
            if (widget._childWidgets == null) {
                widget._childWidgets = [];
            }
            widget.registry = this;
        },

        get: function(id) {
            if (id == null) {
                return null;
            }
            if (id.target && _.isElement(id.target)) {
                id = $(id.target).attr('id');
            } else if (!_.isString(id)) {
                id = $(id).attr('id');
            } else if (id.substr(0, 1) === '#') {
                id = id.substr(1);
            }
            if (id != null) {
                return this.widgets[id];
            } else {
                return null;
            }
        },

        getByClass: function(cls) {
            var identifiedWidget = null;
            $.each(this.widgets, function(id, widget) {
                if (widget.$node.is(cls)) {
                    identifiedWidget = widget;
                    return false;
                }
            });
            return identifiedWidget;
        },

        isWidget: function(id) {
            return !!(this.get(id));
        },

        remove: function(widget) {
            this._extractWidget(widget);
            delete widget.registry;
            delete this.widgets[widget.id];
        },

        update: function(widget, naive) {
            var currentParent = widget._parentWidget;
            if (widget.registry === undefined) {
                throw new Error('cannot update unregistered widget');
            } else if (currentParent !== undefined) {
                if (inBody(widget.$node)) {
                    var widgets = this.widgets, parent = null, changed;
                    widget.$node.parents('[id]').each(function(i, node) {
                        var widget = widgets[$(node).attr('id')];
                        if (widget != null) {
                            parent = widget;
                            return false;
                        }
                    });

                    changed = false;
                    if (currentParent !== null && parent !== null) {
                        if (currentParent.node !== parent.node) {
                            changed = true;
                        }
                    } else if (currentParent !== parent) {
                        changed = true;
                    }
                    if (changed) {
                        this._extractWidget(widget);
                        this._injectWidget(widget, parent);
                        if (!naive) {
                            this.updateWidgetNodes(widget.$node.find('[id]'), true);
                        }
                    }
                } else {
                    this._extractWidget(widget);
                    if (!naive) {
                        this.updateWidgetNodes(widget.$node.find('[id]'), true);
                    }
                }
            } else if (inBody(widget.$node)) {
                this._injectWidget(widget);
                if (!naive) {
                    this.updateWidgetNodes(widget.$node.find('[id]'), true);
                }
            }
        },

        updateWidgetNodes: function(candidates, naive) {
            var candidate, widget;
            for (var i = 0, l = candidates.length; i < l; i++) {
                candidate = candidates[i];
                if (candidate != null) {
                    if (candidate.nodeType === 1) {
                        try {
                            widget = registry.widgets[candidate.id];
                            if (widget != null) {
                                this.update(widget, naive);
                            }
                        } catch (error) {};
                    } else if (candidate.jquery || isArray(candidate)) {
                        this.updateWidgetNodes(candidate, naive);
                    }
                }
            }
        },

        _extractWidget: function(widget) {
            var parent = widget._parentWidget, container, children, child;
            container = (parent) ? parent._childWidgets : this.roots;
            container.splice($.inArray(widget, container), 1);

            children = widget._childWidgets;
            if (children != null && children.length > 0) {
                for (var i = 0, l = children.length; i < l; i++) {
                    child = children[i];
                    child._parentWidget = parent;
                    container.push(child);
                }
            }

            // delete widget._childWidgets;
            delete widget._parentWidget;
        },

        _injectWidget: function(widget, newParent) {
            var widgets = this.widgets, parent = null, children, siblings, candidates, candidate;
            if (newParent !== undefined) {
                parent = newParent;
            } else {
                widget.$node.parents('[id]').each(function(i, node) {
                    var widget = widgets[$(node).attr('id')];
                    if (widget != null) {
                        parent = widget;
                        return false;
                    }
                });
            }

            children = [];
            siblings = [widget];

            candidates = (parent) ? parent._childWidgets : this.roots;
            for (var i = 0, l = candidates.length; i < l; i++) {
                candidate = candidates[i];
                if (candidate.$node.parents('#' + widget.id).length === 1) {
                    candidate._parentWidget = widget;
                    children.push(candidate);
                } else {
                    siblings.push(candidate);
                }
            }
            if (parent) {
                parent._childWidgets = siblings;
            } else {
                this.roots = siblings;
            }

            widget._childWidgets = children;
            widget._parentWidget = parent;
        }
    });

    var registry = Registry();

    $.fn.__append__ = $.fn.append;
    $.each(['after', 'append', 'before', 'prepend'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(arguments);
            return retval;
        };
    });
    $.each(['appendTo', 'detach', 'insertBefore', 'insertAfter', 'prependTo', 'remove'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(this);
            return retval;
        };
    });
    $.each(['replaceAll', 'replaceWith'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(this);
            registry.updateWidgetNodes(arguments);
            return retval;
        };
    });

    var BaseWidget = Class.extend({
        nodeTemplate: '<div>',

        init: function(node) {
            var html;
            if (node == null) {
                this.$node = $(this._compiledHtml());
            } else {
                this.$node = $(node);
            }
            if (this.prepareNode) {
                this.$node = this.prepareNode(this.$node);
            }
            if (this.$node.length !== 1) {
                throw new Error('widget $node must be only one DOM node: ' + node);
            }
            this.node = this.$node.get(0);
        },

        _compiledHtml: function(context) {
            context = context == null? this : context; 
            return _.isFunction(this.nodeTemplate)?
                this.nodeTemplate(context) :
                this.nodeTemplate;
        },

        hide: function(params) {
            this.$node.addClass('hidden');
            return this;
        },

        invoke: function(name) {
            var method = this[name];
            if (method != null) {
                method.apply(this, slice.call(arguments, 1));
                return true;
            } else {
                this.propagate.apply(this, arguments);
            }
            return false;
        },

        off: function() {
            this.$node.off.apply(this.$node, arguments);
            return this;
        },

        on: function() {
            this.$node.on.apply(this.$node, arguments);
            return this;
        },

        propagate: function() {
            return this;
        },

        show: function(params) {
            this.$node.removeClass('hidden');
            return this;
        },

        trigger: function() {
            this.$node.trigger.apply(this.$node, arguments);
            return this;
        },

        triggerHandler: function() {
            this.$node.triggerHandler.apply(this.$node, arguments);
            return this;
        },

        // 'obj' can be either a Widget, a DOM node, or a jQuery-wrapped node
        append: function(obj) {
            if (obj.$node) {
                this.$node.append(obj.$node);
            } else {
                this.$node.append(obj);
            }
            return this;
        },

        appendTo: function(obj) {
            if (obj.$node) {
                this.$node.appendTo(obj.$node);
            } else {
                this.$node.appendTo(obj);
            }
            return this;
        },

        prependTo: function(obj) {
            this.$node.prependTo(obj.$node? obj.$node : obj);
            return this;
        }
    });

    var Widget = BaseWidget.extend({
        defaults: {
            nostyling: false,
            bindAll: true,
            bindOnMethodHandlers: true,
            populateEmptyNode: false
        },

        __new__: function(constructor, base, prototype, mixins) {
            var defaults, i, mixin;
            if (base.prototype.defaults != null && prototype.defaults != null) {
                prototype.defaults = $.extend(true, {}, base.prototype.defaults, prototype.defaults);
            }
            if (mixins) {
                for (i = mixins.length-1; i >= 0; i--) {
                    mixin = mixins[i];
                    if (mixin.__updateWidget__) {
                        if (!prototype._updateWidgetMixins) {
                            prototype._updateWidgetMixins = [];
                        }
                        prototype._updateWidgetMixins.push(mixin.__updateWidget__);
                    }
                    if (mixin.defaults) {
                        var intermediate = {},
                            addedKeys = _.difference(
                                _.keys(prototype.defaults),
                                _.keys(base.prototype.defaults)),
                            overriddenKeys = _.intersection(addedKeys, _.keys(mixin.defaults));

                        $.extend(true, intermediate, prototype.defaults, mixin.defaults);
                        for (var k in overriddenKeys) {
                            if (overriddenKeys.hasOwnProperty(k)) {
                                if ($.isPlainObject(prototype.defaults[overriddenKeys[k]])) {
                                    $.extend(true, intermediate[overriddenKeys[k]], prototype.defaults[overriddenKeys[k]]);
                                } else {
                                    intermediate[overriddenKeys[k]] = prototype.defaults[overriddenKeys[k]];
                                }
                            }
                        }
                        prototype.defaults = intermediate;
                    }
                }
            }
        },

        init: function(node, options, extension) {
            var name, value, parentWidget, $tmpl, classes, i, opts, $node;
            if (extension != null) {
                _.extend(this, extension);
            }

            this.options = opts = $.extend(true, {}, this.defaults, options);

            this._super.apply(this, arguments);

            $node = this.$node;

            this.id = $node.attr('id');
            if (this.id == null) {
                this.id = _.uniqueId('widget');
                $node.attr('id', this.id);
            }

            if (opts.bindOnMethodHandlers) {
                for (name in opts) {
                    if (opts.hasOwnProperty(name)) {
                        value = opts[name];
                        if (name.substr(0, 2) === 'on' && $.isFunction(value)) {
                            $node.on(name.substr(2).toLowerCase(), _.bind(value, this));
                        }
                    }
                }
            }

            if (opts.populateEmptyNode && !$node.children().length && node) {
                this.render();
            }
            
            if (opts.bindAll) {
                _.bindAll(this);
            }

            parentWidget = opts.parentWidget;
            delete opts.parentWidget;
            if (parentWidget) {
                registry.add(this, parentWidget, []);
            } else {
                registry.add(this);
            }

            this.create();
            this.trigger('widgetcreate', this);
        },

        create: function() {},

        destroy: function() {
            this.$node.data('widget', undefined);
            registry.remove(this);
        },

        // Widget.onPageClick([event name], callback, [opts])
        //
        // assign a callback to be executed when the user clicks anywhere
        // _outside_ of the widget.
        //
        // defaults:
        //
        //  - event: the default event is 'mousedown.onPageClick'
        //  - also by default the click is only executed once, this can be
        //    adjusted by either:
        //      - return 'false' from the callback will not cancel it, i.o.w.
        //        if you only want to cancel the callback based on a certain
        //        condition in the event context, you can return true/false.
        //        also returning nothing (undefined) is treated the same as
        //        returning true, which will cancel the callback
        //      - set opts.once to false.  if this is false then the return
        //        value doesn't matter
        //
        // examples:
        //
        //     myWidget.onPageClick(function() { /* ... */ });
        //     myWidget.onPageClick('mouseup.myHandler', function() { /* ... */ });
        //     myWidget.onPageClick(function() { /* ... */ }, {once: false});
        //     myWidget.onPageClick('click.handleIt', function() { /* ... */ }, {once: false});
        onPageClick: function(name, callback, opts) {
            var $node = this.$node;
            if (arguments.length === 1) {
                callback = name;
                name = 'mousedown.onPageClick';
                opts = {};
            } else if (arguments.length === 2 && _.isFunction(name)) {
                opts = callback;
                callback = name;
                name = 'mousedown.onPageClick';
            }
            opts = $.extend({once: true}, opts);
            name += '_' + this.id;
            setTimeout(function() {
                var $doc = $(document).on(name, function handler(evt) {
                    if (evt.target !== $node[0] && !$(evt.target).closest($node).length) {
                        var ret = callback(evt),
                            returnedFalse = !ret && typeof ret !== 'undefined',
                            defaultPrevented = evt.isDefaultPrevented();

                        if (!returnedFalse && !defaultPrevented && opts.once) {
                            $doc.off(name, handler);
                        }
                    }
                });
            }, 0);
            return this;
        },

        offPageClick: function(name) {
            name = name == null? '' : '_' + name;
            $(document).off('mousedown.onPageClick_' + this.id + name);
            return this;
        },

        place: function(params) {
            var displayed = (this.$node.css('display') !== 'none'), offset;
            if (!displayed) {
                this.$node.css('visibility', 'hidden').show();
            }
            this.$node.position(params);
            if (!displayed) {
                this.$node.hide().css('visibility', 'visible');
            }
            return this;
        },

        propagate: function() {
            if (this._childWidgets != null) {
                var children = this._childWidgets, widget;
                for (var i = 0, l = children.length; i < l; i++) {
                    widget = children[i];
                    widget.invoke.apply(widget, arguments);
                }
            }
            return this;
        },

        render: function(context) {
            var i, $node = this.$node,
                $tmpl = $(this._compiledHtml()),
                classes = $tmpl[0].className.split(/\s+/);
            for (i = classes.length-1; i >= 0; i--) {
                $node.addClass(classes[i]);
            }
            $node.html($tmpl.html());
        },

        set: function(name, value, opts) {
            var params;
            if (name != null) {
                if (typeof name === 'string') {
                    params = {};
                    params[name] = value;
                } else {
                    params = name;
                    opts = value;
                }
            } else {
                return this;
            }

            opts = opts || {};

            $.extend(true, this.options, params);
            if (!opts.silent) {
                this.update(params);
            }
            return this;
        },

        update: function(options) {
            var i, updated = {};
            $.each(options || this.options, function(key, value) {
                updated[key] = true;
            });
            this.updateWidget(updated);
            if (this._updateWidgetMixins) {
                for (i = this._updateWidgetMixins.length-1; i >= 0; i--) {
                    this._updateWidgetMixins[i].call(this, updated);
                }
            }
            return this;
        },

        updateWidget: function(updated) {}
    });

    Widget.attachHandler = function($node) {
        var args = slice.call(arguments, 1);
        $node.on.apply($node, args);
        return function() {
            $node.off.apply($node, args);
        };
    };

    Widget.identifyKeyEvent = function(event) {
        return {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            27: 'escape',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            42: 'delete'
        }[event.which];
    };

    Widget.measureMatchingWidth = function($node, $target) {
        var width = $target.width();
        return width + ($target.outerWidth() - width - ($node.outerWidth() - $node.width()));
    };

    Widget.measureMinimumWidth = function($testnode, values) {
        var minimum = 0, width;
        $testnode.hide().css({
            visibility: 'hidden',
            position: 'absolute',
            top: '0px',
            left: '0px'
        }).appendTo('body').show();
        for (var i = 0, l = values.length; i < l; i++) {
            $testnode.html(values[i]);
            width = $testnode.outerWidth();
            if (width > minimum) {
                minimum = width;
            }
        }
        $testnode.remove();
        return minimum;
    };

    Widget.onPageClick = function($node, callback) {
        setTimeout(function() {
            var $doc = $(document).on('mousedown.onPageClick', function handler(evt) {
                if (evt.target !== $node[0] && !$(evt.target).closest($node).length) {
                    var ret = callback(evt),
                        returnedFalse = !ret && typeof ret !== 'undefined',
                        defaultPrevented = evt.isDefaultPrevented();

                    if (!returnedFalse && !defaultPrevented) {
                        $doc.off('mousedown.onPageClick', handler);
                    }
                }
            });
        }, 0);
    };

    Widget.surrogate = function(node) {
        return function() {
            var widget = registry.get(node);
            if (widget != null) {
                return widget;
            } else {
                return BaseWidget(node);
            }
        };
    };

    Widget.registry = window.registry = registry;
    return Widget;
});
