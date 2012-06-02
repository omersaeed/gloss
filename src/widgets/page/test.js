/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../page',
    'tmpl!./noArgTest.mtpl',
    'tmpl!./argTest.mtpl'
], function ($, Page, NoArgTmpl, ArgTmpl) {

    test('Page instantiation test', function () {
        var page = Page();

        ok(page);

        start();
    });
    test('Page micro template with no args test', function () {
        var page = Page(undefined, {
            template: NoArgTmpl(null)
        });

        ok(page);

        start();
    });
    test('Page micro template with args test', function () {
        var page,
            args = [
                {text: 'One'},
                {text: 'Two'},
                {text: 'Three'},
                {text: 'four'},
                {text: 'five'},
                {text: 'Six'}
            ];

        page = Page(undefined, {
            template: ArgTmpl(args)
        });

        ok(page);

        start();
    });
    test('Page loaded event test', function() {
        var page = Page();

        ok(page);
        page.on('loaded', function() {
            ok("complete", document.readyState);
        });
    });
    test('Page load deferred test', function() {
        var page = Page();

        page.load.done(function() {
            ok(page);
            start();
        });
    });
    start();
});
