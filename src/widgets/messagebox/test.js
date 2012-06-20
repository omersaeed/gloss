/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../messagebox'
], function ($, MessageBox) {

    test('MessageBox instantiation', function () {
        var m = MessageBox().appendTo('#qunit-fixture');
        ok(m);
    });

    test('MessageBox instantiation with 2 buttons', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            okBtn: 'Ok',
            cancelBtn: 'Cancel'
        }).appendTo('#qunit-fixture');
        ok(m);
    });

    test('MessageBox instantiation with ok button', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            okBtn: 'Ok'
        }).appendTo('#qunit-fixture');
        ok(m);
    });

    test('MessageBox instantiation with cancel button', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            cancelBtn: 'Cancel'
        }).appendTo('#qunit-fixture');
        ok(m);
    });

    test('Visual Test', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            okBtn: 'Ok',
            cancelBtn: 'Cancel'
        }).on('ok', function() {
            alert('Ok Pressed')
        }).on('cancel', function() {
            alert('Cancel Pressed')
        }).appendTo('body');

        ok(m);

        m.open();
    });

    start();
});
