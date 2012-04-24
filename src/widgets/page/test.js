require([
    'path!vendor:jquery',
    'path!gloss:widgets/page',
    'path!gloss:tmpl!widgets/page/noArgTest.mtpl',
    'path!gloss:tmpl!widgets/page/argTest.mtpl'
], function ($, Page, NoArgTmpl, ArgTmpl) {

    test('Page instantiation test', function () {
        var page = Page();

        ok(page);

        start();
    });
    test('Page micro template with no args test', function () {
        var page = Page(undefined, {
            microTemplate: NoArgTmpl(null)
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
            microTemplate: ArgTmpl(args)
        });

        ok(page);

        start();
    });
    start();
});