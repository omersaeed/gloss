/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
require([
    'path!vendor:jquery',
    'path!gloss:widgets/toolbar'
], function($, ToolBar) {
    test('instantiating toolbar using default template', function() {
        ToolBar(undefined, {
            tabs: ['Dishwasher', 'Plausible Deniability']
        }).prependTo('body');
    });

    start();
});
