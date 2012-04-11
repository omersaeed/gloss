/*global test, asyncTest, ok, equal, deepEqual, start, module */
require([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!vendor:t',
    'path!gloss:test/api/v1/recordseries',
    'path!gloss:data/tree',
    'path!gloss:data/mock',
    'path!gloss:data/model',
    'path!gloss:text!test/api/v1/test/fixtures/recordseries_tree.json'
], function($, _, t, RecordSeries, Tree, Mock, model, recordseries_tree) {

    var recordseries = _.map(JSON.parse(recordseries_tree), function(item) {
            return item[1];
        }),
        setup = function() {
            RecordSeries.models.clear();
            this.tree = Tree({
                resource: RecordSeries,
                collectionArgs: {
                    query: {file_plan_id: 1, tree: true},
                    tree: true
                }
            });
        },
        levelCheck = function(tree) {
            var level = function(node) {
                var level = 0, cur = node.par;
                while (cur !== tree.root) {
                    cur = cur.par;
                    level++;
                }
                return level;
            };
            t.dfs(tree.root.children, function() {
                equal(this.level, level(this));
            });
        },
        expandSeveralNodes = function(tree) {
            var dfd = $.Deferred();
            tree.load().done(function(root) {
                $.when(
                    root.children[0].load(),
                    root.children[3].load(),
                    _.last(root.children).load()
                ).done(function() {
                    $.when(
                        find(tree, 'second from under alpha').load(),
                        find(tree, 'blah blah').load(),
                        find(tree, 2).load(),
                        find(tree, 177).load(),
                        find(tree, '.git').load()
                    ).done(function() {
                        $.when(
                            find(tree, 'alpha boo').load(),
                            find(tree, 'alpha too').load()
                        ).done(function() {
                            dfd.resolve();
                        });
                    });
                });
            });
            return dfd;
        },
        expandSeveralNodesAndSeveralMore = function(tree) {
            var dfd = $.Deferred();
            expandSeveralNodes(tree).done(function() {
                $.when(
                    find(tree, 10).load(),
                    find(tree, 178).load(),
                    find(tree, 10137).load(),
                    find(tree, 10135).load()
                ).done(function() {
                    $.when(
                        find(tree, 11).load(),
                        find(tree, 179).load(),
                        find(tree, 10138).load(),
                        find(tree, 10164).load()
                    ).done(function() {
                        $.when(
                            find(tree, 180).load(),
                            find(tree, 10139).load()
                        ).done(function() {
                            dfd.resolve();
                        });
                    });
                });
            });
            return dfd;
        },
        structure = function(tree) {
            var out = [], indent = 0, removeLevels = false;
            if (!tree) {
                return '';
            }
            if (!tree.root) {
                removeLevels = true;
                tree.level = -1;
                t.dfs(tree, function(node, par) {
                    node.level = par? par.level + 1 : 0;
                });
            }
            t.dfs(tree.root? tree.root.children : tree, function() {
                var nonStandardKeys,
                    standardKeys = ['id', 'name', 'children', 'level', 'rank', 'file_plan_id', 'parent_id'];
                out.push(
                    Array(this.level+1).join('    '),
                    this.model ? this.model.id : this.id,
                    ': ',
                    this.model ? this.model.name : this.name
                );
                if (this.model) {
                    if (this.model.isparent) {
                        out.push('+');
                    }
                } else {
                    nonStandardKeys = _.filter(_.keys(this), function(key) {
                        return _.indexOf(standardKeys, key) < 0;
                    });
                    if (nonStandardKeys.length) {
                        if (this.operation === 'delete') {
                            out.push(' -');
                        } else {
                            out.push(' *');
                        }
                    }
                }
                out.push('\n');
            });
            if (removeLevels) {
                t.dfs(tree, function() { delete this.level; });
            }
            return out.join('');
        },
        find = function(tree, id) {
            return t.find(tree.root, function() {
                return this.model[_.isString(id)? 'name' : 'id'] === id;
            });
        };

    Mock(RecordSeries, recordseries_tree, {
        collectionArgs: {
            query: {recursive: true, tree: true},
            tree: true
        }
    });

    module('tree', {});

    asyncTest('load full tree recursively', function() {
        setup.call(this);
        var tree = Tree({
            resource: RecordSeries,
            collectionArgs: {
                query: {file_plan_id: 1, recursive: true, tree: true},
                tree: true
            }
        });
        tree.on('change', function() {
            ok(false, 'loading nodes should trigger "update" events, but "change" event was triggered');
        });
        tree.load().done(function(root) {
            var result = [];
            ok(root === tree.root);
            t.dfs(root.children, function() { result.push(this.model); });
            _.each(recordseries, function(rs, i) {
                equal(rs.id, result[i].id);
            });
            equal(result.length, recordseries.length);
            levelCheck(tree);
            start();
        });
    });

    asyncTest('load tree incrementally', function() {
        setup.call(this);
        var tree = this.tree, updateCount = 0;
        tree.on('change', function() {
            ok(false, 'loading nodes should trigger "update" events, but "change" event was triggered');
        }).on('update', function() {
            updateCount++;
        });
        tree.load().done(function(root) {
            var count = 0;
            t.dfs(root.children, function() { count += 1; });
            equal(count, 6);
            equal(root.children.length, _.reduce(recordseries, function(count, rs) {
                return count + (rs.parent_id == root.model.id? 1 : 0);
            }, 0));
            _.each(root.children, function(node) {
                ok(node.children == null);
            });

            root.children[0].load().done(function(firstChild) {
                var count = 0;
                t.dfs(firstChild.children, function() { count += 1; });
                equal(count, 5);
                equal(firstChild.children.length, _.reduce(recordseries, function(count, rs) {
                    return count + (rs.parent_id == firstChild.model.id? 1 : 0);
                }, 0));
                _.each(firstChild.children, function(node) {
                    ok(node.children == null);
                });

                firstChild.load().done(function(firstChild) {
                    levelCheck(tree);

                    // since .load() was called twice on firstChild, the
                    // 'update' callback only fired twice
                    equal(updateCount, 2);
                    start();
                });
            });
        });
    });

    asyncTest('reloading nodes doesnt break anything', function() {
        setup.call(this);
        var tree = this.tree;
        tree.load().done(function(root) {
            root.children[0].load().done(function(firstChild) {
                var loadWasCalledAgain = false;
                firstChild.collection.__load__ = firstChild.collection.load;
                firstChild.collection.load = function() {
                    loadWasCalledAgain = true;
                    return firstChild.collection.__load__.apply(firstChild.collection, arguments);
                };
                firstChild.load().done(function() {
                    var count = 0,
                        origCollection = firstChild.collection,
                        args = firstChild.options.collectionArgs;
                    equal(loadWasCalledAgain, false);
                    t.dfs(firstChild.children, function() { count++; });
                    equal(count, 5);
                    firstChild.set('collectionArgs', $.extend({}, args, {
                        query: {recursive: true}
                    }));
                    firstChild.load().done(function() {
                        var count = 0;
                        ok(firstChild.collection !== origCollection);
                        t.dfs(firstChild.children, function() { count++; });
                        equal(count, 53);
                        start();
                    });
                });
            });
        });
    });

    // module('moving a node', {setup: setup});
    module('moving a node', {});

    asyncTest('down', function() {
        setup.call(this);
        var tree = this.tree,
            inital = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            after = '1: alpha something+\n    512: blah blah\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n';
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 8);
            equal(structure(tree), inital);
            node.moveTo(node.par, node.index() + 1).done(function() {
                equal(structure(tree), after);
                start();
            });
        });
    });

    asyncTest('up', function() {
        setup.call(this);
        var tree = this.tree,
            inital = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            after = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    511: something else\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n';
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 2);
            equal(structure(tree), inital);
            node.moveTo(node.par, node.index() - 1).done(function() {
                equal(structure(tree), after);
                start();
            });
        });
    });

    asyncTest('left', function() {
        setup.call(this);
        var tree = this.tree,
            inital = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            after = '1: alpha something+\n    8: second from under alpha+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n    53: first+\n    65: second+\n    82: third+\n    9: alpha boo+\n        10: first+\n        20: second+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n';
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 9),
                newParent = find(tree, 52);
            equal(structure(tree), inital);
            node.moveTo(newParent).done(function() {
                equal(structure(tree), after);
                start();
            });
        });
    });

    asyncTest('right', function() {
        setup.call(this);
        var tree = this.tree,
            inital = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            after = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first+\n                176: delta+\n                    177: first+\n                        178: alpha+\n                        202: beta+\n                        205: gamma+\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n        10135: refs+\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n';
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 176),
                newParent = find(tree, 4);
            equal(structure(tree), inital);
            node.moveTo(newParent, 0).done(function() {
                equal(structure(tree), after);
                start();
            });
        });
    });

    asyncTest('moving a node triggers the "change" event at tree', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var changeArgs,
                node = find(tree, 176),
                newParent = find(tree, 4),
                updateCount = 0,
                changeCount = 0;
            tree.on('update', function() {
                updateCount++;
            }).on('change', function() {
                changeArgs = Array.prototype.slice.call(arguments, 0);
                changeCount++;
            });
            node.moveTo(newParent, 0).done(function() {
                equal(changeCount, 1);
                equal(updateCount, 1); // one 'update' from expanding the node
                equal(changeArgs.length, 4);
                equal(changeArgs[0], 'change');
                ok(changeArgs[1] === node);
                equal(changeArgs[2], 'move');
                ok(changeArgs[3] === newParent);
                start();
            });
        });
    });

    asyncTest('moving the last child from parent makes parent a leaf node', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var node1 = find(tree, 9),
                node2 = find(tree, 506),
                newParent = find(tree, 169),
                origParent = node1.par;
            $.when(
                node1.moveTo(newParent),
                node2.moveTo(newParent)
            ).done(function() {
                equal(origParent.model.isparent, false);
                equal(origParent.children, undefined);
                equal(origParent._loaded, true);
                equal(origParent._loadedRecursive, true);
                start();
            });
        });
    });

    asyncTest('promote into leaf node turns leaf to parent', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 8932),
                newParent = find(tree, 4);
            node.moveTo(newParent).done(function() {
                equal(newParent.model.isparent, true);
                equal(newParent.children.length, 1);
                start();
            });
        });
    });

    module('add/remove', {setup: setup});

    asyncTest('removeChild works', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var removedIds = [],
                node = find(tree, 9),
                origParent = node.par,
                origChildrenLength = origParent.children.length;
            t.dfs(node, function() { removedIds.push(this.model.id); });
            node.remove();
            equal(origParent.children.length, origChildrenLength-1);
            ok(origParent._removedChildren);
            ok(origParent._removedChildren[0] === node);
            equal(origParent._removedChildren.length, 1);
            t.dfs(tree.root, function() {
                equal(_.indexOf(removedIds, this.model.id), -1);
            });
            start();
        });
    });

    asyncTest('remove last child changes isparent to false', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 177),
                origParent = node.par;
            origParent.removeChild(node);
            equal(origParent.model.isparent, false);
            ok(origParent._removedChildren);
            ok(origParent._removedChildren[0] === node);
            equal(origParent._removedChildren.length, 1);
            start();
        });
    });

    asyncTest('remove child triggers "change" event at tree', function() {
        setup.call(this);
        var tree = this.tree, changeArgs, count = 0, updateCount = 0;
        tree.on('change', function() {
            changeArgs = Array.prototype.slice.call(arguments, 0);
            count++;
        });
        expandSeveralNodes(tree).done(function() {
            var node = find(tree, 177),
                origParent = node.par;
            tree.on('update', function() { updateCount++; });
            origParent.removeChild(node);
            equal(count, 1);
            equal(updateCount, 0);
            equal(changeArgs.length, 4);
            equal(changeArgs[0], 'change');
            ok(changeArgs[1] === origParent);
            equal(changeArgs[2], 'remove');
            ok(changeArgs[3] === node);
            start();
        });
    });

    asyncTest('add node to tree', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var newNode, newName =  'something very unique',
                model = RecordSeries({name: newName}),
                newParent = find(tree, 8);
            newParent.add(model).done(function() {
                newNode = _.find(newParent.children, function(c) {
                    return c.model === model;
                });
                ok(newNode);
                ok(newNode === _.last(newParent.children));
                equal(newNode.model.parent_id, newParent.model.id);
                equal(newNode.model.name, newName);
                start();
            });
        });
    });

    asyncTest('add two nodes at once to tree', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var newNode1, newNode2, newName =  'something very unique',
                model1 = RecordSeries({name: newName}),
                model2 = RecordSeries({name: newName + ' again'}),
                newParent = find(tree, 8),
                count = 0;
            tree.on('change', function() { count++; });
            newParent.add([model1, model2]).done(function() {
                newNode1 = _.find(newParent.children, function(c) {
                    return c.model === model1;
                });
                newNode2 = _.find(newParent.children, function(c) {
                    return c.model === model2;
                });
                equal(count, 1);
                ok(newNode1);
                ok(newNode2);
                ok(newNode1 === newParent.children[newParent.children.length-2]);
                ok(newNode2 === _.last(newParent.children));
                equal(newNode1.model.parent_id, newParent.model.id);
                equal(newNode2.model.parent_id, newParent.model.id);
                equal(newNode1.model.name, newName);
                equal(newNode2.model.name, newName + ' again');
                start();
            });
        });
    });

    asyncTest('node changes from leaf to parent when child added', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var newNode, newName =  'something very unique',
                model = RecordSeries({name: newName}),
                newParent = find(tree, 4);
            equal(newParent.model.isparent, false);
            newParent.add(model).done(function() {
                equal(newParent.model.isparent, true);
                start();
            });
        });
    });

    asyncTest('adding a node triggers "change" event in parent', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodes(tree).done(function() {
            var newNode, changeArgs, newName =  'something very unique',
                model = RecordSeries({name: newName}),
                newParent = find(tree, 4),
                updateCount = 0,
                changeCount = 0;
            tree.on('update', function() {
                updateCount++;
            }).on('change', function() {
                changeArgs = Array.prototype.slice.call(arguments, 0);
                changeCount++;
            });
            newParent.add(model).done(function() {
                equal(changeCount, 1);
                equal(updateCount, 1); // one 'update' from expanding the node
                equal(changeArgs.length, 4);
                equal(changeArgs[0], 'change');
                ok(changeArgs[1] === newParent);
                equal(changeArgs[2], 'add');
                ok(changeArgs[3].model === model);
                start();
            });
        });
    });

    module('test deltas', {
        setup: function() { },
        expectedStructure: '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n                11: alpha foo+\n                    12: first\n                    13: second\n                    14: third\n                15: beta the original+\n                17: beta+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n            179: first+\n                180: alpha+\n                    181: first+\n                    183: second+\n                    189: third+\n                192: beta+\n            196: second+\n            199: third+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n            10138: refs+\n                10139: remotes+\n                    10141: origin\n                10140: heads\n        10135: refs+\n            10166: tags\n            10165: heads\n            10164: remotes+\n                10167: origin\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n'
    });

    asyncTest('tree of deltas', function() {
        setup.call(this);
        var tree = this.tree,
            expectedStructure = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n                11: alpha foo+\n                    12: first\n                    13: second\n                    14: third\n                15: beta the original+\n                17: beta+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n            179: first+\n                180: alpha+\n                    181: first+\n                    183: second+\n                    189: third+\n                192: beta+\n            196: second+\n            199: third+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n            10138: refs+\n                10139: remotes+\n                    10141: origin\n                10140: heads\n        10135: refs+\n            10166: tags\n            10165: heads\n            10164: remotes+\n                10167: origin renamed\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            expectedDeltas = '1: alpha something\n52: beta fooasdfasdf\n169: gamma\n176: delta\n207: epsilon\n8932: netware output\n    10131: .git\n        10137: logs\n        10135: refs\n            10166: tags\n            10165: heads\n            10164: remotes\n                10167: origin renamed\n        10136: objects\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n';
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas;
            find(tree, 10167).model.set('name', 'origin renamed');
            deltas = tree.deltas(true);
            equal(structure(tree), expectedStructure);
            equal(structure(deltas), expectedDeltas);
            start();
        });
    });

    asyncTest('tree of deltas 2', function() {
        setup.call(this);
        var tree = this.tree,
            expectedStructure = this.expectedStructure,
            expectedDeltas = '1: alpha something *\n52: beta fooasdfasdf\n169: gamma\n176: delta\n207: epsilon\n8932: netware output\n';
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas;
            find(tree, 'alpha something').model.set('path', 'foo');
            deltas = tree.deltas(true);
            equal(structure(tree), expectedStructure);
            equal(structure(deltas), expectedDeltas);
            start();
        });
    });

    asyncTest('changes tracked for move', function() {
        setup.call(this);
        var tree = this.tree,
            expectedStructure = '52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n            179: first+\n                180: alpha+\n                    181: first+\n                    183: second+\n                    189: third+\n                192: beta+\n            196: second+\n            199: third+\n        202: beta+\n        205: gamma+\n    1: alpha something+\n        8: second from under alpha+\n            9: alpha boo+\n                10: first+\n                    11: alpha foo+\n                        12: first\n                        13: second\n                        14: third\n                    15: beta the original+\n                    17: beta+\n                20: second+\n            506: child of second\n        512: blah blah\n        511: something else\n        2: first+\n            3: alpha too+\n                5: second\n                4: first\n            6: beta+\n        23: third+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n            10138: refs+\n                10139: remotes+\n                    10141: origin\n                10140: heads\n        10135: refs+\n            10166: tags\n            10165: heads\n            10164: remotes+\n                10167: origin\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            expectedDeltas = '52: beta fooasdfasdf\n169: gamma\n176: delta\n    177: first\n    1: alpha something\n207: epsilon\n8932: netware output\n';
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas;
            find(tree, 'alpha something').moveTo(find(tree, 176));
            deltas = tree.deltas(true);
            equal(structure(tree), expectedStructure);
            equal(structure(deltas), expectedDeltas);
            start();
        });
    });

    asyncTest('changes tracked for add', function() {
        setup.call(this);
        var tree = this.tree,
            expectedStructure = '1: alpha something+\n    8: second from under alpha+\n        9: alpha boo+\n            10: first+\n                11: alpha foo+\n                    12: first\n                    13: second\n                    14: third\n                15: beta the original+\n                17: beta+\n            20: second+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n    : something very unique\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n            179: first+\n                180: alpha+\n                    181: first+\n                    183: second+\n                    189: third+\n                192: beta+\n            196: second+\n            199: third+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n            10138: refs+\n                10139: remotes+\n                    10141: origin\n                10140: heads\n        10135: refs+\n            10166: tags\n            10165: heads\n            10164: remotes+\n                10167: origin\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            expectedDeltas = '1: alpha something\n    8: second from under alpha\n    512: blah blah\n    511: something else\n    2: first\n    23: third\n    : something very unique\n52: beta fooasdfasdf\n169: gamma\n176: delta\n207: epsilon\n8932: netware output\n';
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var newNode, changeArgs, deltas,
                newName =  'something very unique',
                model = RecordSeries({name: newName}),
                newParent = find(tree, 'alpha something');
            newParent.add(model).done(function() {
                deltas = tree.deltas(true);
                equal(structure(tree), expectedStructure);
                equal(structure(deltas), expectedDeltas);
                start();
            });
        });
    });

    asyncTest('changes tracked for remove', function() {
        setup.call(this);
        var tree = this.tree,
            expectedStructure = '1: alpha something+\n    8: second from under alpha+\n        506: child of second\n    512: blah blah\n    511: something else\n    2: first+\n        3: alpha too+\n            5: second\n            4: first\n        6: beta+\n    23: third+\n52: beta fooasdfasdf+\n169: gamma+\n176: delta+\n    177: first+\n        178: alpha+\n            179: first+\n                180: alpha+\n                    181: first+\n                    183: second+\n                    189: third+\n                192: beta+\n            196: second+\n            199: third+\n        202: beta+\n        205: gamma+\n207: epsilon+\n8932: netware output+\n    10131: .git+\n        10137: logs+\n            10138: refs+\n                10139: remotes+\n                    10141: origin\n                10140: heads\n        10135: refs+\n            10166: tags\n            10165: heads\n            10164: remotes+\n                10167: origin\n        10136: objects+\n        10134: hooks\n        10133: info\n    10132: test_create_folder\n    10130: siq_licenses\n',
            expectedDeltas = '1: alpha something\n    8: second from under alpha\n        506: child of second\n        9: alpha boo -\n    512: blah blah\n    511: something else\n    2: first\n    23: third\n52: beta fooasdfasdf\n169: gamma\n176: delta\n207: epsilon\n8932: netware output\n';
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas, node = find(tree, 9),
                origParent = node.par;
            origParent.removeChild(node);
            deltas = tree.deltas(true);
            equal(structure(tree), expectedStructure);
            equal(structure(deltas), expectedDeltas);
            start();
        });
    });

    asyncTest('rank included in deltas', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas;
            find(tree, 'alpha something').moveTo(find(tree, 176));
            deltas = tree.deltas(true);
            t.dfs(deltas, function(node, par) {
                ok(this.rank != null);
                if (par) {
                    equal(this.rank, _.indexOf(par.children, this)+1);
                }
            });
            start();
        });
    });

    asyncTest('flat deltas match tree of deltas', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltaTree, namesFromDeltaTree = [], deltaList;
            find(tree, 'alpha something').moveTo(find(tree, 176));
            deltaTree = tree.deltas(true);
            t.dfs(deltaTree, function() {
                namesFromDeltaTree.push(this.name);
            });
            deltaList = tree.deltas();
            deepEqual(namesFromDeltaTree, _.pluck(deltaList, 'name'));
            start();
        });
    });

    asyncTest('deltas for deleted node includes file plan id', function() {
        setup.call(this);
        var tree = this.tree;
        expandSeveralNodesAndSeveralMore(tree).done(function() {
            var deltas, node = find(tree, 9),
                origParent = node.par,
                foundDeleted = false;
            origParent.removeChild(node);
            deltas = tree.deltas(true);
            t.dfs(deltas, function() {
                if (this.operation === 'delete') {
                    equal(this.file_plan_id, 1);
                    foundDeleted = true;
                }
            });
            ok(foundDeleted);
            start();
        });
    });

    start();
});
