/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    './../ratiograph'
], function ($, RatioGraph) {

    test('Object graph instantiation', function () {
        var rg = RatioGraph().appendTo('#qunit-fixture');

        ok(rg);
        start();
    });
    test('Object graph no animation test', function () {
        var rg = RatioGraph(undefined, {
            totalCount: 100,
            currentCount: 50,
            animationDuration:0
        }).appendTo('#qunit-fixture');

        ok(rg);

        start();
    });
    test('Object graph visual test', function () {
        var rg = RatioGraph().appendTo($('body'));

        ok(rg);

        rg.set('totalCount', 50);
        rg.set('currentCount', 15);
        rg.set('currentCount', 25);
        rg.set('currentCount', 35);

        start();
    });

    start();
});
