define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'bedrock/class',
    'bedrock/assettable',
    './widgets/widget'
], function($, _, t, Class, asSettable, Widget) {
    var viewCount = 0,

        // this is used strictly for debugging and internal purposes
        dbgview = window.dbgview = function(which) {
            return _.isNumber(which)? dbgview['v'+which] : dbgview[which];
        },

        views = {},

        isWidget = function(el) { return !!Widget.registry.get(el.id); },
        toWidget = function(el) { return Widget.registry.get(el.id); },
        isView = function(el) { return !!el.getAttribute('view-name'); },
        toView = function(el) { return views[el.getAttribute('view-name')]; },

        isPageEvent = function(eventName) {
            return (eventName.split('.')[0] in
                {pageclick:'', pagemouseup:'', pagemousedown:''});
        };

    var View = Class.extend({
        // this is used to declare default values for options.
        //
        // every view has a `this.options` object that is used to configure it.
        // the defaults are set here (surprise surprise). when a view extends
        // another throug inheritance, the defaults are recursively updated
        // with the parents, i.e.:
        //
        //      var ParentClass = View.extend({
        //          defaults: {foo: 'bar'}
        //      });
        //
        //      var ChildClass = ParentClass.extend({
        //          defaults: {baz: 'boom'}
        //      });
        //
        // and then `ChildClass.prototype.defaults` would be something like
        // `{foo: 'bar', baz: 'boom'}`. it's a deep extend, something like what
        // you get when you run:
        //
        //     defaults = $.extend(true, parentDefaults, childDefaults);
        defaults: {},

        // this is used to set the outerHTML of the DOM element corresponding
        // to this view.
        //
        // can be either a string or a template function.
        //
        // it's used by `View::render()` something like this:
        //
        //     render: function() {
        //         // if outerHTML wasn't readonly
        //         this.el.outerHTML = _.isFunction(this.template)?
        //              this.template(this) : this.template;
        //     }
        //
        // returns the DOM el and contents of the widget as a string.
        template: '<div></div>',

        init: function(options) {
            var el, $el, viewName;

            options = _.extend({}, options);
            el = options.el;
            $el = options.$el;
            delete options.el;
            delete options.$el;

            this.set($.extend(true, {}, this.defaults, options), {silent: true});

            this.$el = $($el || el);

            if ((viewName = this.$el.attr('view-name'))) {
                throw new Error('can\'t re-instantiate view on el: '+viewName);
            }

            if (!this.$el.length) {
                this.$el = $(this._renderHTML());
            } else if (this.$el.length > 1) {
                throw Error('views must be initialized with only one DOM el');
            } else if (!this.$el.children().length) {
                this.render();
            }
            this.el = this.$el[0];

            dbgview['v' + (++viewCount)] = this;

            viewName = 'view' + viewCount;
            this.$el.attr('view-name', viewName);
            if (!this.el.id) {
                this.el.id = viewName;
            }
            views[viewName] = this;
        },

        _childWidgetsAndViews: function() {
            var children = [],
                traverse = function(el) {
                    var i, l, child, childNodes = el.childNodes, result = [];
                    for (i = 0, l = childNodes.length; i < l; i++) {
                        child = childNodes[i];
                        if (child.nodeType === 1) {
                            result.push({el: child});
                        }
                    }
                    return result;
                };
            t.dfs(traverse(this.el), function(node) {
                var id = node.el.id;
                if (isWidget(node.el)) {
                    children.push(toWidget(node.el));
                } else if (isView(node.el)) {
                    children.push(toView(node.el));
                } else {
                    node.children = traverse(node.el);
                }
            });
            return children;
        },

        // this provides a means for detecting when the user clicks outside of
        // this view:
        //
        //     myView.on('pageclick', function() {
        //         consle.log('clicked somewhere outside of myView');
        //     });
        //
        // this also works for the .one() method. and then you can remove the
        // handler:
        //
        //     myView.off('pageclick');
        //
        _onPageEvent: function(one, name, callback) {
            var $el = this.$el;
            name = name + (name.indexOf('.') > -1? '' : '.') + '__' + this.id;
            setTimeout(function() {
                $(document)[one? 'one' : 'on'](name, function handler(evt) {
                    if (evt.target !== $el[0] && !$(evt.target).closest($el).length) {
                        if (!callback(evt)) {
                            evt.preventDefault();
                        }
                    }
                });
            }, 0);
        },

        _offPageEvent: function(name, callback) {
            name = name + (name.indexOf('.') > -1? '' : '.') + '__' + this.id;
            $(document).off(name);
        },

        _renderHTML: function() {
            return _.isFunction(this.template)?
                this.template(this) : this.template;
        },

        hide: function() {
            this.$el.addClass('hidden');
            return this;
        },

        propagate: function(method) {
            var rest = Array.prototype.slice.call(arguments, 1);
            _.each(this._childWidgetsAndViews(), function(child) {
                if (child instanceof Widget) {
                    child.invoke(method);
                } else {
                    if (_.isFunction(child[method])) {
                        child[method].apply(child, rest);
                    } else {
                        child.propagate.apply(child, [method].concat(rest));
                    }
                }
            });
            return this;
        },

        render: function() {
            var $tmp = $(this._renderHTML()),
                origClass = this.$el.attr('class');
            this.$el.html($tmp.html()).addClass($tmp.attr('class'));
        },

        show: function() {
            this.$el.removeClass('hidden');
            return this;
        },

        update: function() { }
    });

    // delegate to jqeury for event methods on/one/off/trigger
    _.each(['on', 'off', 'one', 'trigger'], function(method) {
        var dflt = function() {
            this.$el[method].apply(this.$el, arguments);
            return this;
        };

        var withPageEvent = function(eventName) {
            var rest = Array.prototype.slice.call(arguments, 1);
            if (isPageEvent(eventName)) {
                eventName = eventName.slice(4);
                if (method === 'on') {
                    this._onPageEvent.apply(this, [false, eventName].concat(rest));
                } else if (method === 'one') {
                    this._onPageEvent.apply(this, [true, eventName].concat(rest));
                } else if (method === 'off') {
                    this._offPageEvent.apply(this, [eventName].concat(rest));
                }
            } else {
                return dflt.apply(this, arguments);
            }
        };

        View.prototype[method] = method === 'trigger'? dflt : withPageEvent;
    });

    _.each(['prependTo', 'prepend', 'appendTo', 'append'], function(method) {
        View.prototype[method] = function(other) {
            this.$el[method](other.$el? other.$el : other);
            return this;
        };
    });

    asSettable.call(View.prototype, {propName: 'options', onChange: 'update'});

    View.extend = _.wrap(View.extend, function(func) {
        var rest = Array.prototype.slice.call(arguments, 1),
            derivedClass = func.apply(this, rest);

        derivedClass.prototype.defaults = $.extend(true, {},
            derivedClass.__super__.prototype.defaults,
            derivedClass.prototype.defaults);

        return derivedClass;
    });

    return View;
});
