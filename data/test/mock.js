/*global test, asyncTest, ok, equal, deepEqual, start, module */
require([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'api/v1/targetvolume',
    'api/v1/targetvolumeprofile',
    'api/v1/fileplan',
    'api/v1/recordseries',
    'text!api/v1/test/fixtures/targetvolumeprofile.json',
    'text!api/v1/test/fixtures/fileplan_tree.json',
    'text!api/v1/test/fixtures/recordseries_tree.json',
    'vendor/gloss/data/mock',
    'vendor/gloss/data/tree'
], function($, _, t, TargetVolume, TargetVolumeProfile, FilePlan, RecordSeries,
    targetvolumeprofile, fileplan_tree, recordseries_tree, Mock, Tree) {

    var tvpHarness = JSON.parse(targetvolumeprofile),
        fpHarness = JSON.parse(fileplan_tree),
        getById = function(id, harness) {
            var ret = t.find(harness, function() {
                if (_.isArray(this)) {
                    return this[1].id === id;
                } else {
                    return this.id === id;
                }
            });

            return _.isArray(ret)? ret[1] : ret;
        },
        isEqual = function(model, parsedJSON) {
            var stripped = _.reduce(model, function(stripped, val, key) {
                if (model.hasOwnProperty(key) && key !== 'cid' && key[0] !== '_') {
                    stripped[key] = val;
                }
                return stripped;
            }, {});
            return _.isEqual(stripped, parsedJSON);
        };

    // used to make mocked tvp data store:
    // $.ajax({url: '/api/v1/targetvolumeprofile?offset=0'}).done(function(tvps){window.tvps=_.map(tvps.resources, function(tvp) {return [[{volumeid:tvp.volume_id}], tvp]})})
    Mock(TargetVolumeProfile, JSON.parse(targetvolumeprofile));
    Mock(FilePlan, JSON.parse(fileplan_tree), {method: 'get_tree'});
    Mock(RecordSeries, JSON.parse(recordseries_tree), {
       collectionArgs: {
            query: {recursive: true, tree: true},
            tree: true
        }
    });
    window.RecordSeries = RecordSeries;

    module('loading flat data set', {
        setup: function() {
            TargetVolumeProfile.models.clear();
        }
    });

    asyncTest('loading by id works', function() {
        TargetVolumeProfile.models.get(33).refresh().done(function(tvp) {
            ok(isEqual(tvp, getById(33, tvpHarness)));
            ok(_.isFunction(tvp.refresh));
            start();
        });
    });

    asyncTest('loading entire collection works', function() {
        TargetVolumeProfile.collection().load().done(function(tvps) {
            _.each(tvps, function(tvp) {
                ok(_.isFunction(tvp.refresh));
                ok(isEqual(tvp, getById(tvp.id, tvpHarness)));
            });

            equal(tvpHarness.length, tvps.length);
            start();
        });
    });

    asyncTest('loading collection with params works', function() {
        TargetVolumeProfile.collection({query: {volumeid: 4}}).load()
            .done(function(tvps) {
                _.each(tvps, function(tvp) {
                    ok(_.isFunction(tvp.refresh));
                    ok(isEqual(tvp, getById(tvp.id, tvpHarness)));
                });

                equal(tvps.length, 3);
                start();
            });
    });

    asyncTest('querying with offset 0 and no limit works', function() {
        TargetVolumeProfile.collection().load().done(function(tvps) {
            _.each(tvps, function(tvp) {
                ok(_.isFunction(tvp.refresh));
                ok(isEqual(tvp, getById(tvp.id, tvpHarness)));
            });

            equal(tvpHarness.length, tvps.length);
            start();
        });
    });

    module('loading tree data set', {
        setup: function() {
            FilePlan.models.clear();
            RecordSeries.models.clear();
        }
    });

    asyncTest('loading full tree works', function() {
        var id = 1, recordSeriesCount = 0,
            expected = JSON.parse(recordseries_tree);

        var c = RecordSeries.collection({
            tree: true,
            query: {
                tree: true,
                file_plan_id: 1,
                recursive: true
            }
        });

        c.load().done(function(tree) {
            _.each(tree, function(model, i) {
                equal(model.id, expected[i][1].id);
            });
            start();
        });
    });

    // ---------------------------------------------- all of this is deprecated
    // module('loading tree data set', {
    //     setup: function() {
    //         FilePlan.models.clear();
    //         RecordSeries.models.clear();
    //     }
    // });

    // asyncTest('loading full tree works', function() {
    //     var id = 1, recordSeriesCount = 0;

    //     t.dfs(fpHarness[id], function() { recordSeriesCount++; });

    //     FilePlan.models.get(id).getTree().done(function(tree) {
    //         var count = 0;
    //         t.stroll(tree, fpHarness[id], function(model, expected) {
    //             equal(model.id, expected.id);
    //             ok(_.isFunction(model.refresh));
    //             count++;
    //         });
    //         equal(count, recordSeriesCount);
    //         start();
    //     });
    // });

    // asyncTest('loading sub-tree works', function() {
    //     var id = 1, fp;

    //     FilePlan.models.get(id).getTree({id: 9}).done(function(tree) {
    //         var count = 0, node9 = getById(9, fpHarness[id]);
    //         t.stroll(tree, node9.children, function(model, expected) {
    //             equal(model.id, expected.id);
    //             ok(_.isFunction(model.refresh));
    //             count++;
    //         });
    //         equal(count, 13);
    //         start();
    //     });
    // });

    // asyncTest('loading just children works', function() {
    //     var id = 1;

    //     FilePlan.models.get(id).getTree({id: 1, recursive: false})
    //         .done(function(tree) {
    //             var node1 = getById(1, fpHarness[id]);
    //             equal(tree.length, node1.children.length);
    //             _.each(node1.children, function(expected, i) {
    //                 equal(tree[i].id, expected.id);
    //                 ok(tree[i].children == null);
    //                 if (tree[i].children != null) {
    //                     throw Exception('should not have children');
    //                 }
    //                 ok(_.isFunction(tree[i].refresh));
    //             });
    //             start();
    //         });
    // });

    // asyncTest('loading just children after clearing models works', function() {
    //     var id = 1;

    //     FilePlan.models.get(id).getTree({id: 1, recursive: false})
    //         .done(function(tree) {
    //             var node1 = getById(1, fpHarness[id]);
    //             equal(tree.length, node1.children.length);
    //             _.each(node1.children, function(expected, i) {
    //                 equal(tree[i].id, expected.id);
    //                 ok(tree[i].children == null);
    //                 ok(_.isFunction(tree[i].refresh));
    //             });
    //             start();
    //         });
    // });

    // asyncTest('loading full tree after subtree works', function() {
    //     var id = 1, fp = FilePlan.models.get(1), recordSeriesCount = 0;

    //     t.dfs(fpHarness[id], function() { recordSeriesCount++; });

    //     fp.getTree({id: 9}).done(function(tree) {
    //         fp.getTree().done(function(tree) {
    //             var count = 0;
    //             t.stroll(tree, fpHarness[id], function(model, expected) {
    //                 equal(model.id, expected.id);
    //                 ok(_.isFunction(model.refresh));
    //                 count++;
    //             });
    //             equal(count, recordSeriesCount);
    //             start();
    //         });
    //     });
    // });

});
