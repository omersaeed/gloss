/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../selectionlist'
], function ($, SelectionList) {

    test('selection list instantiation', function () {
        var sl = SelectionList().appendTo('body');

        ok(sl);
    });

    start();
});