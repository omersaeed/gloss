/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
require([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!vendor:t',
    'path!gloss:widgets/widget',
    'path!gloss:widgets/button',
    'path!gloss:widgets/grid/editable',
    'path!gloss:widgets/treegrid',
    'path!gloss:widgets/treegrid/treegridrow',
    'path!gloss:widgets/treegrid/dragndroppable',
    'path!mesh:model',
    'path!gloss:data/tree',
    'path!gloss:data/mock',
    'path!gloss:test/api/v1/recordseries',
    'path!gloss:text!test/api/v1/test/fixtures/recordseries_tree.json'
], function($, _, t, Widget, Button, Editable, TreeGrid, TreeGridRow,
    DragNDroppable, model, Tree, Mock, RecordSeries, recordseries_tree) {

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
                collectionArgs: {
                    query: {file_plan_id: 1, recursive: false, tree: true},
                    tree: true
                },
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
                            treegrid.getExpanded(row.options.node)? expandText : collapseText;
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
        find = window.fnd = function(treegrid, id) {
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

    Mock(RecordSeries, recordseries_tree, {
        collectionArgs: {
            query: {recursive: true, tree: true},
            tree: true
        }
    });

    module('treegrid', {setup: setup});

    asyncTest('render tree', function() {
        var tree, treegrid, manager, rowClass, expandColIndex, collapseText, childText,
            expectedLength = 0,
            names = [];


        manager = model.Manager(RecordSeries);
        tree = Tree({
            resource: RecordSeries,
            collectionArgs: {
                query: {file_plan_id: 1, recursive: true, tree: true},
                tree: true
            },
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
        // treegrid.appendTo($('body'));
        treegrid.appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            treegrid.options.rows[0].$node.find('.expand').trigger('click');
            setTimeout(function() {
                treegrid.options.rows[8].$node.find('.expand').trigger('click');
                setTimeout(function() {
                    treegrid.options.rows[9].$node.find('.expand').trigger('click');
                    setTimeout(function() {
                        ok(treegrid.getExpanded(treegrid.options.rows[0].options.node));
                        // equal(treegrid.options.rows[0].options.node.expanded, true);
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
            collectionArgs: {
                query: {file_plan_id: 1, recursive: true, tree: true},
                tree: true
            },
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
            ok(treegrid.getExpanded(node));
            // equal(node.expanded, true);
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
                collectionArgs: {
                    query: {file_plan_id: 1, recursive: false, tree: true},
                    tree: true
                },
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
                    callback: 'startDrag'
                }
            ],
            draggable: {autoBind: false, autoScroll: true}
        },
        onDragStart: function() {
        },
        renderColGrab: function() {
            return '<button type=button class="button grab">m</button>';
        }
    }, {mixins: [DragNDroppable]});

    module('drag n drop treegrid', {
        setup: function() {
            this.manager = model.Manager(RecordSeries);
            this.tree = Tree({
                resource: RecordSeries,
                collectionArgs: {
                    query: {file_plan_id: 1, recursive: false, tree: true},
                    tree: true
                },
                manager: this.manager
            });
            this.treegrid = TreeGrid(undefined, {
                rowWidgetClass: DraggableRowClass,
                tree: this.tree
            });
        }
    });

    // asyncTest('drag to node', function() {
    //     var tree = this.tree, treegrid = this.treegrid;
    //     // treegrid.appendTo($('body'));
    //     treegrid.appendTo($('#qunit-fixture'));

    //     treegrid.load().done(function() {
    //         start();
    //     });
    // });

    var grabButton = function(row) {
        return row.$node.find('button.grab');
    };
    var grabButtonCenter = function(row) {
        var btn = grabButton(row),
            pos = btn.position(),
            width = btn.outerWidth(),
            height = btn.outerHeight();
        return {
            clientX: pos.left + (width / 2),
            clientY: pos.top + (height / 2)
        };
    };
    var plus = function(a, b) {
        return {
            clientX: (a.clientX || 0) + (b.clientX || 0),
            clientY: (a.clientY || 0) + (b.clientY || 0)
        };
    };
    var whereOnRow = function(row, where) {
        var pos = row.$node.position(), newPos = {
            clientX: pos.left,
            clientY: pos.top
        };
        where = where || 'in';
        newPos.clientX = pos.left + row.$node.outerWidth() / 2;
        if (where === 'before') {
            newPos.clientY += 3;
        } else if (where === 'after') {
            newPos.clientY += row.$node.innerHeight() - 3;
        } else {
            newPos.clientY += row.$node.innerHeight() / 2;
        }
        return newPos;
    };
    var dndArtifactsHaveBeenCleanedUp = function(treegrid) {
        ok($('body').hasClass('dragging-element') === false);
        equal(treegrid.$node.find('.dragging').length, 0,
                'treegrid doesnt have "dragging" class');
        _.each(treegrid.$node.data('events') || {}, function(events, evtClass) {
            ok(evtClass !== 'mousemove', 'treegrid doesnt have mousemove event');
            ok(evtClass !== 'mouseup', 'treegrid doesnt have mouseup event');
        });
        treegrid.$node.find('tbody tr').each(function(i, el) {
            ok($(el).data('events') == null,
                'treegrid row doesnt have drag-and-drop events');
            if ($(el).data('events') != null) {
                throw Error('in there');
            }
        });
        _.each(treegrid.options.rows, function(row) {
            ok(row._drag == null, 'treegrid row doesnt have _drag state');
        });
    };
    var startDrag = window.startDrag = function(row) {
        var newPos, pos = grabButtonCenter(row), dfd = $.Deferred();
        grabButton(row).trigger($.Event('mousedown', pos));
        newPos = plus(pos, {clientX: 1, clientY: 1});
        row.$node.trigger($.Event('mousemove', newPos));
        setTimeout(function() { dfd.resolve(); }, 100);
        return dfd;
    };

    // becuase the code may be throttling (only handling 1 out of say 3
    // events), we need to trigger several mousemove events to make sure the
    // code has registered what's happening
    var dragTo = window.dragTo = function(row, where) {
        var dfd = $.Deferred(), at = whereOnRow(row, where);
        row.$node.trigger($.Event('mousemove', at));
        row.$node.trigger($.Event('mousemove', at));
        setTimeout(function() {
            row.$node.trigger($.Event('mousemove', at));
            row.$node.trigger($.Event('mousemove', at));
            dfd.resolve();
        }, 100);
        return dfd;
    };
    var drop = window.drop = function(row, where) {
        var dfd = $.Deferred();
        row.$node.trigger($.Event('mouseup', whereOnRow(row, where)));
        setTimeout(function() { dfd.resolve(); }, 100);
        return dfd;
    };

    asyncTest('drag to node', function() {
        var tree = this.tree, treegrid = this.treegrid;
        treegrid.appendTo($('body'));
        // treegrid.appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            var gamma, gammaNode, epsilon, epsilonNode,
                alpha = find(treegrid, 'alpha something'),
                alphaNode = alpha.options.node,
                beta = find(treegrid, 'beta fooasdfasdf'),
                betaNode = beta.options.node,
                alphaSomethingCount = 0;
            startDrag(alpha).done(function() {
                dragTo(beta).done(function() {
                    drop(beta).done(function() {
                        ok(_.last(betaNode.children) === alphaNode,
                            'alpha is now a child of beta');
                        t.dfs(tree.root.children, function() {
                            if (this.model.name === 'alpha something') {
                                alphaSomethingCount++;
                            }
                        });
                        equal(alphaSomethingCount, 1);
                        treeGridMatchesData(treegrid, tree);

                        alpha = find(treegrid, 'alpha something');
                        alphaNode = alpha.options.node;
                        gamma = find(treegrid, 'gamma');
                        gammaNode = gamma.options.node;
                        alphaSomethingCount = 0;

                        startDrag(alpha).done(function() {
                                dragTo(gamma, 'after').done(function() {
                                    drop(gamma, 'after').done(function() {

                                    ok(_.last(betaNode.children) !== alphaNode,
                                        'alpha is no longer a child of beta');
                                    ok(_.last(gammaNode.children || []) !== alphaNode,
                                        'alpha is not a child of gamma');
                                    ok(tree.root.children[1] === gammaNode);
                                    ok(tree.root.children[2] === alphaNode);
                                    t.dfs(tree.root.children, function() {
                                        if (this.model.name === 'alpha something') {
                                            alphaSomethingCount++;
                                        }
                                    });
                                    equal(alphaSomethingCount, 1);
                                    treeGridMatchesData(treegrid, tree);

                                    epsilon = find(treegrid, 'epsilon');
                                    epsilon.toggle().done(function() {
                                        epsilon.toggle().done(function() {
                                            alpha = find(treegrid, 'alpha something');
                                            alphaNode = alpha.options.node;
                                            epsilon = find(treegrid, 'epsilon');
                                            epsilonNode = epsilon.options.node;
                                            alphaSomethingCount = 0;

                                            startDrag(alpha).done(function() {
                                                dragTo(epsilon, 'after').done(function() {
                                                    drop(epsilon, 'after').done(function() {

                                                        ok(_.last(epsilonNode.children) !== alphaNode,
                                                            'alpha is not a child of epsilon');
                                                        ok(tree.root.children[3] === epsilonNode);
                                                        ok(tree.root.children[4] === alphaNode);
                                                        t.dfs(tree.root.children, function() {
                                                            if (this.model.name === 'alpha something') {
                                                                alphaSomethingCount++;
                                                            }
                                                        });
                                                        equal(alphaSomethingCount, 1);
                                                        treeGridMatchesData(treegrid, tree);

                                                        alpha = find(treegrid, 'alpha something');
                                                        alphaNode = alpha.options.node;
                                                        epsilon = find(treegrid, 'epsilon');
                                                        epsilonNode = epsilon.options.node;
                                                        alphaSomethingCount = 0;

                                                        startDrag(alpha).done(function() {
                                                            dragTo(epsilon, 'in').done(function() {
                                                                drop(epsilon, 'in').done(function() {

                                                                    ok(_.last(epsilonNode.children) === alphaNode,
                                                                        'alpha is now a child of epsilon');
                                                                    ok(tree.root.children[3] === epsilonNode);
                                                                    equal(_.indexOf(tree.root.children, alphaNode), -1);
                                                                    ok(alphaNode.par, epsilonNode);
                                                                    t.dfs(tree.root.children, function() {
                                                                        if (this.model.name === 'alpha something') {
                                                                            alphaSomethingCount++;
                                                                        }
                                                                    });
                                                                    equal(alphaSomethingCount, 1);
                                                                    dndArtifactsHaveBeenCleanedUp(treegrid);
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
                        });
                    });
                });
            });
        });
    });

    asyncTest('start drag, stop w/o moving, and then drag into node', function() {
        var tree = this.tree, treegrid = this.treegrid;
        // treegrid.appendTo($('body'));
        treegrid.appendTo($('#qunit-fixture'));

        treegrid.load().done(function() {
            var gamma, gammaNode, epsilon, epsilonNode,
                alpha = find(treegrid, 'alpha something'),
                alphaNode = alpha.options.node,
                beta = find(treegrid, 'beta fooasdfasdf'),
                betaNode = beta.options.node,
                alphaSomethingCount = 0;
            startDrag(alpha).done(function() {
                dragTo(alpha).done(function() {
                    drop(alpha).done(function() {

                        dndArtifactsHaveBeenCleanedUp(treegrid);

                        alpha = find(treegrid, 'alpha something');
                        alphaNode = alpha.options.node;
                        beta = find(treegrid, 'beta fooasdfasdf');
                        betaNode = beta.options.node;
                        alphaSomethingCount = 0;

                        startDrag(alpha).done(function() {
                            dragTo(beta).done(function() {
                                drop(beta).done(function() {
                                    start();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    var MarblesRow = RowClass.extend({
        defaults: {
            colModel: [
                {name: 'grab', label: ' ', render: 'renderColGrab', modelIndependent: true, width: 32, editable: false},
                {name: 'name', label: 'Name', expandCol: true, editable: true},
                {name: 'path_linked', label: ' ', render: 'renderColPathLinked', modelIndependent: true, width: 40, editable: false},
                {name: 'target_volume_id', label: 'Target Output Volume', editable: true},
                {name: 'target_volume_profile_id', label: 'Target Output Volume Profile', editable: true},
                {name: 'set_children', render: 'renderColSetChildren', modelIndependent: true, editable: false}
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
                    callback: 'startDrag'
                },
                {
                    on: 'click',
                    selector: ':not(".expand"):not(".set-children"):not("button.grab")',
                    callback: 'onClickRow'
                }
            ],
            draggable: {autoBind: false, autoScroll: true}
        },
        edit: function() {
            var self = this;
            Editable.edit.apply(this, arguments);
            Widget.onPageClick(this.$node, function() {
                self.stopEdit();
            });
        },
        onClickRow: function(evt) {
            if ($(evt.target).is(this.options.grid.$node.data('events').click[1].selector)) {
                this.edit();
            }
        },
        onClickSetChildren: function(evt) {
            console.log('clicked "Set Children" for row:',this);
        },
        renderColGrab: function() {
            return '<button type=button class="button grab">m</button>';
        },
        renderColPathLinked: function(col) {
            return this.options.model.path_linked? 'yes' : 'no';
        },
        renderColSetChildren: function(col) {
            return '<button type=button class="button set-children">Set children</button>';
        }
    }, {mixins: [DragNDroppable, Editable]});

    module('all the marbles', {});

    asyncTest('all the marbles', function() {
        var tree, treegrid;
        RecordSeries.models.clear();
        this.manager = model.Manager(RecordSeries);
        this.tree = Tree({
            resource: RecordSeries,
            collectionArgs: {
                query: {file_plan_id: 1, recursive: false, tree: true},
                tree: true
            },
            manager: this.manager
        });
        this.treegrid = TreeGrid(undefined, {
            rowWidgetClass: MarblesRow,
            tree: this.tree
        });
        tree = this.tree;
        treegrid = this.treegrid;
        // treegrid.appendTo($('body'));
        treegrid.appendTo($('#qunit-fixture'));

        // window.treegrid = treegrid;
        treegrid.load().done(function() {
            console.log('done loading');
            ok(true);
            start();
        });
    });

    start();
});
