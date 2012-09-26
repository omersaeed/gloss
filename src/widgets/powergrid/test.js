/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/example',
    './../powergrid',
    './examplefixtures'
], function($, _, Example, PowerGrid, ExampleFixtures) {
    var setup = function() {
            Example.models.clear();
        },
        origAjax = Example.prototype.__requests__.query.ajax;

    window.Example = Example;

    Example.prototype.__requests__.query.ajax = function(params) {
        var dfd = $.Deferred(),
            resources = _.map(ExampleFixtures, function(model) {
                return _.extend({}, model);
            });
        params.success({
            resources: resources,
            length: resources.length
        }, 200, {});
        return dfd;
    };

    test('everythings cool', function() {
        setup();
        var g = PowerGrid({collection: Example.collection()}).appendTo('body');
        ok(g);
    });

    start();
});
