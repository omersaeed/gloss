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

    test('MessageBox instantiation with event aliases', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            okBtn: 'Oks',
            cancelBtn: 'Cancels',
            okBtnEvent: 'okAlias',
            cancelBtnEvent: 'cancelAlias'
        }).appendTo('#qunit-fixture');
        ok(m);
    });

    test('MessageBox instantiation with type', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons',
            okBtn: 'Oks',
            cancelBtn: 'Cancels',
            okBtnEvent: 'okAlias',
            cancelBtnEvent: 'cancelAlias',
            style: 'error'
        }).appendTo('#qunit-fixture');
        ok(m);
    });

    test('Visual Test', function () {
        var m = MessageBox(undefined, {
            title: 'Test MessageBox',
            body: 'Test Message Box With Both Buttons and a message that is really long but absolutely meaningless. Trying to make it longer is of little to no use as well. ',
            okBtn: 'Ok',
            cancelBtn: 'Cancel',
            optionBtn: 'Option',
            okBtnEvent: 'OkBtnAlias',
            cancelBtnEvent: 'CancelBtnAlias',
            optionBtnEvent: 'OptionBtnAlias',
            style: 'error'
        }).on('OkBtnAlias', function() {
            alert('Ok Pressed');
        }).on('CancelBtnAlias', function() {
            alert('Cancel Pressed');
        }).on('OptionBtnAlias', function() {
            alert('Option Pressed');
        }).appendTo('body');

        ok(m);

        m.open();
    });

    start();
});
