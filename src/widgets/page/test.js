require([
    'path!vendor:jquery',
    'path!gloss:widgets/page',
    'path!gloss:tmpl!widgets/page/noArgTest.mtpl',
    'path!gloss:tmpl!widgets/page/argTest.mtpl'
], function ($, Page, NoArgTmpl, ArgTmpl) {

    $(document).ready(function() {
        console.log('doc ready');
    });

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
    test('Page loaded test', function() {
        var page = Page();
        ok(page);
        page.on('loaded', function() {
            ok("complete", document.readyState);
        });
    });
    start();
});