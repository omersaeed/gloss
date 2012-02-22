/*global test, asyncTest, ok, equal, deepEqual, start, module */
require([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'vendor/gloss/widgets/button',
    'vendor/gloss/widgets/grid/editable',
    'vendor/gloss/widgets/treegrid',
    'vendor/gloss/widgets/treegrid2/treegridrow',
    'vendor/gloss/widgets/treegrid2/dragndroptreegridrow',
    'vendor/gloss/data/model',
    'vendor/gloss/data/tree',
    'vendor/gloss/data/mock',
    'api/v1/recordseries',
    'text!api/v1/test/fixtures/recordseries_tree.json'
], function($, _, t, Button, Editable, TreeGrid, TreeGridRow,
    DragNDropTreeGridRow, model, Tree, Mock, RecordSeries, recordseries_tree) {

    var RowClass,
        showGrid = function() {
            $('#qunit-fixture').css({position: 'static'});
        },
        hideGrid = function() {
            $('#qunit-fixture').css({position: 'absolute'});
        },
        recordseries = _.map(JSON.parse(recordseries_tree), function(item) {
            return item[1];
        }),
        setup = function() {
            this.manager = model.Manager(RecordSeries);
            this.tree = Tree({
                resource: RecordSeries,
                query: { file_plan_id: 1 },
                manager: this.manager
            });
            this.treegrid = TreeGrid(undefined, {
                rowWidgetClass: RowClass,
                tree: this.tree
            });
            // }).appendTo($('#qunit-fixture'));
        },
        dummyNode = $('<span></span>'),
        treeGridMatchesData = function(treegrid, tree) {
            var names = [],
                rowClass = treegrid.options.rowWidgetClass.prototype.defaults,
                expandColIndex = rowClass.expandColIndex,
                expandText = dummyNode.html(rowClass.expandText).text(),
                collapseText = dummyNode.html(rowClass.collapseText).text(),
                childText = dummyNode.html(rowClass.childText).text();
            t.dfs(tree.root.children, function() {
                names.push(this.model.name);
            });
            treegrid.$tbody.find('tr').each(function(i, el) {
                var $expandCol = $(el).find('td').eq(expandColIndex),
                    row = treegrid.options.rows[i],
                    text = !row.options.model.isparent? childText :
                            row.options.node.expanded? expandText : collapseText;
                equal(
                    $expandCol.find('span.content').text(),
                    names[i]
                );
                equal($expandCol.find('.expand').text(), text);
                equal($expandCol.find('.indent').text().length / 4, row.options.node.level);
            });
        },
        findNode = function(tree, id) {
            return t.find(tree.root, function() {
                return this.model[_.isString(id)? 'name' : 'id'] === id;
            });
        },
        find = function(treegrid, id) {
            var node;
            if (treegrid.root) {
                return findNode(treegrid, id);
            }
            node = findNode(treegrid.options.tree, id);
            return _.find(treegrid.options.rows, function(row) {
                return row.options.node === node;
            });
        },
        rowsFor = function(treegrid, nodes) {
            var allNodes = [], index;
            if (!_.isArray(nodes)) {
                nodes = [nodes];
            }
            t.dfs(nodes, function() { allNodes.push(this); });
            _.each(treegrid.options.rows, function(row, i) {
                if (index != null) {
                    return;
                }
                if (row.options.node === allNodes[0]) {
                    index = i;
                }
            });
            _.each(nodes, function(node, i) {
                if (node !== treegrid.options.rows[index + i].options.node) {
                    throw Error('treegrid inconsistent with tree');
                }
            });
            return treegrid.options.rows.slice(index, index+allNodes.length);
        };

    RowClass = TreeGridRow.extend({
        defaults: {
            colModel: [
                {name: 'name', label: 'Name', expandCol: true},
                {name: 'tasks_option', label: 'Tasks Option'},
                {name: 'volume_id', label: 'Volume ID'},
                {name: 'security_attributes', label: 'Security Attributes'},
                {name: 'set_children', render: 'renderColSetChildren', modelIndependent: true}
            ],
            events: [
                {
                    on: 'click',
                    selector: 'button.set-children',
                    callback: 'onClickSetChildren'
                }
            ]
        },
        onClickSetChildren: function(evt) {
            console.log('set children clicked:',this,evt);
        },
        renderColSetChildren: function(col) {
            return '<button type=button class="button set-children">Set children</button>';
        }
    });

    Mock(RecordSeries, recordseries_tree);

    module('treegrid', {setup: setup});

    asyncTest('render tree', function() {
        var tree, treegrid, manager, rowClass, expandColIndex, collapseText, childText,
            expectedLength = 0,
            names = [];


        manager = model.Manager(RecordSeries);
        tree = Tree({
            resource: RecordSeries,
            query: { file_plan_id: 1, recursive: true },
            manager: manager
        });
        treegrid = TreeGrid(undefined, {
            rowWidgetClass: RowClass,
            tree: tree
        }).appendTo($('#qunit-fixture'));

        rowClass = treegrid.options.rowWidgetClass.prototype.defaults;
        expandColIndex = rowClass.expandColIndex;
        collapseText = dummyNode.html(rowClass.collapseText).text();
        childText = dummyNode.html(rowClass.childText).text();

        equal(treegrid.$node.find('tbody tr').length, 0);

        treegrid.load().done(function() {
            t.dfs(tree.root.children || [], function() {
                names.push(this.model.name);
            });
            expectedLength = names.length;
            equal(treegrid.$node.find('tbody tr').length, expectedLength);
            equal(treegrid.$node.find('tbody tr button.set-children').length, expectedLength);
            if (!_.isEqual(
                _.map(treegrid.$node.find('td.col-name span:last-child'), function(el) {return $(el).text();}),
                names)) {
                throw Error('foo');
            }
            ok(_.isEqual(
                _.map(treegrid.$node.find('td.col-name span:last-child'), function(el) {return $(el).text();}),
                names));
            equal(treegrid.$node.find('tbody tr .expand').length, expectedLength);

            treegrid.$tbody.find('tr').each(function(i, el) {
                var rows = treegrid.options.rows;
                if (rows[i].options.model.isparent) {
                    equal($(el).find('.expand').text(), collapseText);
                } else {
                    equal($(el).find('.expand').text(), childText);
                }
            });
            equal(treegrid.$tbody.find('tr:visible').length, tree.root.children.length);
            treegrid.expandAll();
            equal(treegrid.$tbody.find('tr:visible').length, expectedLength);

            start();
        });
    });

    asyncTest('load incrementally', function() {
        var tree = this.tree, treegrid = this.treegrid, manager = this.manager;
        treegrid.appendTo($('#qunit-fixture'));

        equal(treegrid.$tbody.find('tr').length, 0);
        treeGridMatchesData(treegrid, tree);
        treegrid.load().done(function() {
            equal(treegrid.$tbody.find('tr').length, 6);
            treeGridMatchesData(treegrid, tree);
            treegrid.options.rows[0].options.node.load().done(function() {
                equal(treegrid.$tbody.find('tr').length, 11);
                treeGridMatchesData(treegrid, tree);
                start();
            });
        });
    });

    asyncTest('expand and collapse nodes', function() {
        var tree = this.tree, treegrid = this.treegrid, manager = this.manager;
        treegrid.appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            treegrid.options.rows[0].expand().done(function() {
                treegrid.options.rows[1].expand().done(function() {
                    treegrid.options.rows[2].expand().done(function() {
                        treegrid.options.rows[3].expand().done(function() {
                            treegrid.options.rows[7].expand().done(function() {
                                var rowCount = treegrid.$tbody.find('tr').length,
                                    visibleRowCount = treegrid.$tbody.find('tr:visible').length;
                                equal(rowCount, visibleRowCount);
                                if (rowCount !== visibleRowCount) {
                                    throw Error('race condition');
                                }
                                treeGridMatchesData(treegrid, tree);
                                treegrid.options.rows[3].toggle().done(function() {
                                    var visibleRowCount = treegrid.$tbody.find('tr:visible').length,
                                        childCount = treegrid.options.rows[3].options.node.children.length;
                                    equal(rowCount, visibleRowCount + childCount);
                                    treeGridMatchesData(treegrid, tree);
                                    treegrid.options.rows[2].collapse().done(function() {
                                        treegrid.options.rows[2].expand().done(function() {
                                            var rowCount = treegrid.$tbody.find('tr').length;
                                            equal(rowCount, visibleRowCount + childCount);
                                            treeGridMatchesData(treegrid, tree);
                                            start();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    asyncTest('expand and collapse nodes with click', function() {
        var tree = this.tree, treegrid = this.treegrid, manager = this.manager;
        treegrid.appendTo($('body'));

        treegrid.load().done(function() {
            treegrid.options.rows[0].$node.find('.expand').trigger('click');
            setTimeout(function() {
                treegrid.options.rows[8].$node.find('.expand').trigger('click');
                setTimeout(function() {
                    treegrid.options.rows[9].$node.find('.expand').trigger('click');
                    setTimeout(function() {
                        equal(treegrid.options.rows[0].options.node.expanded, true);
                        treeGridMatchesData(treegrid, tree);
                        start();
                    }, 15);
                }, 15);
            }, 15);
        });
    });

    module('moving rows', {setup: setup});

    asyncTest('move a node', function() {
        var tree, treegrid, manager;

        manager = model.Manager(RecordSeries);
        tree = Tree({
            resource: RecordSeries,
            query: { file_plan_id: 1, recursive: true},
            manager: manager
        });
        treegrid = TreeGrid(undefined, {
            rowWidgetClass: RowClass,
            tree: tree
        // }).appendTo($('body'));
        }).appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            var $row, row, node;
            treegrid.expandAll();
            find(treegrid, 'second from under alpha').moveTo(find(treegrid, 'blah blah'));
            treeGridMatchesData(treegrid, tree);
            $row = $('tr:contains("blah blah")');
            row = treegrid.options.rows[$row.index()];
            node = row.options.node;
            equal(node.expanded, true);
            start();
        });
    });

    asyncTest('move a node to un-expanded parent', function() {
        var tree = this.tree, treegrid = this.treegrid;
        // treegrid.appendTo($('body'));
        treegrid.appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            setTimeout(function() {
                treegrid.options.rows[0].expand().done(function() {
                    var rows, $rows, nodes = [], 
                        movee = treegrid.options.rows[0],
                        node = movee.options.node;
                    movee.moveTo(_.last(treegrid.options.rows));
                    rows = rowsFor(treegrid, node);
                    $rows = $(null).add(_.pluck(rows, 'node'));
                    t.dfs(node, function() { nodes.push(this); });
                    equal($rows.filter(':visible').length, nodes.length);
                    start();
                });
            }, 0);
        });
    });

    module('editing rows', {
        setup: function() {
            var EditableRowClass,
                editableColModel = _.clone(RowClass.prototype.defaults.colModel);
            _.each([0, 1, 2, 3], function(i) {
                editableColModel[i].editable = true;
            });
            EditableRowClass = RowClass.extend({
                defaults: {
                    colModel: editableColModel,
                    modelClass: RecordSeries
                }
            }, {mixins: [Editable]});
            this.manager = model.Manager(RecordSeries);
            this.tree = Tree({
                resource: RecordSeries,
                query: { file_plan_id: 1 },
                manager: this.manager
            });
            this.treegrid = TreeGrid(undefined, {
                rowWidgetClass: EditableRowClass,
                tree: this.tree
            });
        }
    });

    asyncTest('edit a row', function() {
        var tree = this.tree, treegrid = this.treegrid;
        treegrid.appendTo($('#qunit-fixture'));
        // treegrid.appendTo($('body'));

        treegrid.load().done(function() {
            setTimeout(function() {
                treegrid.options.rows[0].edit();
                treegrid.options.rows[0].form.$node.find('[name=name]').val('foo');
                treegrid.options.rows[0].form.trigger('submit');
                setTimeout(function() {
                    equal(treegrid.options.rows[0].options.model.name, 'foo');
                    start();
                }, 15);
            }, 15);
        });
    });

    var DraggableRowClass = RowClass.extend({
        defaults: {
            colModel: [
                {name: 'grab', label: ' ', render: 'renderColGrab', modelIndependent: true, width: 32},
                {name: 'name', label: 'Name', expandCol: true},
                {name: 'tasks_option', label: 'Tasks Option'},
                {name: 'volume_id', label: 'Volume ID'},
                {name: 'security_attributes', label: 'Security Attributes'},
                {name: 'set_children', render: 'renderColSetChildren', modelIndependent: true}
            ],
            events: [
                {
                    on: 'click',
                    selector: 'button.set-children',
                    callback: 'onClickSetChildren'
                },
                {
                    on: 'mousedown',
                    selector: 'button.grab',
                    callback: 'draggableOnMouseDown'
                },
                {
                    on: 'dragstart',
                    callback: 'onDragStart'
                }
            ],
            draggable: {autoBind: false}
        },
        onDragStart: function() {
        },
        renderColGrab: function() {
            return '<button type=button class="button grab">m</button>';
        }
    }, {mixins: [DragNDropTreeGridRow]});

    module('drag n drop treegrid', {
        setup: function() {
            this.manager = model.Manager(RecordSeries);
            this.tree = Tree({
                resource: RecordSeries,
                query: { file_plan_id: 1 },
                manager: this.manager
            });
            this.treegrid = TreeGrid(undefined, {
                rowWidgetClass: DraggableRowClass,
                tree: this.tree
            });
        }
    });

    asyncTest('edit a row', function() {
        var tree = this.tree, treegrid = this.treegrid;
        // treegrid.appendTo($('#qunit-fixture'));
        treegrid.appendTo($('body'));
        window.tg = treegrid;

        treegrid.load().done(function() {
            console.log('ready');
            start();
        });
    });

});
