/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/ 
define([
    'vendor/jquery',
    './../widgetgroup',
    './../button',
    './../checkbox',
    './../textbox',
    './../numberbox',
    './../selectbox',
    './../radiogroup',
    './../togglegroup',
    './../checkboxgroup',
    'text!./widgetgrouptesttmpl.html',
    'text!./widgetgrouptestwidgetizedescendents.mtpl'
], function($, WidgetGroup, Button, CheckBox, TextBox, NumberBox, SelectBox,
    RadioGroup, ToggleGroup, CheckBoxGroup, html, html2) {

    test('correctly group widgets', function() {
        var wg = WidgetGroup($(html), {widgetize: true});
        deepEqual(wg.getValues(), {
            baz: 'bazvalue',
            fieldset1: {foo: 'foovalue'},
            fieldset2: {bar: 'barvalue'}
        });
    });

    test('correctly widgetize descendents', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});
        ok(wg.getWidget('button1') instanceof Button);
        ok(wg.getWidget('button2') instanceof Button);

        ok(wg.getWidget('checkbox1') instanceof CheckBox);

        ok(wg.getWidget('textbox1') instanceof TextBox);
        ok(wg.getWidget('textbox2') instanceof TextBox);
        ok(wg.getWidget('textbox3') instanceof TextBox);
        ok(wg.getWidget('textbox4') instanceof TextBox);

        ok(wg.getWidget('numberbox1') instanceof NumberBox);

        ok(wg.getWidget('selectbox1') instanceof SelectBox);
        ok(wg.getWidget('selectbox2') instanceof SelectBox);

        ok(wg.getWidget('radiogroup1') instanceof RadioGroup);

        ok(wg.getWidget('togglegroup1') instanceof ToggleGroup);

        ok(wg.getWidget('checkboxgroup1') instanceof CheckBoxGroup);
    });

    start();
});
