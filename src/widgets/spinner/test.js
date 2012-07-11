define([
    'vendor/jquery',
    './../spinner'
], function ($, Spinner) {

    test('Object instantiation', function () {
        var s = Spinner().appendTo('#qunit-fixture');

        ok(s);
    });

    test('functional', function () {
        var s = Spinner('<h1></h1>').appendTo('body');

        ok(s);
        s.disable();
        s.enable();

    }),

    test('visual', function () {
        var s = Spinner(undefined, {
            target: $('body')[0]
        }).appendTo('body');

        ok(s);
        s.disable();
        setTimeout(function() {
            s.enable();
        }, 5000);
    });

    start();
});
