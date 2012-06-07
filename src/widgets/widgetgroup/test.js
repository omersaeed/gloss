/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/ 
define([
    'vendor/jquery',
    './../widgetgroup',
    'text!./widgetgrouptesttmpl.html'
], function($, WidgetGroup, html) {
    test('correctly group widgets', function() {
        var wg = WidgetGroup($(html), {widgetize: true});
        deepEqual(wg.getValues(), {
            baz: 'bazvalue',
            fieldset1: {foo: 'foovalue'},
            fieldset2: {bar: 'barvalue'}
        });
    });
    start();
});
