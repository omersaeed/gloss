/*global test, asyncTest, ok, equal, deepEqual, start, module */
define([
    'vendor/jquery',
    'vendor/underscore',
    './../grid',
    './../grid/row',
    './../collectionpageable',
    './../../data/mock',
    './../../test/api/v1/targetvolumeprofile',
    'mesh/tests/example',
    'text!./../../test/api/v1/test/fixtures/targetvolumeprofile.json'
], function($, _, Grid, Row, Pageable, Mock, TargetVolumeProfile,
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
        }, {mixins: [Pageable]});

    function makeHugeFixture(origFixture) {
        var i, newTvp, copy = JSON.parse(JSON.stringify(origFixture)),
            dummy = JSON.parse(JSON.stringify(_.last(copy))),
            newFixture = [];

        for (i = 0; i < 1000; i++) {
            newTvp = JSON.parse(JSON.stringify(dummy));
            newTvp[1].id = i + 1;
            newTvp[1].name = 'target volume profile ' + (i+1);
            newTvp[1].tasks_option = [
                'With a blow from the top-maul Ahab knocked off the steel head of the lance',
                'and then handing to the mate the long iron rod remaining',
                'bade him hold it upright, without its touching the deck',
                'Then, with the maul, after repeatedly smiting the upper end of this iron rod',
                'he placed the blunted needle endwise on the top of it',
                'and less strongly hammered that, several times, the mate still holding the rod as before'
            ][Math.floor(Math.random() * 5)];
            newTvp[1].volume_id = i % 4 + 1;
            newTvp[1].security_attributes = 'default ' + (i % 4 + 1);
            newFixture.push(newTvp);
        }

        return newFixture;
    }

    Mock(TargetVolumeProfile, makeHugeFixture(JSON.parse(tvpFixture)));
//    Mock(TargetVolumeProfile, JSON.parse(tvpFixture));

    asyncTest('setting collection correctly populates grid', function() {
        var grid = GridClass(undefined, {
            paging: true,
            collection: TargetVolumeProfile.collection()
        }).appendTo('body');

        ok(grid);
        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(grid.options.rows.length, grid.options.pageSize);
            start();
        }, 100);
    });

    asyncTest('next page', function() {
        var grid = GridClass(undefined, {
            paging: true,
            collection: TargetVolumeProfile.collection()
        }).appendTo('#quint-fixture');

        ok(grid);
        grid.$nextPage.click();
        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(parseInt(grid.$currentPage.val()), grid.page);
            equal(grid.$currentPage.val(), 2);
            start();
        }, 100);
    });

    asyncTest('last page', function() {
        var grid = GridClass(undefined, {
            paging: true,
            collection: TargetVolumeProfile.collection()
        }).appendTo('#quint-fixture');

        ok(grid);
        grid.$lastPage.click();
        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(parseInt(grid.$currentPage.val()), grid.page);
            equal(grid.$currentPage.val(), 40);
            start();
        }, 100);
    });

    asyncTest('previous page', function() {
        var grid = GridClass(undefined, {
            paging: true,
            collection: TargetVolumeProfile.collection()
        }).appendTo('#quint-fixture');

        ok(grid);
        grid.$lastPage.click();
        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(parseInt(grid.$currentPage.val()), grid.page);
            equal(grid.$currentPage.val(), 40);
            grid.$prevPage.click();
            setTimeout(function() {
                equal(parseInt(grid.$currentPage.val()), grid.page);
                equal(grid.$currentPage.val(), 39);
                start();
            }, 100);
        }, 100);
    });

    asyncTest('first page', function() {
        var grid = GridClass(undefined, {
            paging: true,
            collection: TargetVolumeProfile.collection()
        }).appendTo('#quint-fixture');

        ok(grid);
        grid.$firstPage.click();
        // we can assume that the collection will load after 100 ms since it's
        // mocked up.
        setTimeout(function() {
            equal(parseInt(grid.$currentPage.val()), grid.page);
            equal(grid.$currentPage.val(), 1);
            start();
        }, 100);
    });

    start();

});
