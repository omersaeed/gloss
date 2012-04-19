/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
require([
    'path!vendor:jquery',
    'path!gloss:widgets/radiogroup',
    'path!gloss:text!widgets/radiogroup/radiogroup.html'
], function($, RadioGroup, html) {
    test('instatiate radiogroup from html', function() {
        var rg, $rg = $(html).appendTo('#qunit-fixture');
        rg = RadioGroup($rg);
        ok(rg);
    });
    start();
});
