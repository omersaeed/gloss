/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/underscore',
    './../grid',
    './../grid/row',
    './../collectionviewable',
    './../../data/mock',
    './../../test/api/v1/targetvolumeprofile',
    'mesh/tests/example',
    'text!./../../test/api/v1/test/fixtures/targetvolumeprofile.json'
], function($, _, Grid, Row, CollectionViewable, Mock, TargetVolumeProfile,
    Example, tvpFixture) {

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

    start();

});
