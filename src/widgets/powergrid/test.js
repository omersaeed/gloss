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
        var dfd = $.Deferred(), resources = [];

        if (params.limit) {
            for (var i = 0; i < params.limit; i++) {
                resources.push(_.extend({}, exampleFixtures[i]));
            }
        } else {
            resources = _.map(exampleFixtures, function(model) {
                return _.extend({}, model);
            });
        }
        params.success({
            resources: resources,
            length: resources.length
        }, 200, {});
        return dfd;
    };

    asyncTest('everythings cool', function() {
        setup();
        var params = {limit: 15},
            g = PowerGrid({
                columnsClass: Columns.extend({
                    columnClasses: [
                        Column.extend({name: 'text_field'}),
                        Column.extend({name: 'required_field'}),
                        Column.extend({name: 'boolean_field'})
                    ]
                }),
                collection: Example.collection(),
                collectionLoadArgs: params
            }).appendTo('body');

        g.get('collection').load(params).then(function() {
            ok(g.get('models').length === params.length);
            start();
        });
    });

    start();
});
