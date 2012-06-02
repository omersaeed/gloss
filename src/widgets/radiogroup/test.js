/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../radiogroup',
    './../form',
    'text!./radiogroup.html'
], function($, RadioGroup, Form, html) {
    test('instatiate radiogroup from html', function() {
        var rg, $rg = $(html).appendTo('#qunit-fixture');
        rg = RadioGroup($rg);
        ok(rg);
    });
    test('instatiate radiogroup from html correctly sets value', function() {
        var rg, $rg = $(html).appendTo('#qunit-fixture');
        rg = RadioGroup($rg);
        equal(rg.getValue(), 'bar');

        $rg.remove();
        $rg = $(html.replace(/checked/, '')).appendTo('#qunit-fixture');
        rg = RadioGroup($rg);
        equal(rg.getValue(), null);
    });
    test('button group in form is widgetized', function() {
        var $form = $('<form>').html(html).appendTo('#qunit-fixture'),
            form = Form($form, {widgetize: true});

        ok(form.getWidget('my-radio-group'));
        equal(form.getWidget('my-radio-group').getValue(), 'bar');
        equal(
            form.$node.find('label[data-for="my-radio-group:foo"]').attr('for'),
            form.$node.find('input[value=foo]').attr('id'));
    });
    start();
});
