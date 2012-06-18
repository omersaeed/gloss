/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/ 
define([
    'vendor/jquery',
    'vendor/underscore',
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
], function($, _, WidgetGroup, Button, CheckBox, TextBox, NumberBox, SelectBox,
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

        ok(wg.getWidget('radiogroup1') instanceof RadioGroup,
            'radiogroup correctly widgetized');

        ok(wg.getWidget('togglegroup1') instanceof ToggleGroup,
            'togglegroup correctly widgetized');

        ok(wg.getWidget('checkboxgroup1') instanceof CheckBoxGroup,
            'checkboxgroup correctly widgetized');
    });

    test('set label "for" attribute', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});

        ok(wg.$node.find('label:contains("Text box 1 label")').attr('for') != null);
        equal(wg.getWidget('textbox1').$node.attr('id'),
            wg.$node.find('label:contains("Text box 1 label")').attr('for'));

        ok(wg.$node.find('label[data-for="radiogroup1:value1"]').attr('for') != null,
            'radiogroup labels\' "for" attrubute has been set');
        equal(
            wg.$node.find('label[data-for="radiogroup1:value1"]').attr('for'),
            wg.getWidget('radiogroup1').$node.find('[type=radio]').first().attr('id')
            );

        ok(wg.$node.find('label[data-for="checkboxgroup1:value1"]').attr('for') != null,
            'checkboxgroup labels\' "for" attrubute has been set');
        equal(
            wg.$node.find('label[data-for="checkboxgroup1:value1"]').attr('for'),
            wg.getWidget('checkboxgroup1').$node.find('[type=checkbox]').first().attr('id')
            );
    });

    test('setting the messagelist for an input', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});

        ok(wg.getWidget('textbox1').options.messageList);
    });

    test('testing getwidgets', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});
        var widgets = wg.getWidgets();
        
        ok(widgets.fieldset1 instanceof Object);
        ok(widgets.fieldset1.fieldset1widget1 instanceof TextBox);
        ok(widgets.fieldset1.fieldset1widget2 instanceof TextBox);
        ok(widgets.fieldset1.fieldset1widget3 instanceof TextBox);
        ok(widgets.fieldset1.fieldset1widget4 instanceof TextBox);   
        
        ok(_.size(widgets) === 14);
        ok(_.size(widgets.fieldset1) === 4);
        ok(_.size(wg.options.widgets) === 17)
        
    });

    test('setting values based on regex', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});
        wg.setWidgets('sample', /textbox[123]+/);

        ok(wg.getWidget('textbox1').getValue() === 'sample');
        ok(wg.getWidget('textbox2').getValue() === 'sample');
        ok(wg.getWidget('textbox3').getValue() === 'sample');
        ok(wg.getWidget('textbox4').getValue() !== 'sample');
    });

    test('setting values based on key', function() {
        var wg = WidgetGroup($(html2), {widgetize: true});
        wg.setWidgets({textbox1: 'testA', textbox2: 'testB'});

        ok(wg.getWidget('textbox1').getValue() === 'testA');
        ok(wg.getWidget('textbox2').getValue() === 'testB');
    });

    start();
});
