/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
require([
    'path!gloss:widgets/checkboxgroup',
    'path!gloss:data/mock',
    'path!gloss:test/api/v1/targetvolume',
    'path!gloss:text!test/api/v1/test/fixtures/targetvolume.json'
], function(CheckBoxGroup, Mock, TargetVolume, targetvolume_json) {

    Mock(TargetVolume, JSON.parse(targetvolume_json));

    asyncTest('checkbox instantiation', function() {
        var cbg = window.cbg = CheckBoxGroup()
                    .set('collection', TargetVolume.collection())
                    .appendTo('body');
        setTimeout(function() {
            ok(true);
            console.log('in there!');
            start();
        }, 50);
    });

    start();
});
