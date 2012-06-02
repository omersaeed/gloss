/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    'tmpl!./template.mtpl'
], function($, tmpl) {
    test('template plugin compiled', function() {
        ok(tmpl);
        var data = {
                foo: {bar: 'baz'},
                list: ['uno', 'dos', 'tres']
            },
            $html = $(tmpl(data));
        equal($html.find('li').length, 3);
        equal($html.find('span:first').text(), data.foo.bar);
        ok(/uno.*dos.*tres/.test($html.find('ul').text()));
    });
    start();
});

