/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../toolbar'
], function($, ToolBar) {
    test('instantiating toolbar using default template', function() {
        ok(ToolBar(undefined, {
            tabs: ['Dishwasher', 'Plausible Deniability']
        }).prependTo('body'));
    });

    start();
});
