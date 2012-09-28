/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/example',
    './../powergrid',
    './columnmodel',
    './column',
    './examplefixtures'
], function($, _, Example, PowerGrid, ColumnModel, Column, exampleFixtures) {
    var setup = function(options) {
            var g, dfd = $.Deferred();

            options = $.extend(true, {
                params: {limit: 15},
                appendTo: '#qunit-fixture'
            }, options);

            Example.models.clear();

            g = PowerGrid({
                columnModelClass: ColumnModel.extend({
                    columnClasses: [
                        Column.extend({name: 'text_field', sortable: true}),
                        Column.extend({name: 'required_field', sortable: true}),
                        Column.extend({name: 'boolean_field', sortable: true}),
                        Column.extend({name: 'datetime_field', sortable: true}),
                        Column.extend({name: 'integer_field', sortable: true}),
                        Column.extend({name: 'default_field', sortable: true})
                    ]
                }),
                sort: {column: 'text_field', direction: 'ascending'},
                collection: Example.collection(),
                collectionLoadArgs: options.params
            }).appendTo(options.appendTo);

            g.get('collection').load(options.params).then(function() {
                dfd.resolve(g, options);
            });

            return dfd;
        },
        origAjax = Example.prototype.__requests__.query.ajax;

    window.Example = Example;

    Example.prototype.__requests__.query.ajax = function(params) {
        var dfd = $.Deferred(),
            resources = [],
            limit = params.limit || exampleFixtures.length,
            offset = params.offset || 0;

        for (var i = offset; i < limit; i++) {
            resources.push(_.extend({}, exampleFixtures[i]));
        }

        params.success({
            resources: resources,
            length: resources.length
        }, 200, {});
        return dfd;
    };

    asyncTest('everythings cool', function() {
        setup().then(function(g, options) {
            equal(g.get('models').length, options.params.limit);
            equal(g.$el.find('thead th:first').hasClass('col-text_field'), true,
                'column header class is set correctly');
            equal(g.$el.find('tbody td:first').hasClass('col-text_field'), true,
                'column class is set correctly');
            start();
        });
    });

    module('sorting');

    var orderMatches = function(actual, expected) {
        var trim = function(s) {
            return _.isString(s)?
                s.replace(/\s+$/g, '').replace(/^\s+/g, '') : s;
        };
        _.each(actual, function(n, i) {
            equal(trim(n), trim(expected[i]), 'checking order for item '+i);
        });
    };

    var sortedOn = function(g, colName, order) {
        equal(g.get('sort.column').name, colName, 'sort.column set correctly');

        orderMatches(
            g.$el.find('td.col-'+colName).map(function(i, el) {
                return $(el).text();
            }), order);

        equal(g.$thead.find('th.col-'+colName+' span.sort-arrow').length, 1,
                'sort arrow appears');

    };

    asyncTest('grid is initially sorted and responds to re-sorting', function() {
        setup({appendTo: 'body'}).then(function(g, options) {
            var expectedText =
                ['item 9', 'item 8', 'item 7', 'item 6', 'item 5', 'item 4',
                 'item 3', 'item 2', 'item 14', 'item 13', 'item 12', 'item 11',
                 'item 10', 'item 1', 'item 0'],
                expectedInt = [
                    990, 795, 789, 779, 764, 582, 516, 439, 252, 247, 228, 221,
                    159, 112, 13];

            sortedOn(g, 'text_field', expectedText);

            g.$thead.find('th.col-text_field').trigger('click');

            sortedOn(g, 'text_field', expectedText.slice(0).reverse());

            g.$thead.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt);

            g.$thead.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt.slice(0).reverse());

            start();
        });
    });

    start();
});

