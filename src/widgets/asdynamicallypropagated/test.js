/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../widget',
    './../../view',
    './../asdynamicallypropagated'
], function(Widget, View, asDynamicallyPropagated) {

    test('dynamic propagate', function() {
        var widget, view, widget2, view2, count = 0,
            MyWidget = Widget.extend();

        widget = MyWidget();
        view = View.extend({inc: function() {count++;}})()
                    .appendTo(widget.node);

        widget.propagate('inc');
        equal(count, 0);

        asDynamicallyPropagated.call(MyWidget.prototype);

        widget2 = MyWidget();
        view2 = View.extend({inc: function() {count++;}})()
                    .appendTo(widget2.node);

        widget2.propagate('inc');
        equal(count, 1);
    });

    start();

});
