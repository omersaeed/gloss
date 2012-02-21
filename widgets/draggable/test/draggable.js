/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/draggable',
    'link!vendor/gloss/widgets/test/draggable.css'
], function($, Widget, Draggable) {
    var MyWidget = Widget.extend({}, {mixins: [Draggable]});

    test('draggable element', function() {
        var $el = $('<div class=to-be-dragged>').appendTo('body'),
            w = MyWidget($el);
    });
});
