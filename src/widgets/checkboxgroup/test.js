/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../checkboxgroup',
    './../form',
    './../../data/mock',
    './../../test/api/v1/targetvolume',
    'text!./../../test/api/v1/test/fixtures/targetvolume.json'
], function($, _, CheckBoxGroup, Form, Mock, TargetVolume, targetvolume_json) {

    var valueMatchesCheckboxes = function(checkboxes, value) {
        _.each(checkboxes, function(cb) {
            var idx = _.indexOf(value, cb.options.value);
            equal(cb.node.checked, idx >= 0);
        });
    };

    Mock(TargetVolume, JSON.parse(targetvolume_json));

    asyncTest('checkbox instantiation from collection', function() {
        var cbg = CheckBoxGroup()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(cbg.$node.find('input[type=checkbox]').length, 6);
            start();
        }, 50);
    });

    test('checkboxgroup instantiation without collection', function() {
        var cbg = window.cbg = CheckBoxGroup(undefined, {
            entries: [
                {name: 'foo bar baz', value: 0},
                {name: 'foo bar biggity iggity bazzle', value: 1}
            ]
        }).appendTo('#qunit-fixture');

        equal(cbg.$node.find('input[type=checkbox]').length, 2);
    });

    asyncTest('setting and getting value of checkboxgroup', function() {
        var cbg = CheckBoxGroup()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(cbg.getValue().length, 0);
            valueMatchesCheckboxes(cbg.checkboxes, cbg.getValue());

            cbg.setValue([1357, 4]);
            ok(_.isEqual(cbg.getValue(), [1357, 4]), 'getValue() should equal [1357, 4]');
            valueMatchesCheckboxes(cbg.checkboxes, cbg.getValue());
            start();
        }, 50);
    });

    test('setting value to all/none', function() {
        var cbg = window.cbg = CheckBoxGroup(undefined, {
            entries: [
                {name: 'foo bar baz', value: 0},
                {name: 'foo bar biggity iggity bazzle', value: 1}
            ]
        }).appendTo('#qunit-fixture');

        cbg.setValue('all');
        deepEqual(cbg.getValue(), [0, 1]);

        cbg.setValue('none');
        deepEqual(cbg.getValue(), []);
    });

    test('checkboxgroup correctly widgetized', function() {
        var $frm = $('<form><div name=my-cbg class=checkboxgroup></div></form>')
                .appendTo('body'),
            form = Form($frm, {widgetize: true});

        ok(form.getWidget('my-cbg'));
    });

    start();
});
