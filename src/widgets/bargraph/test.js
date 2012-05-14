/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'component!vendor:jquery',
    './../bargraph'
], function ($, BarGraph) {

    test('Details graph instantiation', function () {
        var bg = BarGraph().appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph visual test', function () {
        var bg = BarGraph(undefined, {
            data: [
                {name: "Outlook PST", value: 100 },
                {name: "Zip Archive", value: 25 },
                {name: "TGZ archive", value: 75 },
                {name: "WinRAR archive", value: 50 }
            ]
        }).appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph no animation', function () {
        var bg = BarGraph(undefined, {
            data: [
                {name: "Outlook PST", value: 100 },
                {name: "Zip Archive", value: 25 },
                {name: "TGZ archive", value: 75 },
                {name: "WinRAR archive", value: 50 }
            ],
            animationDuration: 0
        }).appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph animation visual test', function () {
        var bg = BarGraph().appendTo($('body'));

        var data = [
            {name: "Outlook PST", value: 45 },
            {name: "Zip Archive", value: 25 },
            {name: "TGZ archive", value: 80 },
            {name: "WinRAR archive", value: 110 }
        ];

        bg.set('data', data);

        ok(bg);
    });

    start();
});
