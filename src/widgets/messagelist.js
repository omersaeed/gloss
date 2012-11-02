define([
    'vendor/jquery',
    './widget'
], function($, Widget) {
    return Widget.extend({
        create: function() {
            this.shown = false;
            this.$node.hide().addClass('messagelist');
        },
        append: function(type, messages) {
            var h, i, l;
            if(!$.isArray(messages)) {
                messages = [messages];
            }
            if(!this.shown) {
                this.$node.show();
                this.shown = true;
            }
            for(i = 0, l = messages.length; i < l; i++) {
                if(messages[i] != null) {
                    $('<div>')
                        .hide()
                        .addClass(type)
                        .html(messages[i])
                        .appendTo(this.$node)
                        .slideDown('fast');
                }
            }
            return this;
        },
        clear: function() {
            var self = this;
            self.$node.find('div').slideUp('fast', function() {
                self.$node.hide().empty();
            });
            self.shown = false;
            return self;
        }
    });
});
