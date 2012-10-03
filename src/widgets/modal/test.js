/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../modal'
], function ($, Modal) {

    test('Modal instantiation', function () {
        var m = Modal().appendTo('#qunit-fixture');

        ok(m);
    });

    test('modal height and width', function () {
        var m = Modal(undefined, {
            height: 207,
            width: 208
        }).appendTo('#qunit-fixture');

        equal(m.$node.height(), 207);
        equal(m.$node.width(), 208);
    });

    // test('modal within a modal', function() {
    //     var outer = Modal(undefined, {
    //             title: 'outer modal',
    //             closeBtn: true
    //         }).appendTo('body'),
    //         inner = Modal(undefined, {
    //             title: 'inner modal',
    //             closeBtn: true
    //         }).appendTo('body');

    //     outer.open();
    //     inner.open();

    //     outer.close();
    //     inner.close();
    // });

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

    function getSelection() {
        return (!!document.getSelection) ? document.getSelection() :
               (!!window.getSelection)   ? window.getSelection() :
               document.selection.createRange().text;
    }
    test('modal with selectable textarea', function () {
        var tmpl = '<div>' +
                        '<textarea>Some Text</textarea>' +
                    '</div>',
            m = Modal(tmpl, {
            title: 'Test Modal',
            width: 200,
            height: 200,
            closeBtn: true
        }).appendTo('#qunit-fixture');

        ok(m);

        m.open();
        $textarea = $('textarea');
        $textarea.select();
        ok(getSelection().toString() === $textarea.text(), "can't select text in textarea");
    });

    start();
});
