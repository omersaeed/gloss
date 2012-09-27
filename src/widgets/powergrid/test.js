/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/example',
    './../powergrid',
    './columns',
    './column',
    './examplefixtures'
], function($, _, Example, PowerGrid, Columns, Column, exampleFixtures) {
    var setup = function() {
            Example.models.clear();
        },
        origAjax = Example.prototype.__requests__.query.ajax;

    window.Example = Example;

    Example.prototype.__requests__.query.ajax = function(params) {
        var dfd = $.Deferred(),
            resources = [],
            limit = params.limit || exampleFixtures.length,
            offset = params.offset || 0;

        for (var i = offset; i < limit; i++) {
            resources.push(_.extend({}, exampleFixtures[i]));
        }

        params.success({
            resources: resources,
            length: resources.length
        }, 200, {});
        return dfd;
    };

    asyncTest('everythings cool', function() {
        setup();
        var params = {limit: 150, offset: 10},
            g = PowerGrid({
                columnsClass: Columns.extend({
                    columnClasses: [
                        Column.extend({name: 'text_field'}),
                        Column.extend({name: 'required_field'}),
                        Column.extend({name: 'boolean_field'}),
                        Column.extend({name: 'datetime_field'}),
                        Column.extend({name: 'integer_field'}),
                        Column.extend({name: 'default_field'})
                    ]
                }),
                collection: Example.collection(),
                collectionLoadArgs: params
            }).appendTo('body');

        g.get('collection').load(params).then(function() {
            equal(g.get('models').length, params.limit);
            start();
        });
    });

    start();
});
