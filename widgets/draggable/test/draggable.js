/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/draggable',
    'vendor/gloss/widgets/draggablerow',
    'text!vendor/gloss/widgets/draggable/test/draggable.html',
    'link!vendor/gloss/widgets/draggable/test/draggable.css'
], function($, Widget, Draggable, DraggableRow, draggable_html) {

    test('draggable element', function() {
        window.MyWidget = Widget.extend({
            defaults: {}
        }, {mixins: [Draggable]});
        var $el = $('<div class=to-be-dragged>').appendTo('body');
        window.w1 = window.MyWidget($el);
    });

    test('draggable cloned element', function() {
        window.MyWidget2 = Widget.extend({
            defaults: {
                draggable: {clone: true}
            }
        }, {mixins: [DraggableRow]});
        var $el = $(draggable_html).appendTo('body').find('.row-to-be-dragged');
        window.w2 = window.MyWidget2($el);
    });

});
