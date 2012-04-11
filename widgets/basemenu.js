define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget',
    'path!gloss:link!widgets/basemenu/basemenu.css'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            animation: null,
            entries: null,
            position: null,
            width: null,
            updateDisplay: true
        },
        create: function() {
            var self = this;
            self.constructed = false;
            self.shown = false;

            self.$node.addClass('base-menu').hide();
        },
        hide: function() {
            var $node = this.$node, options = this.options;
            if(!this.shown) {
                return;
            }
            if($.isArray(options.animation)) {
                $node.hide.apply($node, options.animation);
            } else {
                $node.hide(options.animation);
            }

            $node.removeClass('open');
            this.shown = false;
            this.trigger('hide');
            return this;
        },
        show: function(params) {
            var $node = this.$node, options = this.options, self = this;
            if(this.shown) {
                return;
            } else if(!this.constructed) {
                this._constructMenu();
                if(!this.constructed) {
                    return;
                }
            }

            var width = null;
            if(options.width instanceof Widget) {
                width = Widget.measureMatchingWidth($node, options.width.$node);
            } else if(options.width != null) {
                width = options.width;
            }
            if(width != null) {
                $node.width(width);
            }

            var position = null;
            if(params != null && params.position != null) {
                position = params.position;
            } else if(options.position) {
                position = options.position;
            }
            if(position != null) {
                this.place(position);
            }

            if($.isArray(options.animation)) {
                $node.show.apply($node, options.animation);
            } else {
                $node.show();
            }

            $node.addClass('open');
            self.shown = true;
            self.trigger('show');
            return this;
        },
        toggle: function(open) {
            if(this.shown) {
                this.hide();
            } else  {
                this.show();
            }
        },
        updateWidget: function(updated) {
            this.constructed = false;
        },
        _constructMenu: function() {
            this.constructed = true;
        }
    });
});
