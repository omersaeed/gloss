define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget',
    'link!vendor/gloss/widgets/basemenu/basemenu.css'
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

            self.$node.addClass('basemenu').hide();
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

            this.shown = false;
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

            if(this.options.updateDisplay) {
                Widget.onPageClick(self.$node, function() {
                    self.hide();
                });
            }

            this.shown = true;
            return this;
        },
        updateWidget: function(updated) {
            this.constructed = false;
        },
        _constructMenu: function() {
            this.constructed = true;
        }
    });
});
