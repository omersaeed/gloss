define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget',
    'link!css/widgets/menu.css'
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
            
            self.$node.addClass('menu').hide();
            self.$entries = $('<ul>').appendTo(self.$node);

            self.$node.on('click', 'li', function(event) {
                self.select($(this).data('entry'));
                return false;
            });
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
        select: function(entry) {
            if(this.options.updateDisplay){
                this.hide();
            }
            this.triggerHandler('select', entry);
            if(entry.onselect){
                entry.onselect(entry);
            }
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
            var self = this, entries = this.options.entries;
            if(entries == null || entries.length == 0) {
                self.constructed = false;
                return;
            }

            self.$entries.empty();
            $.each(entries, function(i, entry) {
                var $node = $('<li>').html(entry.content).data('entry', entry).attr('tabindex', -1);
                if(entry.classes != null) {
                    $node.addClass(entry.classes);
                }
                self.$entries.append($node);
            });

            self.$entries.find('li').first().addClass('first');
            self.$entries.find('li').last().addClass('last');
            self.constructed = true;
        }
    });
});
