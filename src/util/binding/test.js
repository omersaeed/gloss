/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    'mesh/model',
    './../../widgets/widgetgroup',
    './../binding',
    'text!./testDataBindingAttribute.html',
    'text!./testWidgetGroup.html',
    'text!./testMixedBinding.html'
], function($, _, moment, model, WidgetGroup, Binding, testDataBindHtml,
    testWidgetGroup, testMixedBinding) {

    var Model = model.Model.extend(),
        assertThatModelMatchesUI = function(binding, opts) {
        var model = binding.get('model'), modelValue, widgetValue;
        opts = opts || {};
        _.each(binding.get('bindings'), function(b, name) {
            if (opts.ignore && opts.ignore[name]) {
                return;
            }
            if (b.el) {
                equal($(b.el).text(), model.get(name) || '',
                    'element with `data-bind="'+name+'"` text is "'+model.get(name)+'"');
            } else if (b.widget) {
                widgetValue = b.widget.getValue?
                    b.widget.getValue() : b.widget.$node.text();
                modelValue = model.get(name);

                if (widgetValue && (widgetValue.getDate || widgetValue.toDate)) {
                    widgetValue = widgetValue.toString();
                }
                if (modelValue && (modelValue.getDate || modelValue.toDate)) {
                    modelValue = moment(modelValue).format(b.widget.options.format);
                }

                equal(widgetValue, modelValue || '',
                    'element for widget '+b.widget.$node.attr('name')+' text is "'+modelValue+'"');
            }
        });
    };
    module('use cases');

    test('explicit binding', function() {
        var $el = $('<span class=bound-field></span>').appendTo('#qunit-fixture'),
            myModel = Model({myField: 'foo'}),
            binding = Binding({
                model: myModel,
                bindings: {

                    // this is the model's field name, '.' is expanded to
                    // nested model fields
                    'myField': {

                        // any HTML snippet, either jQuery collection or
                        // bare HTMLElement
                        el: $el

                    }
                }
            });

        $('#qunit-fixture').css({position: 'static'});

        assertThatModelMatchesUI(binding);

        equal(_.keys(binding.get('bindings')).length, 1);

        equal($el.text(), 'foo');

    });

    test('automatic binding to some fields in an HTML snippet', function() {
        var $el = $(testDataBindHtml).appendTo('#qunit-fixture'),
            myModel = Model({field1: 'before set'}),
            binding = Binding({
                el: $el,
                model: myModel
            });

        ok(binding);

        assertThatModelMatchesUI(binding);
        equal(_.keys(binding.get('bindings')).length, 2);

        myModel.set('field1', 'foo1');
        myModel.set('field2', 'foo2');

        assertThatModelMatchesUI(binding);
    });

    test('automatic binding to widget', function() {
        var $el = $(testWidgetGroup).appendTo('#qunit-fixture'),
            wg = WidgetGroup($el, {widgetize: true}),
            myModel = Model({email: 'foo@example.com'}),
            binding = Binding({widget: wg, model: myModel});

        equal(_.keys(binding.get('bindings')).length, 3);

        assertThatModelMatchesUI(binding, {ignore: {'birthday':true}});

        myModel.set('birthday', moment());

        assertThatModelMatchesUI(binding);

        // 2-way binding is on by default for form widgets
        wg.setValues({password: 'whySOl33t‽'});

        assertThatModelMatchesUI(binding);

    });

    module('more in-depth use cases');

    test('automatic binding to widget and HTML w/ `data-bind` attrs', function() {
        var $el = $(testMixedBinding).appendTo('#qunit-fixture'),
            wg = WidgetGroup($el, {widgetize: true}),
            myModel = Model({
                email: 'foo@example.com',
                birthday: '1985-05-11'
            }),
            binding = Binding({widget: wg, model: myModel});

        myModel.on('change', function(evtName, myModel, changed) {
            if (changed.firstname || changed.lastname) {
                myModel.set('fullname',
                    (myModel.get('firstname') || '') +
                    ' ' +
                    (myModel.get('lastname') || ''));
            }
        });

        $('#qunit-fixture').css({position: 'static'});

        equal(_.keys(binding.get('bindings')).length, 6);

        assertThatModelMatchesUI(binding);

        myModel.set({firstname: 'George', lastname: 'Orwell'});

        assertThatModelMatchesUI(binding);

        equal($el.find('[data-bind=fullname]').text(), 'George Orwell');
    });

    module('corner cases');

    // commenting this out since the DAQ-604 fix causes problems
    //
    // we still want to test this, but since we're taking a bit different
    // approach to binding, it's ok to comment it out
    // test('nested attribute', function() {
    //     var $el = $('<span class=bound-field></span>').appendTo('#qunit-fixture'),
    //         myModel = Model({
    //             myModelField: {
    //                 subField: 'foo'
    //             }
    //         }),
    //         binding = Binding({
    //             model: myModel,
    //             bindings: {

    //                 // this is the model's field name, '.' is expanded to
    //                 // nested model fields
    //                 'myModelField.subField': {

    //                     // any HTML snippet, either jQuery collection or
    //                     // bare HTMLElement
    //                     el: $el

    //                 }
    //             }
    //         });

    //     $('#qunit-fixture').css({position: 'static'});

    //     assertThatModelMatchesUI(binding);

    //     equal(_.keys(binding.get('bindings')).length, 1);

    //     equal($el.text(), 'foo');
    // });

    start();
});

