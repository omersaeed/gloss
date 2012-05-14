define([
    'component!vendor:jquery',
    './widget',
    'css!./messagelist/messages.css'
], function($, Widget) {
    return Widget.extend({
        create: function() {
            this.shown = false;
            this.$node.hide().addClass('messagelist');
        },
        append: function(type, messages) {
            if(!$.isArray(messages)) {
                messages = [messages];
            }
            for(var i = 0, l = messages.length; i < l; i++) {
                if(messages[i] != null) {
                    $('<div>').hide().addClass(type).html(messages[i]).appendTo(this.$node).show();
                }
            }
            if(!this.shown) {
                this.$node.show();
                this.shown = true;
            }
            return this;
        },
        clear: function() {
            this.$node.hide().empty();
            this.shown = false;
            return this;
        }
    });
});
