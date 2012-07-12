define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    'css!./tooltip/tooltip.css'
], function($, _, Widget) {
    return Widget.extend({
        defaults: {
            animation: null,
            position: {my: 'left top', at: 'left bottom'},
            postDelay: 500,
            preDelay: 0,
            width: null,
            target: null
        },
        create: function() {
            this._super();
            this.visible = false;
            this._currentTarget = null;
            this._handledEvents = [];
            this._postDelayed = false;
            this._preDelayed = false;

            this.$node.addClass('tooltip');
            this.update();
        },
        hide: function(params) {
            if(params != null && params.delayed && !this._postDelayed) {
                return;
            }
            this._postDelayed = false;

            this.$node.hide();
            this.visible = false;
            return this;
        },
        show: function(params) {
            var options = this.options, target = null, position;
            if(params != null) {
                if(params.delayed && !this._preDelayed) {
                    return;
                }
                if(params.target != null) {
                    target = params.target;
                    this._currentTarget = params.target.first();
                }
            }

            this._preDelayed = false;
            if(options.render) {
                options.render(this, target);
            }
            
            position = $.extend({}, options.position);
            if(target != null) {
                position.of = target;
            }
            this.place(position);

            if($.isArray(options.animation)) {
                this.$node.show.apply(this.$node, options.animation);
            } else {
                this.$node.show();
            }

            this.visible = true;
            return this;
        },
        updateWidget: function(updated) {
            var options = this.options;
            while(this._handledEvents.length > 0) {
                this._handledEvents.pop()();
            }
            if(options.target != null) {
                this._handledEvents.push(Widget.attachHandler(options.target,
                    'mouseenter', this._initiateShow));
                this._handledEvents.push(Widget.attachHandler(options.target,
                    'mouseleave', this._initiateHide));
            }

            if (options.width) {
                if (_.isNumber(this.options.width)) {
                    this.$node.width(this.options.width);
                } else {
                    this.$node.css({width: ''});
                }
            }
        },
        _initiateHide: function(event) {
            var self = this;
            if(self.visible) {
                if(self.options.postDelay > 0) {
                    self._postDelayed = true;
                    setTimeout(function() {
                        self.hide({delayed: true});
                    }, self.options.postDelay);
                } else {
                    self.hide();
                }
            }
            self._preDelayed = false;
        },
        _initiateShow: function(event) {
            var self = this, target = $(event.target);
            if(self.visible) {
                self._postDelayed = false;
                if(event.target === self._currentTarget) {
                    return;
                }
            }            
            if(self.options.preDelay > 0) {
                self._preDelayed = true;
                setTimeout(function() {
                    self.show({delayed: true, target: target});
                }, self.options.preDelay);
            } else {
                self.show({target: target});
            }
        }
    });
});
