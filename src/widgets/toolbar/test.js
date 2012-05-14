/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'component!vendor:jquery',
    './../toolbar'
], function($, ToolBar) {
    test('instantiating toolbar using default template', function() {
        ToolBar(undefined, {
            tabs: ['Dishwasher', 'Plausible Deniability']
        }).prependTo('body');
    });

    start();
});
