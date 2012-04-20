define([
    'path!vendor:jquery',
    'path!vendor:jquery-ui',
    'path!vendor:underscore',
    'path!bedrock:class',
    'path!gloss:css!style/base.css',
    'path!lookandfeel:'
    // 'path!gloss:css!widgets/widget/widget.css'
], function($, ui, _, Class) {
    var isArray = _.isArray, isPlainObject = $.isPlainObject, slice = Array.prototype.slice;

    var inBody = function($node) {
        return $node.parents('body').length > 0;
    };

    var recursiveMerge = function(original) {
        var addition, name, value;
        for (var i = 1, l = arguments.length; i < l; i++) {
            addition = arguments[i];
            if (addition != null) {
                for (name in addition) {
                    if (addition.hasOwnProperty(name)) {
                        value = addition[name];
                        if (isPlainObject(original[name]) && isPlainObject(value)) {
                            value = recursiveMerge(original[name], value);
                        }
                        original[name] = value;
                    }
                }
            }
        }
        return original;
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
            if (node == null) {
                this.$node = $(this.nodeTemplate);
            } else {
                this.$node = $(node);
            }
            if (this.prepareNode) {
                this.$node = this.prepareNode(this.$node);
            }
            if (this.$node.length !== 1) {
                throw new Error('cannot instantiate widget: ' + node);
            }
            this.node = this.$node.get(0);
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
                prototype.defaults = recursiveMerge({}, base.prototype.defaults, prototype.defaults);
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
                }
            }
        },

        init: function(node, options, extension) {
            var name, value, parentWidget, $tmpl, classes, i;
            if (extension != null) {
                _.extend(this, extension);
            }

            BaseWidget.prototype.init.call(this, node);

            this.id = this.$node.attr('id');
            if (this.id == null) {
                this.id = _.uniqueId('widget');
                this.$node.attr('id', this.id);
            }

            this.options = recursiveMerge({}, this.defaults, options);
            if (this.defaults.bindOnMethodHandlers) {
                for (name in this.options) {
                    if (this.options.hasOwnProperty(name)) {
                        value = this.options[name];
                        if (name.substr(0, 2) === 'on' && $.isFunction(value)) {
                            this.$node.on(name.substr(2).toLowerCase(), value);
                        }
                    }
                }
            }

            if (this.options.populateEmptyNode && !this.$node.children().length && node) {
                $tmpl = $(this.nodeTemplate);
                classes = $tmpl.attr('class').split(' ');
                for (i = classes.length-1; i >= 0; i--) {
                    this.$node.addClass(classes[i]);
                }
                this.$node.html($tmpl.html());
            }
            
            if (this.options.bindAll) {
                _.bindAll(this);
            }

            parentWidget = this.options.parentWidget;
            delete this.options.parentWidget;
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

        onPageClick: function(name, callback) {
            var $node = this.$node;
            if (!callback) {
                callback = name;
                name = 'mousedown.onPageClick';
            }
            name += '_' + this.id;
            setTimeout(function() {
                var $doc = $(document).on(name, function handler(evt) {
                    if (evt.target !== $node[0] && !$(evt.target).closest($node).length) {
                        var ret = callback(evt),
                            returnedFalse = !ret && typeof ret !== 'undefined',
                            defaultPrevented = evt.isDefaultPrevented();

                        if (!returnedFalse && !defaultPrevented) {
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

        set: function(name, value) {
            var options;
            if (name != null) {
                if (typeof name === 'string') {
                    options = {};
                    options[name] = value;
                } else {
                    options = name;
                }
            } else {
                return this;
            }

            recursiveMerge(this.options, options);
            this.update(options);
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
            width = $testnode.width();
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
