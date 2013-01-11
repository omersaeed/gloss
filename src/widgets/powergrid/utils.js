// powergrid testing utilities
define([
    'vendor/jquery',
    'vendor/underscore',
    './../powergrid',
    './columnmodel',
    './column',
    'mesh/tests/mockedexample'
], function($, _, PowerGrid, ColumnModel, Column, Example) {
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
                swapOutRequestPrototype: false,
                delay: null,
                fail: false
            }, options);

            Example.mockDelay(options.delay)
                .mockFailure(options.fail)
                .models.clear();

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
        trim = function(s) {
            return _.isString(s)?
                s.replace(/\s+$/g, '').replace(/^\s+/g, '') : s;
        };

    return {
        BasicColumnModel: BasicColumnModel,
        setup: setup,
        trim: trim
    };
});
