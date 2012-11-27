/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../tabbedframe',
    'tmpl!./testTemplate.mtpl',
    'css!./testCss.css'
], function($, _, TabbedFrame, template) {

    asyncTest('set tab widths', function() {
        var tf = TabbedFrame($(template()).appendTo('body')), w, h;
        w = tf.tabs[0].button.outerWidth();
        h = tf.tabs[0].button.outerHeight();
        _.each(_.range(3), function(i) {
            tf.open(i);
            _.each(_.range(3), function(j) {
                equal(tf.tabs[j].button.outerWidth(), w);
                equal(tf.tabs[j].button.outerHeight(), h);
            });
        });
        start();
    });

    start();
});

