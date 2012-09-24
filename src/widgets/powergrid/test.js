/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'mesh/tests/example',
    './../powergrid'
], function($, Example, PowerGrid) {
    var setup = function() {
            Example.models.clear();
        },
        origAjax = Example.prototype.__requests__.query.ajax;

    window.Example = Example;

    Example.prototype.__requests__.query.ajax = function(params) {
        var dfd = $.Deferred();
        console.log('in there');
        params.success({}, 200, {});
        return dfd;
    };

    test('everythings cool', function() {
        setup();
        var g = PowerGrid({collection: Example.collection()}).appendTo('body');
        ok(g);
    });

    start();
});
