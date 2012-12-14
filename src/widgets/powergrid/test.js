/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/

// things that are hard to test:
//  - correct placement of the spinner
//  - double clicking multi-select rows
//
// fun facts about these tests:
//  - we can't test a bunch of the checkbox column stuff in any browser other
//    than webkit b/c it's the only one that allows you to check a checkbox by
//    triggering a click event
//  - setting a th width below the content width in IE doesn't work, so one of
//    the unit tests for column resizing doesn't work in IE
//
// things to watch for (visual tests)
//  * the last grid on the page can be used for these tests *
//  - resizing is a rather brittle thing after making changes visually
//    check that a column can be resized
//  - fixed header should be visually tested to make sure it doesn't move
//    when scrolling. If this gets broken it's probaby because someone
//    was playing with the base css.

define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../powergrid',
    './columnmodel',
    './column',
    './column/checkboxcolumn',
    './column/asdatetime',
    './column/asbytes',
    './column/asenumeration',
    './column/asnumber',
    './powergridsearch',
    './mockedexample',
    './examplefixtures'
], function($, _, moment, PowerGrid, ColumnModel, Column, CheckBoxColumn,
    asDateTime, asBytes, asEnumeration, asNumber, PowerGridSearch, Example, exampleFixtures) {

    var BasicColumnModel = ColumnModel.extend({
            columnClasses: [
                Column.extend({defaults: {name: 'text_field'}}),
                Column.extend({defaults: {name: 'required_field'}}),
                Column.extend({defaults: {name: 'boolean_field'}}),
                Column.extend({defaults: {name: 'datetime_field'}}),
                Column.extend({defaults: {name: 'integer_field'}}),
                Column.extend({defaults: {name: 'float_field'}}),
                Column.extend({defaults: {name: 'default_field'}}),
                Column.extend({defaults: {name: 'enumeration_field'}})
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
            }, options.gridOptions));

            if (options.appendTo) {
                g.appendTo(options.appendTo);
            }

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

    asyncTest('unsetting the collection sets removes the models', function() {
        setup().then(function(g, options) {
            equal(g.get('models').length, options.params.limit);
            g.set('collection', undefined);
            equal(g.get('models').length, 0);
            start();
        });
    });

    module('internals');

    asyncTest('_modelFromTr correctly handles tr thats not in grid', function() {
        setup().then(function(g, options) {
            equal(g._modelFromTr($('<tr>')[0]), undefined);
            start();
        });
    });

    asyncTest('_trFromModel correctly handles model thats part of grid', function() {
        setup().then(function(g, options) {
            equal(g._trFromModel({}), undefined);
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

            g.$el.find('td:contains(item 2)').trigger(g.get('selectableEvent'));
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

    asyncTest('getting single selected model', function() {
        setup({
            gridOptions: {selectable: true},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            ok(g.selected() == null);
            g.select(g.get('collection').where({text_field: 'item 2'}));
            equal(g.selected().get('text_field'), 'item 2');
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
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 3, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(2).text()),
                'item 6', 'correct row selected');

            g.$el.find('td:contains(item 5)').trigger(g.get('selectableEvent'));
            $selected = g.$el.find('.selected');
            equal($selected.length, 1, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 5', 'correct row selected');

            g.$el.find('td:contains(item 2)').trigger(
                $.Event(g.get('selectableEvent'), {shiftKey: true}));
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
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 3, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 3', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(2).text()),
                'item 5', 'correct row selected');

            g.$el.find('td:contains(item 3)').trigger(
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            $selected = g.$el.find('.selected');
            equal($selected.length, 2, 'three are selected');
            equal(trim($selected.find('td.col-text_field').eq(0).text()),
                'item 2', 'correct row selected');
            equal(trim($selected.find('td.col-text_field').eq(1).text()),
                'item 5', 'correct row selected');

            start();
        });
    });

    asyncTest('getting multiple selected models', function() {
        setup({
            gridOptions: {selectable: 'multi'},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            deepEqual(g.selected(), []);
            g.select(g.get('collection').where({text_field: 'item 2'}));
            g.select(g.get('collection').where({text_field: 'item 7'}), {
                dontUnselectOthers: true
            });
            deepEqual(
                _.map(g.selected(), function(m) {
                    return m.get('text_field');
                }),
                ['item 2', 'item 7']);
            start();
        });
    });

    // not using this... seems wrong... see powergrid code that triggers select
    // asyncTest('"select" event', function() {
    //     var last = null,
    //         onSelect = function(evt, data) {
    //             last = {
    //                 evt: evt,
    //                 data: data,
    //                 args: Array.prototype.slice.call(arguments, 0)
    //             };
    //         };
    //     setup({
    //         gridOptions: {selectable: 'multi'},
    //         appendTo: 'body'
    //     }).then(function(g, options) {
    //         var selected;

    //         g.on('select', onSelect);

    //         selected = g.get('collection').where({text_field: 'item 3'});
    //         g.select(selected);
    //         ok(last.data[0] === selected);

    //         start();
    //     });

    // });

    asyncTest('selection triggers collection change event', function() {
        setup({
            gridOptions: {selectable: 'multi'},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            var triggered = [];

            g.get('collection').on('change', function(evt) {
                triggered.push({
                    evt: evt,
                    args: Array.prototype.slice.call(arguments, 0)
                });
            });

            equal(triggered.length, 0);
            g.select(g.get('collection').where({text_field: 'item 3'}));
            equal(triggered.length, 1);
            g.$el.find('td:contains(item 2)').trigger(
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            equal(triggered.length, 2);
            g.select(g.get('collection').where({text_field: 'item 7'}));
            equal(triggered.length, 3);
            start();
        });
    });

    asyncTest('unselection triggers collection change event', function() {
        setup({
            gridOptions: {selectable: 'multi'},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            var triggered = [];

            g.select(g.get('collection').where({text_field: 'item 3'}));
            g.$el.find('td:contains(item 2)').trigger(
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));

            equal(triggered.length, 0);

            g.get('collection').on('change', function(evt) {
                triggered.push({
                    evt: evt,
                    args: Array.prototype.slice.call(arguments, 0)
                });
            });

            g.unselect();
            equal(triggered.length, 1);

            start();
        });
    });

    asyncTest('clicking a selected row does not re-render', function() {
        setup({
            gridOptions: {selectable: true},
            appendTo: '#qunit-fixture'
        }).then(function(g, options) {
            equal(g._renderRowCount, 0);
            g.$el.find('td:contains(item 2)').trigger(
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            equal(g._renderRowCount, 1);
            g.$el.find('td:contains(item 2)').trigger(
                $.Event(g.get('selectableEvent'), {ctrlKey: true, metaKey: true}));
            equal(g._renderRowCount, 1);
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

    // get the width/height of the scroll bars
    var getScrollSizes = function() { // call after document is finished loading
        // var el = window.content.document.createElement('div');
        var el = document.createElement('div');
        // el.style.display = 'hidden';
        // el.style.overflow = 'scroll';
        $(el).css({
            display: 'hidden',
            overflow: 'scroll'
        });
        // window.content.document.body.appendChild(el);
        document.body.appendChild(el);
        var w = el.offsetWidth - el.clientWidth;
        var h = el.offsetHeight - el.clientHeight;
        // window.content.document.body.removeChild(el);
        document.body.removeChild(el);
        return {
            horizontal: w,
            vertical: h
        };
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
                var col = g.get('columnModel').columns[i],
                    rowSelector = 'tbody tr .' + col.columnClass(),
                    rowEl = g.$el.find(rowSelector)[0];
                equal(col.get('width'), newWidths[i],
                    'column object width for '+col.get('name')+' matches expected');
                equal($(el).outerWidth(), newWidths[i],
                    'element width for '+col.get('name')+' matches expected');
                //  - it's sufficiant to check the widths for the first row
                equal($(rowEl).outerWidth(), newWidths[i],
                    'element width for row cell '+col.get('name')+' matches expected');
            });

            newWidths[4] = 50;
            columns[4].set('width', newWidths[4]);
            g.$el.find('thead th').each(function(i, el) {
                var col = g.get('columnModel').columns[i],
                    rowSelector = 'tbody tr .' + col.columnClass(),
                    rowEl = g.$el.find(rowSelector)[0];
                equal(col.get('width'), newWidths[i],
                    'column object width for '+col.get('name')+' matches expected');
                equal($(el).outerWidth(), newWidths[i],
                    'element width for '+col.get('name')+' matches expected');
                equal($(rowEl).outerWidth(), newWidths[i],
                    'element width for row cell '+col.get('name')+' matches expected');
            });
            start();
        });
    });

    asyncTest('resize handle positioned correctly', function() {
        setup({
            gridOptions: {columnModelClass: resizable(BasicColumnModel)},
            appendTo: '#qunit-fixture'
        }).then(function(g) {
            var thPos = g.$el.find('th:first').offset(),
                thSize = {
                    width: g.$el.find('th:first').width(),
                    height: g.$el.find('th:first').height()
                },
                resizePos = g.$el.find('.resize:first').offset(),
                resizeSize = {
                    width: g.$el.find('.resize:first').width(),
                    height: g.$el.find('.resize:first').height()
                },
                close = function(a, b) {
                    return Math.abs(a-b) < 5;
                };

            equal(g.$el.closest('body').length, 1, 'ensure grid is positioned');
            equal(close(thPos.top, resizePos.top), true);
            equal(close(thPos.left+thSize.width, resizePos.left+resizeSize.width), true);

            start();
        });
    });

    asyncTest("columns with '.' in the classname resize properly", function() {
        var DotClassesColumnModel = ColumnModel.extend({
                columnClasses: [
                    Column.extend({defaults: {name: 'text_field'}}),
                    Column.extend({defaults: {name: 'required_field'}}),
                    Column.extend({defaults: {name: 'boolean_field'}}),
                    Column.extend({
                        defaults: {name: 'datetime.field'},
                        getValue: function(model) {
                            return model.get(this.get('name').replace(/\./g, '_'));
                        }
                    }),
                    Column.extend({
                        defaults: {name: 'integer.field'},
                        getValue: function(model) {
                            return model.get(this.get('name').replace(/\./g, '_'));
                        }
                    }),
                    Column.extend({defaults: {name: 'float_field'}}),
                    Column.extend({defaults: {name: 'default_field'}}),
                    Column.extend({defaults: {name: 'enumeration_field'}})
                ]
            });
        setup({
            gridOptions: {columnModelClass: resizable(DotClassesColumnModel)},
            appendTo: '#qunit-fixture'
        }).then(function(g) {
            var columns = g.get('columnModel').columns,
                dateTimeCol = _.find(columns, function(col) {
                    if (col.get('name') === 'datetime.field') {
                        return col;
                    }
                });

            dateTimeCol.set('width', 300);

            g.$el.find('thead th').each(function(i, el) {
                var col = g.get('columnModel').columns[i],
                    rowSelector = 'tbody tr .' + col.columnClass(),
                    rowEl = g.$el.find(rowSelector)[0];

                equal($(rowEl).outerWidth(), col.get('width'),
                    'row column width matches header column width for '+col.get('name'));
            });

            start();
        });
    });

    asyncTest('header and rows are the same size for grid that is initially hidden', function() {
        var models = [],
            $container = $('<div class=container></div>'),
            g = PowerGrid({
                columnModelClass: resizable(BasicColumnModel),
                collection: Example.collection()
            });

        $container.appendTo('#qunit-fixture').hide();
        g.appendTo($container);
        // set height and widths for visual resize testing
        g.$el.height(400);
        g.$el.width(800);
        // rerender so the height and width changes are pickued up
        g.rerender();
        g._setRowTableHeight();

        Example.models.clear();
        g.set('collection', Example.collection());
        g.get('collection').load().then(function(data) {
            var $header = g.$el.find('.header-wrapper'),
                $rows = g.$el.find('.row-wrapper'),
                $headerTable = $header.find('table.header'),
                $rowsTable = $rows.find('table.rows'),
                rowTableWidth, headerTableWidth;

            //  - with the currently logic it's only really a problem for IE9 which will still
            //  - fail however other browsers still will not fail properly either so no sense
            //  - running them for this test
            if ($.browser.webkit) {
                $container.show();
                /* equal width of a grid that is now visible */
                equal($header.width(), $rows.width(), 'header and row divs are the same width');
                //  - scrollbars can mess this test up so check for equallity which should be true
                //  - for webkit browsers. if it's not then add the scrollbar width which handles the
                //  - none webkit case. At that point a failure is a failure
                headerTableWidth = $headerTable.width();
                rowTableWidth = $rowsTable.width();
                if (headerTableWidth !== rowTableWidth) {
                    rowTableWidth += getScrollSizes().vertical;
                }
                equal(headerTableWidth, rowTableWidth, 'header and row tables are the same width');
            
                $headerTable.find('thead th').each(function(i, el) {
                    var col = g.get('columnModel').columns[i],
                        rowSelector = 'tbody tr .' + col.columnClass(),
                        rowEl = g.$el.find(rowSelector)[0],
                        numberOfColumns = g.get('columnModel').columns.length,
                        rowCellWidth, headerCellWidth;

                    //  - again we have to add width to the cell for non webkit browsers
                    rowCellWidth = $(rowEl).width();
                    headerCellWidth = $(el).width();
                    if (headerCellWidth !== rowCellWidth) {
                        rowCellWidth += Math.round(getScrollSizes().vertical / numberOfColumns);
                    }
                    equal(rowCellWidth, headerCellWidth,
                        'element width for row cell '+col.get('name')+' matches expected');
                });
            } else {
                ok(true, 'skipping this test for none webkit browsers');
            }
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

    test('reset to same IDs and make sure manager doesnt blow up', function() {
        var g = PowerGrid({columnModelClass: BasicColumnModel})
            .appendTo('#qunit-fixture');

        g.set('data', _.map(exampleFixtures, function(f) {
            return $.extend(true, {}, f);
        }));
        equal(g.get('models').length, exampleFixtures.length);
        g.set('data', _.map(exampleFixtures, function(f) {
            return $.extend(true, {}, f);
        }));
        equal(g.get('models').length, exampleFixtures.length);
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

    test('testing _makeQueryParams for pre-filtered collection', function() {
        var cutoff = 500,
            collection = Example.collection({query : {'required_field':'123'}}),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter and new filter both are present
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        ok(_.has(queryParams.query, 'integer_field__gt'));


        // Now clear filter and make sure previous filter remains but new filter gets removed
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        equal(_.has(queryParams.query, 'integer_field__gt'), false);
    });

    test('testing _makeQueryParams for clear search scenario', function() {
        var cutoff = 500,
            collection = Example.collection(),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter is part of the params
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'integer_field__gt'));

        // Now clear filter and make sure query element is null
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        ok (queryParams.query == null);
    });

    // we only want to run the 'checkbox column' module if we're in a browser
    // where triggering a 'click' event on a checkbox subsequently triggers a
    // 'change' event. since we're lazy and busy, we're just checking for
    // webkit
    if ($.browser.webkit) {
        module('checkbox column');

        var withCheckboxColumn = function(colModelClass) {
            return colModelClass.extend({
                columnClasses: [
                    CheckBoxColumn.extend({defaults: {prop: '_checked'}})
                ].concat(colModelClass.prototype.columnClasses)
            });
        };

        asyncTest('renders checkboxes', function() {
            setup({
                appendTo: 'body',
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

        asyncTest('changing model prop sets the corresponding checkbox', function() {
            // for this case we want to make sure the header is unchecked too
            setup({
                appendTo: '#qunit-fixture',
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                }
            }).then(function(g) {
                // first set everything to checked
                // gecko and trident don't seem to register the click, so change
                // events never fire and this test fails in those browsers
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length,
                        g.get('models').length+1);
                    _.each(g.get('models'),
                        function(m) { ok(m.get('_checked')); });
                    g.get('models')[0].set('_checked', false);
                    setTimeout(function() {
                        equal(g.get('models')[0].get('_checked'), false);
                        equal(g.$el.find('thead [type=checkbox]:checked').length, 0,
                                'header is unchecked when models change');
                        start();
                    }, 15);
                }, 50);
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
                // gecko and trident don't seem to register the click, so change
                // events never fire and this test fails in those browsers
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length,
                        g.get('models').length+1);
                    _.each(g.get('models'),
                        function(m) { ok(m.get('_checked')); });
                    start();
                }, 50);
            });
        });

        asyncTest('changing checkbox column type', function() {
            setup({
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                },
                appendTo: '#qunit-fixture'
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]').length, 16);
                g.get('columnModel').columns[0].set('type', 'radio');
                equal(g.$el.find('[type=checkbox]').length, 0);
                equal(g.$el.find('[type=radio]').length, g.get('models').length);
                start();
            });
        });

        asyncTest('selecting all checkboxes does not change disabled ones', function() {
            setup({
                appendTo: '#qunit-fixture',
                gridOptions: {
                    columnModelClass: BasicColumnModel.extend({
                        columnClasses: [
                            CheckBoxColumn.extend({
                                defaults: {prop: '_checked'},
                                _isDisabled: function(model) {
                                    return model.get('default_field') < 100;
                                }
                            })
                        ].concat(BasicColumnModel.prototype.columnClasses)
                    })
                }
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]:checked').length, 0);
                _.each(g.get('models'), function(m) { ok(!m.get('_checked')); });
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length, 13);
                    _.each(g.get('models'), function(m) {
                        if (m.get('default_field') < 100) {
                            ok(!m.get('_checked'));
                        } else {
                            ok(m.get('_checked'));
                        }
                    });
                    start();
                }, 15);
            });
        });
    }

    module('date column');

    var withDateTimeColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'datetime_field'?
                        asDateTime(c.extend()) : c;
                })
        });
    };

    asyncTest('renders dates correctly', function() {
        setup({
            gridOptions: {
                columnModelClass: withDateTimeColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("' +
                    moment('2012-08-29T14:10:21Z').format('YYYY-MM-DD h:mm A') +
                    '")').length, 15);
            start();
        });
    });

    module('bytes column');

    var withBytesColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'float_field'?
                        asBytes(c.extend()) : c;
                })
        });
    };

    asyncTest('renders bytes correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withBytesColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("532.26 MB")').length, 1);
            start();
        });
    });

    asyncTest('renders null bytes correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withBytesColumn(BasicColumnModel),
                collectionMap: function(models) {
                    models[0].set('float_field', null);
                    return models;
                }
            }
        }).then(function(g) {
            equal(trim(g.$el.find('tr:eq(1) td:eq(5)').text()), '');
            start();
        });
    });

    module('number column');

    var withNumberColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'default_field'?
                        asNumber(c.extend()) : c;
                })
        });
    };

    asyncTest('renders numbers correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumn(BasicColumnModel)
            }
        }).then(function(g) {
            var $el = g.$el.find('td:contains("2,007,104")');
            equal($el.length, 1);
            equal(trim($el.text()), "2,007,104");
            start();
        });
    });

    asyncTest('renders null values correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumn(BasicColumnModel),
                collectionMap: function(models) {
                    models[0].set('default_field', null);
                    return models;
                }
            }
        }).then(function(g) {
            equal(trim(g.$el.find('tr:eq(1) td:eq(6)').text()), '');
            start();
        });
    });

    var withNumberColumnAndTwoDecimalPlaces = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'default_field'?
                        asNumber(c.extend(), {decimalPlaces: 2}) : c;
                })
        });
    };

    asyncTest('renders two decimal palces correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumnAndTwoDecimalPlaces(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("2,007,104.00")').length, 1);
            start();
        });
    });

    module('enumeration column');

    var mapping = { 1:'One', 2: 'Two', 3:'Three'}, 
        withEnumerationColumn = function(colModelClass) {
            return colModelClass.extend({
                columnClasses: _.map(colModelClass.prototype.columnClasses,
                    function(c) {
                        return c.prototype.defaults.name === 'enumeration_field'?
                                asEnumeration(c.extend(), {mapping: mapping}) : c;
                    })
            });
        };

    asyncTest('renders enumeration column correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withEnumerationColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("One")').length, 5);
            equal(g.$el.find('td:contains("Two")').length, 5);
            equal(g.$el.find('td:contains("Three")').length, 5);
            start();
        });
    });

    module('infinite scroll');

    asyncTest('scroll to bottom loads more data', function() {
        setup({
            // appendTo: 'body',
            params: {limit: 25},
            gridOptions: {
                infiniteScroll: true,
                increment: 300
            }
        }).then(function(g, options) {
            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();
            g._setRowTableHeight();

            var limit = options.params.limit,
                modelCount = g.get('models').length,
                $rowWrapper = g.$el.find('.row-wrapper'),
                $rows = g.$el.find('.rows');

            equal(modelCount, limit, 'number of models is the same as the inital limit');

            $rowWrapper.scrollTop($rows.height());
            setTimeout(function() {
                var newModelCount = g.get('models').length,
                    newLimit = limit + g.get('increment');

                equal(newModelCount, newLimit, 'new number of models has increased to the expectd value');
                start();
            }, 500);
        });
    });

    module('spinner');

    asyncTest('spinner shows up', function() {
        setup({
            appendTo: 'body',
            gridOptions: {
                selectable: 'multi',
                columnModelClass: resizable(BasicColumnModel)
            }
        }).then(function(g) {
            // disable/enable before inserting in the dom, just to make sure
            g.disable().enable().disable().enable();
            g.appendTo('body').disable();
            equal(g.spinner.spinner.el.nodeType === 1, true,
                'spinner instantiated');
            equal($(g.spinner.spinner.el).css('display'), 'block',
                'spinner visible');
            var $table = g.$el.find('.rows');
            equal($(g.spinner.spinner.el).parent().position().left > $table.position().left,
                true, 'spinner is roughly horizontally inside table');
            equal($(g.spinner.spinner.el).parent().position().top > $table.position().top,
                true, 'spinner is roughly vertically inside table');
            start();
        });
    });

    module('title tooltips');

    var linkedTextField = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(
                colModelClass.prototype.columnClasses,
                function(columnClass, i) {
                    return i !== 0? columnClass :
                        columnClass.extend({
                            formatValue: function(value, model) {
                                return '<a href="javascript:void(0)>'+value+'</a>';
                            },
                            getTitle: function(formatted, value, model) {
                                return value;
                            }
                        });
                })
        });
    };

    asyncTest('html in formatValue doesnt show up in title attribute', function() {
        setup({
            gridOptions: {columnModelClass: linkedTextField(BasicColumnModel)}
        }).then(function(g) {
            equal(g.$tbody.find('tr:first td:first').attr('title'), 'item 0');
            start();
        });

    });

    module('all the marbles');

    var MarblesColumn = Column.extend({
        defaults: {sortable: true, resizable: true},
        init: function() {
            this._super.apply(this, arguments);
            this.set('label', this.get('name')
                .replace(/_/g, ' ')
                .replace(/^(.)/, function($1) {
                    return $1.toUpperCase();
                }));
        }
    });

    asyncTest('everything together', function() {
        setup({
            appendTo: 'body',
            params: {limit: 300},
            gridOptions: {
                selectable: 'multi',
                columnModelClass: ColumnModel.extend({
                    columnClasses: [
                        CheckBoxColumn.extend({
                            _isDisabled: function(model) {
                                return !model.get('required_field');
                            }
                        }),
                        MarblesColumn.extend({defaults: {name: 'text_field', sort: 'ascending'}}),
                        MarblesColumn.extend({defaults: {name: 'required_field'}}),
                        MarblesColumn.extend({defaults: {name: 'boolean_field'}}),
                        asDateTime(MarblesColumn.extend({defaults: {name: 'datetime_field'}})),
                        MarblesColumn.extend({defaults: {name: 'integer_field'}}),
                        asBytes(MarblesColumn.extend({defaults: {name: 'float_field'}})),
                        asNumber(MarblesColumn.extend({defaults: {name: 'default_field'}})),
                        MarblesColumn.extend({defaults: {name: 'enumeration_field'}})
                    ]
                })
            }
        }).then(function(g) {
            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();
            g._setRowTableHeight();
            g.on('dblclick', 'tbody tr', function(evt) {
                var model = g._modelFromTr(evt.currentTarget);
                if (model) {
                    console.log('double click',model.get('text_field'));
                } else {
                    console.log('double click -- no model');
                }
            });
            ok(true);
            start();
        });
    });

    start();
});

