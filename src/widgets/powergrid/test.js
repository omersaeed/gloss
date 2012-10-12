/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/example',
    './../powergrid',
    './columnmodel',
    './column',
    './column/checkboxcolumn',
    './column/datecolumn',
    './column/bytescolumn',
    './powergridsearch',
    './examplefixtures'
], function($, _, Example, PowerGrid, ColumnModel, Column, CheckBoxColumn,
    DateColumn, BytesColumn, PowerGridSearch, exampleFixtures) {

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
            var g, dfd = $.Deferred();

            options = $.extend(true, {
                params: {limit: 15},
                appendTo: '#qunit-fixture',
                gridClass: PowerGrid,
                gridOptions: {},
                swapOutRequestPrototype: false
            }, options);

            Example.models.clear();

            g = window.g = options.gridClass($.extend({
                columnModelClass: BasicColumnModel,
                collection: Example.collection(),
                collectionLoadArgs: options.params
            }, options.gridOptions)).appendTo(options.appendTo);

            g.get('collection').load(options.params).then(function() {
                $(function() {
                    dfd.resolve(g, options);
                });
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
        var query, dfd = $.Deferred(),
            resources = [],
            limit = params.data.limit || exampleFixtures.length,
            offset = params.data.offset || 0;

        query = eval('query = ' + (params.data.query || '{}'));

        for (var i = offset; i < limit; i++) {
            if (query.integer_field__gt) {
                if (exampleFixtures[i].integer_field > query.integer_field__gt) {
                    resources.push(_.extend({}, exampleFixtures[i]));
                }
            } else {
                resources.push(_.extend({}, exampleFixtures[i]));
            }
        }

        setTimeout(function() {
            params.success({
                resources: resources,
                length: resources.length
            }, 200, {});
        }, 0);
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
        var sortCol = function() {
            return _.find(g.get('columnModel').columns, function(c) {
                return c.get('sort');
            });
        };
        equal(sortCol().get('name'), colName, 'sort.column set correctly');

        orderMatches(
            g.$el.find('td.col-'+colName).map(function(i, el) {
                return $(el).text();
            }), order);

        equal(g.$el.find('th.col-'+colName+' span.sort-arrow').length, 1,
                'sort arrow appears');

    };

    var sortable = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(
                colModelClass.prototype.columnClasses,
                function(columnClass) {
                    return columnClass.extend({defaults: {sortable: true}});
                })
        });
    };

    asyncTest('grid is initially sorted and responds to re-sorting', function() {
        var ColModel = sortable(BasicColumnModel);

        ColModel.prototype.columnClasses[0] =
            ColModel.prototype.columnClasses[0].extend({
                defaults: {sort: 'ascending'}
            });

        setup({
            gridOptions: {columnModelClass: ColModel},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            var expectedText =
                ['item 9', 'item 8', 'item 7', 'item 6', 'item 5', 'item 4',
                 'item 3', 'item 2', 'item 14', 'item 13', 'item 12', 'item 11',
                 'item 10', 'item 1', 'item 0'],
                expectedInt = [
                    990, 795, 789, 779, 764, 582, 516, 439, 252, 247, 228, 221,
                    159, 112, 13];

            sortedOn(g, 'text_field', expectedText.slice(0).reverse());

            equal(g._renderCount, 1, 'instantiation only renders once');

            g.$el.find('th.col-text_field').trigger('click');

            sortedOn(g, 'text_field', expectedText);
            equal(g._renderCount, 2,
                'changing sort only rerenders once (first check)');

            g.$el.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt.slice(0).reverse());
            equal(g._renderCount, 3,
                    'changing sort only rerenders once (second check)');

            g.$el.find('th.col-integer_field').trigger('click');

            sortedOn(g, 'integer_field', expectedInt);

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

            g.$el.find('td:contains(item 2)').trigger('click');
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
            }
        }).then(function(g, options) {
            g.select(g.get('collection').where({text_field: 'item 2'}));
            g.$el.find('th.col-integer_field').trigger('click');
            g.$el.find('th.col-integer_field').trigger('click');
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
            appendTo: '#qunit-fixture'
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

    asyncTest('selecting multiple rows', function() {
        setup({
            gridOptions: {selectable: 'multi'},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            g.select(g.get('collection').where({text_field: 'item 3'}));
            var $selected = g.$el.find('.selected');
            equal($selected.length, 1, 'only one is selected');
            equal(trim($selected.find('td.col-text_field').text()),
                'item 3', 'correct row selected');

            g.select(g.get('collection').where({text_field: 'item 6'}),
                {dontUnselectOthers: true});
            $selected = g.$el.find('.selected');
            equal($selected.length, 2, 'two are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 6', 'correct row selected');

            g.$el.find('td:contains(item 2)').trigger(
                $.Event('click', {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 3, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(2).text()),
                'item 6', 'correct row selected');

            g.$el.find('td:contains(item 5)').trigger('click');
            $selected = g.$el.find('.selected');
            equal($selected.length, 1, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 5', 'correct row selected');

            g.$el.find('td:contains(item 2)').trigger(
                $.Event('click', {shiftKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 4, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(2).text()),
                'item 4', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(3).text()),
                'item 5', 'correct row selected');

            g.$el.find('td:contains(item 4)').trigger(
                $.Event('click', {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 3, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(2).text()),
                'item 5', 'correct row selected');

            g.$el.find('td:contains(item 3)').trigger(
                $.Event('click', {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 2, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 5', 'correct row selected');

            start();
        });
    });

    module('resizing');

    var resizable = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(
                colModelClass.prototype.columnClasses,
                function(columnClass) {
                    return columnClass.extend({defaults: {resizable: true}});
                })
        });
    };

    asyncTest('resizable columns have resize handle el', function() {
        setup({
            gridOptions: {columnModelClass: resizable(BasicColumnModel)}
        }).then(function(g) {
            equal(g.$el.find('th .resize').length,
                BasicColumnModel.prototype.columnClasses.length);
            start();
        });
    });

    asyncTest('setting column width works', function() {
        setup({
            gridOptions: {columnModelClass: resizable(BasicColumnModel)}
        }).then(function(g) {
            var startingWidths = g.$el.find('thead th').map(function(i, el) {
                    return $(el).outerWidth();
                }),
                newWidths = startingWidths.slice(0),
                columns = g.get('columnModel').columns;
            newWidths[1] = 400;
            columns[1].set('width', newWidths[1]);
            g.$el.find('thead th').each(function(i, el) {
                var col = g.get('columnModel').columns[i];
                equal(col.get('width'), newWidths[i],
                    'column object width for '+col.get('name')+' matches expected');
                equal($(el).outerWidth(), newWidths[i],
                    'element width for '+col.get('name')+' matches expected');
            });

            newWidths[4] = 50;
            columns[4].set('width', newWidths[4]);
            g.$el.find('thead th').each(function(i, el) {
                var col = g.get('columnModel').columns[i];
                equal(col.get('width'), newWidths[i],
                    'column object width for '+col.get('name')+' matches expected');
                equal($(el).outerWidth(), newWidths[i],
                    'element width for '+col.get('name')+' matches expected');
            });
            start();
        });
    });

    module('hiding columns');

    asyncTest('hiding column works', function() {
        setup().then(function(g) {
            equal(g.$el.find('.col-required_field:visible').length,
                g.get('models').length+1,
                'required_field cells and header visible');
            equal(g.$el.find('.col-required_field:visible').length, 16,
                'required_field cells and header visible');

            g.get('columnModel').columns[1].hide();

            equal(g.$el.find('.col-required_field:visible').length, 0,
                'required_field cells and header are hidden');

            g.get('columnModel').columns[1].show();

            equal(g.$el.find('.col-required_field:visible').length,
                g.get('models').length+1,
                'required_field cells and header visible');
            equal(g.$el.find('.col-required_field:visible').length, 16,
                'required_field cells and header visible');

            start();
        });
    });

    module('data thats not backed by a collection');

    test('raw data objects', function() {
        var g = PowerGrid({columnModelClass: BasicColumnModel})
            .appendTo('#qunit-fixture');

        g.set('data', _.map(exampleFixtures, function(f) {
            return $.extend(true, {}, f);
        }));
        equal(g.get('models').length, exampleFixtures.length);
        equal(g.get('models').length, 1000);
        equal(g.$el.find('tr').length, 1001);
    });

    module('search widget');

    var MySearch = PowerGridSearch.extend({
        defaults: {searchParam: 'integer_field__gt'}
    });

    asyncTest('search widget correctly maintains limit', function() {
        var appendTo = '#qunit-fixtire';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(500);

            search.submit().then(function() {
                ok(g.get('models').length <= originalLength,
                    'original limit was preserved');
                start();
            });
        });
    });

    asyncTest('correctly sets search params', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                start();
            });
        });
    });

    asyncTest('correctly clears search params', function() {
        var appendTo = '#qunit-fixture', cutoff1 = 500, cutoff2 = 200;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff1);

            search.submit().then(function() {
                var cutoff1Length = g.get('models').length;
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff1,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                search.getWidget('q').setValue(cutoff2);
                search.submit().then(function() {
                    setTimeout(function() {
                        _.each(g.get('models'), function(m) {
                            ok(m.get('integer_field') > cutoff2,
                                'filter worked correctly for '+m.get('text_field'));
                        });
                        ok(g.get('models').length < originalLength);
                        ok(g.get('models').length > cutoff1Length);

                        search.getWidget('clear').trigger('click');
                        setTimeout(function() {
                            equal(g.get('models').length, originalLength);
                            start();
                        }, 15);
                    }, 15);
                });
            });
        });
    });

    asyncTest('correctly causes the "filtered" class to be applied', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            equal(g.$el.hasClass('filtered'), false);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(g.$el.hasClass('filtered'), true);

                search.getWidget('clear').trigger('click');

                setTimeout(function() {
                    equal(g.$el.hasClass('filtered'), false);
                    start();
                }, 50);
            });
        });
    });

    asyncTest('disabled while searching', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(search.getWidget('q').getState('disabled'),      false);
                equal(search.getWidget('clear').getState('disabled'),  false);
                equal(search.getWidget('search').getState('disabled'), false);
                start();
            });

            equal(search.getWidget('q').getState('disabled'),      true);
            equal(search.getWidget('clear').getState('disabled'),  true);
            equal(search.getWidget('search').getState('disabled'), true);
        });
    });

    module('checkbox column');

    var withCheckboxColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses:
                [CheckBoxColumn].concat(colModelClass.prototype.columnClasses)
        });
    };

    asyncTest('renders checkboxes', function() {
        setup({
            gridOptions: {
                columnModelClass: withCheckboxColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
            start();
        });
    });

    asyncTest('checking a checkbox sets the corresponding model prop', function() {
        setup({
            gridOptions: {
                columnModelClass: withCheckboxColumn(BasicColumnModel)
            }
        }).then(function(g) {
            ok(!g.get('models')[0].get('_checked'));
            g.$el.find('tbody [type=checkbox]').first().trigger('click');
            setTimeout(function() {
                equal(g.get('models')[0].get('_checked'), true);
                start();
            }, 15);
        });
    });

    asyncTest('checking header checks all', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withCheckboxColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
            equal(g.$el.find('[type=checkbox]:checked').length, 0);
            _.each(g.get('models'), function(m) { ok(!m.get('_checked')); });
            g.$el.find('thead [type=checkbox]').trigger('click');
            setTimeout(function() {
                equal(g.$el.find('[type=checkbox]').length,
                    g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]:checked').length,
                    g.get('models').length+1);
                _.each(g.get('models'),
                    function(m) { ok(m.get('_checked')); });
                start();
            }, 15);
        });
    });

    module('date column');

    var withDateTimeColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'datetime_field'?
                        DateColumn.extend({defaults: {name: 'datetime_field'}}) : c;
                })
        });
    };

    asyncTest('renders dates correctly', function() {
        setup({
            gridOptions: {
                columnModelClass: withDateTimeColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("2012-08-29 9:10 AM")').length, 15);
            start();
        });
    });

    module('bytes column');

    var withBytesColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'float_field'?
                        BytesColumn.extend({defaults: {name: 'float_field'}}) : c;
                })
        });
    };

    asyncTest('renders bytes correctly', function() {
        setup({
            appendTo: 'body',
            gridOptions: {
                columnModelClass: withBytesColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("532.26 MB")').length, 1);
            start();
        });
    });

    start();
});

