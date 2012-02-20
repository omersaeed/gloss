define([
    'vendor/jquery',
    'vendor/gloss/core/class'
], function($, Class) {
    var slice = Array.prototype.slice;
    return Class.extend({
        init: function() {
            this.unbinders = [];
        },
        on: function($node) {
            var args = slice.call(arguments, 1);
            $node.on.apply($node, args);
            this.unbinders.push(function() {
                $node.off.apply($node, args);
            });
            return this;
        },
        off: function($node) {
            var args = slice.call(arguments, 1);
            $node.off.apply($node, args);
            return this;
        },
        reset: function() {
            for(var i = 0, l = this.unbinders.length; i < l; i++) {
                this.unbinders[i]();
            }
            this.unbinders = [];
            return this;
        }
    });
});
