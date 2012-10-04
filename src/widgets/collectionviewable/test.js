/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/underscore',
    './../widget',
    './../grid',
    './../grid/row',
    './../collectionviewable',
    './../form',
    './../../data/mock',
    './../../test/api/v1/targetvolumeprofile',
    'mesh/tests/example',
    'text!./../../test/api/v1/test/fixtures/targetvolumeprofile.json'
], function($, _, Widget, Grid, Row, CollectionViewable, Form, Mock,
    TargetVolumeProfile, Example, tvpFixture) {

    var RowClass = Row.extend({
            defaults: {
                colModel: [
                    {name: 'name', label: 'Name'}
                ]
            }
        }),
        GridClass = Grid.extend({
            defaults: {rowWidgetClass: RowClass}
        }, {mixins: [CollectionViewable]});

    Mock(TargetVolumeProfile, JSON.parse(tvpFixture));

    asyncTest('setting collection correctly populates grid', function() {
        TargetVolumeProfile.models.clear();
        var grid = GridClass(undefined, {
            collection: TargetVolumeProfile.collection()
        });

        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(grid.options.rows.length, 10);
            start();
        }, 100);
    });

    asyncTest('setting collection to null clears grid', function() {
        TargetVolumeProfile.models.clear();
        var grid = GridClass(undefined, {
            collection: TargetVolumeProfile.collection()
        });
        grid.options.collection.load().done(function() {
            equal(grid.options.rows.length, 10);
            grid.set('collection', null);
            equal(grid.options.rows.length, 0);
            start();
        });
    });

    asyncTest('collectionMap is called in the context of the object', function() {
        TargetVolumeProfile.models.clear();
        var collectionMapRan = false,
            GridClass2 = GridClass.extend({
                defaults: {
                    collectionMap: function(models) {
                        ok(_.isFunction(this.someRandomMethod),
                            'context in collectionMap is the instance');
                        collectionMapRan = true;
                        return models;
                    }
                },
                someRandomMethod: function() {}
            }),
            grid = GridClass2(null, {
                collection: TargetVolumeProfile.collection()
            });

        grid.options.collection.load().done(function() {
            equal(collectionMapRan, true);
            start();
        });
    });

    var dummyAjax = function(params) {
            var num = params.data.limit? params.data.limit : 10;

            setTimeout(function() {
                var split, ret = _.reduce(_.range(num), function(memo, i) {
                    memo.resources.push({name: 'item ' + i});
                    if (num < 10) {
                        _.last(memo.resources).foo = 'bar';
                    }
                    return memo;
                }, {total: num, resources: []});
                params.success(ret, 200, {});
            }, 50);
        },
        CountingGridClass = GridClass.extend({
            create: function() {
                this.updateCount = 0;
                this._super();
            },
            updateWidget: function(updated) {
                if (updated.models) {
                    this.updateCount++;
                    (this.updateModelSets = this.updateModelSets || [])
                        .push(this.options.models);
                }
                this._super(updated);
            }
        });

    asyncTest('setting collection does not set models twice', function() {
        Example.models.clear();
        var collection = Example.collection(), grid, previousCount;

        collection.query.request.ajax = dummyAjax;

        grid = CountingGridClass(undefined, {collection: collection});

        // instantiating the grid may have triggered a 'models' update.  it
        // wasn't caused by collectionviewable, and it didn't actually set any
        // models, so we'll record the count here and compare that later
        previousCount = grid.updateCount;

        // set a timeout long enough to allow the collection to load
        setTimeout(function() {

            // ensure that the models have only been set once
            equal(grid.updateCount, previousCount+1);
            start();
        }, 100);
    });

    asyncTest('setting loaded collection does not set models twice', function() {
        Example.models.clear();
        var collection = Example.collection(), grid, previousCount;

        collection.query.request.ajax = dummyAjax;

        collection.load().done(function() {
            grid = CountingGridClass(undefined, {collection: collection});

            // instantiating the grid may have triggered a 'models' update.  it
            // wasn't caused by collectionviewable, and it didn't actually set any
            // models, so we'll record the count here and compare that later
            previousCount = grid.updateCount;

            // set a timeout long enough to allow the collection to load
            setTimeout(function() {

                // ensure that the models have only been set once
                equal(grid.updateCount, previousCount+1);
                start();
            }, 100);
        });

    });

    var secondCallHasResolved = false,
        outOfOrderAjaxCount = 0,
        outOfOrderDfds = [$.Deferred(), $.Deferred()],
        outOfOrderAjax = function(params) {
            var num = params.data.limit? params.data.limit : 10,
                localCount = outOfOrderAjaxCount;

            setTimeout(function() {
                var split, ret = _.reduce(_.range(num), function(memo, i) {
                    memo.resources.push({name: 'item ' + i});
                    if (num < 10) {
                        _.last(memo.resources).foo = 'bar';
                    }
                    return memo;
                }, {total: num, resources: []});

                if (localCount !== 0) {
                    secondCallHasResolved = true;
                }

                params.success(ret, 200, {});
                if (outOfOrderDfds[localCount]) {
                    console.log('resolving dfd',localCount);
                    outOfOrderDfds[localCount].resolve();
                }
            }, outOfOrderAjaxCount > 0? 0 : 100);

            outOfOrderAjaxCount++;
        };

    asyncTest('out of order loads still set update listener', function() {
        Example.models.clear();
        var collection = Example.collection(), grid;

        collection.query.request.ajax = outOfOrderAjax;

        // this will trigger the first load call, which will never resolve, and
        // therefore
        grid = CountingGridClass(undefined, {collection: collection});

        collection.reset({limit: 5});

        // now that we've reset the query, this second load call will resolve
        // before the first
        collection.load().done(function() {

            // set a timeout just to let any pending update callbacks fire
            setTimeout(function() {
                var currentUpdateCount = grid.updateCount;

                // add a model to the collection, which will (should) trigger
                // an update
                collection.add(Example({name: 'just added'}));

                // set a timeout just to make sure the event has had a chance
                // to fire
                setTimeout(function() {

                    // ensure that the `.add()` call triggered an update
                    equal(grid.updateCount, currentUpdateCount+1);
                    start();
                }, 15);
            }, 15);
        });
    });

    asyncTest('resetting collection clears event handlers', function() {
        Example.models.clear();
        var w, count = 0,
            MyWidget = Widget.extend({
                updateWidget: function(updated) {
                    if (updated.models) {
                        count++;
                    }
                }
            }, {mixins: [CollectionViewable]}),
            c1 = window.c1 = Example.collection(),
            c2 = window.c2 = Example.collection();

        c1.query.request.ajax = c2.query.request.ajax = dummyAjax;

        // load both of these b/c sometimes we get an extra (mostly harmless)
        // call to `.set('models', ...)` if we don't
        c1.load();
        c2.load();

        w = MyWidget(null).set({collection: c1});

        c1.load().then(function() {
            equal(count, 1, 'first load from c1 should set models');
            w.set('collection', c2);
            c2.load().then(function() {
                equal(count, 2, 'first load from c2 should set models');
                c1.trigger('update');
                setTimeout(function() {
                    equal(count, 2, 'triggering update on c1 shouldnt set models');
                    start();
                }, 50);
            });
        });
    });

    asyncTest('unresolved .load() deferred followed by update re-enables widget', function() {
        Example.models.clear();
        var g = GridClass(),
            c = Example.collection();

        c.query.request.ajax = dummyAjax;

        // initially the grid should be enabled
        equal(g.$node.hasClass('disabled'), false, 'grid initially enabled');

        // this will trigger the initial load, disabling the grid
        g.set('collection', c);

        equal(g.$node.hasClass('disabled'), true,
            'grid disabled by initial load');

        // this will change the query and fire off a new load, thereby
        // orphaning the initial dfd (the dfd from the initial load will never
        // resolve)
        c.reset({limit: 5}).load().then(function() {
            // make sure the collectionviewable re-enabled the grid in spite of
            // the orphaned dfd
            equal(g.$node.hasClass('disabled'), false,
                'grid disabled by initial load');
            start();
        });
    });

    asyncTest('initializing widget with both collection and load args', function() {
        Example.models.clear();
        var g,
            GridClass2 = GridClass.extend({
                create: function() {
                    this.loadCount = 0;
                    this._super.apply(this, arguments);
                },
                updateWidget: function(updated) {
                    if (updated.models) {
                        this.loadCount++;
                    }
                    this._super.apply(this, arguments);
                }
            }),
            c = Example.collection();

        c.query.request.ajax = dummyAjax;

        g = GridClass2(null, {
            collection: Example.collection(),
            collectionLoadArgs: {limit: 7}
        });

        c.load().done(function() {
            setTimeout(function() {
                equal(g.loadCount, 1);
                start();
            }, 50);
        });
    });

    asyncTest('initializing form with collection, should not remove previous event handlers on that collection', function() {
        Example.models.clear();
        var g, c = Example.collection(), count = 0;

        c.query.request.ajax = dummyAjax;

        c.on('update', function() { count++; });

        g = GridClass(null, {collection: c});

        c.load().then(function() {

            // we need to call setTimeout here since the 'update' event is
            // triggered *after* the deferred is resolved. doing the deferred
            // then the timeout ensures:
            // 1. that the data is done loading
            // 2. that all of the residual actions (i.e. event triggering) have
            //    completed
            setTimeout(function() {

                equal(count, 1,
                    'update handler should have fired from first load');
                g.set('collection', null);
                c.load({reload: true}).then(function() {

                    // once again, need to add timeout so event is triggered
                    setTimeout(function() {

                        equal(count, 2,
                            'update handler should still be attached');
                        start();
                    }, 15);
                });
            }, 15);
        });
    });

    start();

});
