define([
    './../widget',
    './../draggable'
], function(Widget, Draggable) {
    return Widget.extend({
        defaults: {
            draggable: {dimensions: {x: true, y: false}}
        },
        nodeTemplate: '<span class=resize-handle></span>',
        create: function() {
            this.$node.on('mousedown', function(evt) {
                evt.preventDefault();
                return false;
            }).on('click', function(evt) {
                evt.preventDefault();
                return false;
            });
        }
    }, {mixins: [Draggable]});
});
