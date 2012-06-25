/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    './../grid',
    './../grid/row',
    './../collectionviewable',
    './../../data/mock',
    './../../test/api/v1/targetvolumeprofile',
    'text!./../../test/api/v1/test/fixtures/targetvolumeprofile.json'
], function(Grid, Row, CollectionViewable, Mock, TargetVolumeProfile,
    tvpFixture) {

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

    start();

});
