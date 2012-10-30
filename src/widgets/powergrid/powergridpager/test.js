/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/underscore',
    './../../powergrid',
    './../columnmodel',
    './../column',
    './../powergridpager',
    './../mockedexample',
    './../examplefixtures'
], function($, _, PowerGrid, ColumnModel, Column, PowerGridPager,
            Example, exampleFixtures) {

    var BasicColumnModel = ColumnModel.extend({
            columnClasses: [
                Column.extend({defaults: {name: 'text_field'}}),
                Column.extend({defaults: {name: 'required_field'}}),
                Column.extend({defaults: {name: 'boolean_field'}}),
                Column.extend({defaults: {name: 'datetime_field'}}),
                Column.extend({defaults: {name: 'integer_field'}}),
                Column.extend({defaults: {name: 'float_field'}}),
                Column.extend({defaults: {name: 'default_field'}})
            ]
        }),
        setup = function(options) {
            var g, dfd = $.Deferred(),
                collection = Example.collection();

            options = $.extend(true, {
                appendTo: '#qunit-fixture',
                gridClass: PowerGrid,
                gridOptions: {},
                swapOutRequestPrototype: false
            }, options);

            Example.models.clear();

            p = window.p = PowerGridPager(undefined, {
                collection: collection
            }).appendTo(options.appendTo);
            g = window.g = options.gridClass($.extend({
                columnModelClass: BasicColumnModel,
                collection: collection,
                collectionLoadArgs: options.params
            }, options.gridOptions)).appendTo(options.appendTo);

            g.get('collection').load(options.params).then(function() {
                $(function() {
                    dfd.resolve(g, p, options);
                });
            });

            return dfd;
        };

    module('powergrid pager');

    asyncTest('setting collection correctly populates grid', function() {
        var appendTo = 'body';

        setup({
            gridOptions: {selectable: true},
            appendTo: appendTo
        }).then(function(g, p, options) {
            p.appendTo(appendTo);
            ok(g);
            equal(g.get('models').length, p.options.pageSize);
            start();
        });
    });

    asyncTest('next page', function() {
        setup({
            gridOptions: {selectable: true}
        }).then(function(grid, pager, options) {
            ok(grid);
            pager.$node.find('.next-page').click();

            setTimeout(function() {
                equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                equal(parseInt(pager.$currentPage.val(), 10), 2);
                start();
            }, 100);
        });
    });

    asyncTest('last page', function() {
        setup({
            gridOptions: {selectable: true}
        }).then(function(grid, pager, options) {
            ok(grid);
            pager.$node.find('.last-page').click();

            setTimeout(function() {
                equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                equal(parseInt(pager.$currentPage.val(), 10), 40);
                start();
            }, 100);
        });
    });

    asyncTest('previous page', function() {
        setup({
            gridOptions: {selectable: true}
        }).then(function(grid, pager, options) {
            ok(grid);
            pager.$node.find('.last-page').click();

            setTimeout(function() {
                equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                equal(parseInt(pager.$currentPage.val(), 10), 40);
                pager.$node.find('.prev-page').click();
                setTimeout(function() {
                    equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                    equal(parseInt(pager.$currentPage.val(), 10), 39);
                    start();
                }, 100);
            }, 100);
        });
    });

    asyncTest('first page', function() {
        setup({
            gridOptions: {selectable: true}
        }).then(function(grid, pager, options) {
            ok(grid);
            pager.$node.find('.first-page').click();

            setTimeout(function() {
                equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                equal(parseInt(pager.$currentPage.val(), 10), 1);
                start();
            }, 100);
        });
    });

    /* This test for the case when you're last page only contains
    *  25 items but your page size it 75. That worked fine but
    *  when you click the previous page the limit and offset was
    *  not being referenced properly and the previous page would
    *  only show 25 item when it should show 75.
    **/
    asyncTest('edge case on out of range paging', function() {
        setup({
            gridOptions: {selectable: true}
        }).then(function(grid, pager, options) {
            ok(grid);
            pager.$pageSize.val(75);
            pager.$pageSize.trigger('change');

            setTimeout(function() {
                equal(parseInt(pager.$currentPage.val(), 10), pager.page);
                pager.$node.find('.last-page').click();
                setTimeout(function() {
                    equal(parseInt(pager.$currentPage.val(), 10), 14);
                    equal(pager.options.collection.currentPage().length, 25);
                    pager.$node.find('.prev-page').click();
                    setTimeout(function() {
                        equal(pager.options.pageSize, 75);
                        equal(pager.options.collection.currentPage().length,
                                pager.options.pageSize);
                        pager.$node.find('.next-page').click();
                        setTimeout(function() {
                            equal(pager.options.collection.currentPage().length, 25);
                            start();
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        });
    });

    asyncTest('instantiate with no collection', function() {
        var pager = PowerGridPager().appendTo('#quint-fixture');

        ok(pager);
        start();
    });

    start();

});
