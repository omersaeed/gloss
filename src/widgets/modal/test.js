/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../modal'
], function ($, Modal) {

    test('Modal instantiation', function () {
        var m = Modal().appendTo('#qunit-fixture');

        ok(m);
    });

    test('visual test', function () {
        var m = Modal(undefined, {
            title: 'Test Modal',
            width: 200,
            height: 200,
            closeBtn: true
        }).appendTo('body');

        ok(m);

        m.open();
    });

    start();
});