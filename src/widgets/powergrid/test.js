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
    var BasicColumnModel = ColumnModel.extend({
            columnClasses: [
                Column.extend({name: 'text_field'}),
                Column.extend({name: 'required_field'}),
                Column.extend({name: 'boolean_field'}),
                Column.extend({name: 'datetime_field'}),
                Column.extend({name: 'integer_field'}),
                Column.extend({name: 'default_field'})
            ]
        }),
        setup = function(options) {
            var g, dfd = $.Deferred();

            options = $.extend(true, {
                params: {limit: 15},
                appendTo: '#qunit-fixture',
                gridClass: PowerGrid,
                gridOptions: {}
            }, options);

            Example.models.clear();

            g = window.g = options.gridClass($.extend({
                columnModelClass: BasicColumnModel,
                collection: Example.collection(),
                collectionLoadArgs: options.params
            }, options.gridOptions)).appendTo(options.appendTo);

            g.get('collection').load(options.params).then(function() {
                dfd.resolve(g, options);
            });

            return dfd;
        },
        origAjax = Example.prototype.__requests__.query.ajax,
        trim = function(s) {
            return _.isString(s)?
                s.replace(/\s+$/g, '').replace(/^\s+/g, '') : s;
        };

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

    var sortable = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(
                colModelClass.prototype.columnClasses,
                function(columnClass) {
                    return columnClass.extend({sortable: true});
                })
        });
    };

    asyncTest('grid is initially sorted and responds to re-sorting', function() {
        setup({
            gridOptions: {
                columnModelClass: sortable(BasicColumnModel),
                sort: {column: 'text_field', direction: 'ascending'}
            },
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            var expectedText =
                ['item 9', 'item 8', 'item 7', 'item 6', 'item 5', 'item 4',
                 'item 3', 'item 2', 'item 14', 'item 13', 'item 12', 'item 11',
                 'item 10', 'item 1', 'item 0'],
                expectedInt = [
                    990, 795, 789, 779, 764, 582, 516, 439, 252, 247, 228, 221,
                    159, 112, 13];

            sortedOn(g, 'text_field', expectedText);

            equal(g._renderCount, 1, 'instantiation only renders once');

            g.$thead.find('th.col-text_field').trigger('click');

            sortedOn(g, 'text_field', expectedText.slice(0).reverse());
            equal(g._renderCount, 2, 'changing sort only rerenders once');

            g.$thead.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt);
            equal(g._renderCount, 3, 'changing sort only rerenders once');

            g.$thead.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt.slice(0).reverse());

            start();
        });
    });

    module('selecting');

    asyncTest('selecting a model selects the row', function() {
        setup({
            gridOptions: {selectable: true},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            g.select(g.get('collection').where({text_field: 'item 7'}));
            equal(g.$el.find('.selected').length, 1, 'only one is selected');
            equal(trim(g.$el.find('.selected td.col-text_field').text()),
                'item 7', 'correct row selected');
            equal(g._renderRowCount, 1, 'only one row was rerendered');
            equal(g._renderCount, 1, 'grid wasnt rerendered');

            g.$el.find(':contains(item 2)').trigger('click');
            equal(g.$el.find('.selected').length, 1, 'click triggers selection');
            equal(trim(g.$el.find('.selected td.col-text_field').text()),
                'item 2', 'correct row selected');
            equal(g._renderRowCount, 3, 'two rows were re-rendered');
            start();
        });
    });

    asyncTest('sorting a selected row maintains selection', function() {
        setup({
            gridOptions: {
                selectable: true,
                columnModelClass: sortable(BasicColumnModel)
            },
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            g.select(g.get('collection').where({text_field: 'item 2'}));
            g.$thead.find('th.col-integer_field').trigger('click');
            var $selected = g.$el.find('.selected');
            equal($selected.length, 1, 'only one is selected');
            equal(trim($selected.find('td.col-text_field').text()),
                'item 2', 'correct row selected');
            equal($selected.index(), 11, 'selected row correctly sorted');
            start();
        });
    });

    asyncTest('unselecting a single row', function() {
        setup({
            gridOptions: {selectable: true},
            appendTo: 'body'
        }).then(function(g, options) {
            g.select(g.get('collection').where({text_field: 'item 2'}));

            var $selected = g.$el.find('.selected');
            equal($selected.length, 1, 'only one is selected');
            equal(trim($selected.find('td.col-text_field').text()),
                'item 2', 'correct row selected');

            g.unselect();

            $selected = g.$el.find('.selected');
            equal($selected.length, 0, 'no rows selected');
            ok(g.get('collection').where(g.get('selectedAttr'), true) == null,
                'no models have been selected');

            start();
        });
    });

    start();
});

