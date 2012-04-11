/*global test, asyncTest, ok, equal, deepEqual, start */
require([
    'vendor/vendor:jquery',
    'vendor/vendor:underscore',
    'vendor/gloss/widgets/grid',
    'vendor/gloss/widgets/grid/row',
    'vendor/gloss/widgets/button',
    'vendor/gloss/data/mock',
    'api/v1/targetvolumeprofile',
    'text!api/v1/test/fixtures/targetvolumeprofile.json'
], function($, _, Grid, Row, Button, Mock, TargetVolumeProfile, tvpHarness) {
    var i, tvpPerformanceHarness = JSON.parse(tvpHarness),
        len = tvpPerformanceHarness.length,
        dummy = JSON.stringify(_.last(tvpPerformanceHarness)),
        showGrid = function() {
            $('#qunit-fixture').css({position: 'static'});
        },
        hideGrid = function() {
            $('#qunit-fixture').css({position: 'absolute'});
        },
        RowClass = Row.extend({
            defaults: {
                colModel: [
                    {name: 'grab', render: 'renderGrabCol', modelIndependent: true},
                    {name: 'name', label: 'Name'},
                    {name: 'tasks_option', label: 'Tasks Option'},
                    {name: 'volume_id', label: 'Volume ID'},
                    {name: 'security_attributes', label: 'Security Attributes'},
                    {name: 'set_children', render: 'renderSetChildrenCol', modelIndependent: true}
                ]
            },
            renderGrabCol: function(col) {
                return '<button type="button" class="grab">m</button>';
            },
            renderSetChildrenCol: function(col) {
                return '<button type=button class="button set-children">Set children</button>';
            },
            render: function() {
                var self = this, hasRendered = self.hasRendered;

                self._super.apply(self, arguments);

                if (! hasRendered) {
                    setTimeout(function() {
                        Button(self.$node.find('button.grab'), {
                            parentWidget: self
                        }).on('click', function() {
                            console.log('grab button clicked '+$(this).closest('tr').attr('id').toString());
                        });

                        Button(self.$node.find('button.set-children'), {
                            parentWidget: self
                        }).on('click', function() {
                            console.log('set-children button clicked '+$(this).closest('tr').attr('id').toString());
                        });
                    }, 0);
                }
            }
        });

    for (i = 0; i < 1000-len; i++) {
        tvpPerformanceHarness.push(JSON.parse(dummy));
        _.last(tvpPerformanceHarness)[1].id = i + 100;
        _.last(tvpPerformanceHarness)[1].name = 'some default name ' + i.toString();
    }

    Mock(TargetVolumeProfile, tvpPerformanceHarness);

    $('<div id=perf/>').appendTo('body');

    // asyncTest('basic performance test - 100', function() {
    //     var grid, startTime, endTime;

    //     grid = Grid(undefined, {
    //         query: TargetVolumeProfile.query(),
    //         rowWidgetClass: RowClass
    //     }).appendTo($('<div id=basic100/>').appendTo('body'));

    //     startTime = new Date();
    //     grid.options.query.load(0, 100).done(function(data) {
    //         endTime = new Date();
    //         $('<div/>').text('elaped time 100: '+(endTime-startTime)).appendTo($('#perf'));
    //         $('#basic100').remove();
    //         start();
    //     });
    // });

    asyncTest('basic performance test - 200', function() {
        var grid, collection, startTime, endTime;

        window.grid = grid = Grid(undefined, {
            // collection: TargetVolumeProfile.collection(),
            rowWidgetClass: RowClass
        }).appendTo($('<div id=basic200/>').appendTo('body'));
        window.TargetVolumeProfile = TargetVolumeProfile;
        window.collection = collection = TargetVolumeProfile.collection();

        window.collection.load({limit: 300}).done(function(data) {
            window.data1 = data;
        });
        window.collection.load({limit: 300, offset: 300}).done(function(data) {
            window.data2 = data;
        });
        window.collection.load({limit: 300, offset: 600}).done(function(data) {
            window.data3 = data;
        });
    });

    // asyncTest('basic performance test - 500', function() {
    //     var grid, startTime, endTime;

    //     grid = Grid(undefined, {
    //         query: TargetVolumeProfile.query(),
    //         rowWidgetClass: RowClass
    //     }).appendTo($('<div id=basic500/>').appendTo('body'));

    //     startTime = new Date();
    //     grid.options.query.load(0, 500).done(function(data) {
    //         endTime = new Date();
    //         $('<div/>').text('elaped time 500: '+(endTime-startTime)).appendTo($('#perf'));
    //         $('#basic500').remove();
    //         start();
    //     });
    // });

    // asyncTest('basic performance test - 1000', function() {
    //     var grid, startTime, endTime;

    //     grid = Grid(undefined, {
    //         query: TargetVolumeProfile.query(),
    //         rowWidgetClass: RowClass
    //     }).appendTo($('<div id=basic1000/>').appendTo('body'));

    //     startTime = new Date();
    //     grid.options.query.load(0, 1000).done(function(data) {
    //         endTime = new Date();
    //         $('<div/>').text('elaped time 1000: '+(endTime-startTime)).appendTo($('#perf'));
    //         // $('#basic1000').remove();
    //         start();
    //     });
    // });

});


