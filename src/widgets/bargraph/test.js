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
                {name: "Outlook PST", values: [100] },
                {name: "Zip Archive", values: [25] },
                {name: "TGZ archive", values: [75] },
                {name: "WinRAR archive", values: [50] }
            ]
        }).appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph visual test', function () {
        var bg = BarGraph(undefined, {
            data: [
                {name: "Outlook PST", values: [100, 75] },
                {name: "Zip Archive", values: [25, 80] },
                {name: "TGZ archive", values: [75, 20] },
                {name: "WinRAR archive", values: [50, 10] }
            ]
        }).appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph no animation', function () {
        var bg = BarGraph(undefined, {
            data: [
                {name: "Outlook PST", values: [100, 75] },
                {name: "Zip Archive", values: [25, 80] },
                {name: "TGZ archive", values: [75, 20] },
                {name: "WinRAR archive", values: [50, 10] }
            ],
            animationDuration: 0
        }).appendTo('#qunit-fixture');

        ok(bg);
    });

    test('Details graph vertical layout test', function () {
        var bg = BarGraph(undefined, {
            verticalLayout: true
        }).appendTo('#qunit-fixture');

        var data = [
            {name: "Outlook PST", values: [45, 55] },
            {name: "Zip Archive", values: [25, 35] },
            {name: "TGZ archive", values: [80, 90] },
            {name: "WinRAR archive", values: [110, 120] }
        ];

        bg.set('data', data);

        ok(bg);
    });

    test('Details graph animation visual test', function () {
        var bg = BarGraph().appendTo($('body'));

        var data = [
            {name: "Outlook PST", values: [45, 55] },
            {name: "Zip Archive", values: [25, 35] },
            {name: "TGZ archive", values: [80, 90] },
            {name: "WinRAR archive", values: [110, 120] }
        ];

        bg.set('data', data);

        ok(bg);
    });

    start();
});
