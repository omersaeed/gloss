/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/model',
    './../binding',
    'text!./testDataBindingAttribute.html'
], function($, _, Model, Binding, testDataBindHtml) {

    var assertThatModelMatchesUI = function(binding) {
        var model = binding.get('model');
        _.each(binding.get('bindings'), function(b, name) {
            if (b.el) {
                equal($(b.el).text(), model.get(name) || '',
                    'element with `data-bind="'+name+'"` text is "'+model.get(name)+'"');
            }
        });
    };

    module('use cases');

    test('explicit binding', function() {
        var $el = $('<span class=bound-field></span>').appendTo('#qunit-fixture'),
            myModel = Model.Model({myField: 'foo'}),
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
            myModel = Model.Model({field1: 'before set'}),
            binding = Binding({
                el: $el,
                model: myModel
            });

        $('#qunit-fixture').css({position: 'static'});

        ok(binding);

        assertThatModelMatchesUI(binding);
        equal(_.keys(binding.get('bindings')).length, 2);

        myModel.set('field1', 'foo1');
        myModel.set('field2', 'foo2');

        assertThatModelMatchesUI(binding);
    });

    module('corner cases');

    test('nested attribute', function() {
        var $el = $('<span class=bound-field></span>').appendTo('#qunit-fixture'),
            myModel = Model.Model({
                myModelField: {
                    subField: 'foo'
                }
            }),
            binding = Binding({
                model: myModel,
                bindings: {
                                                                          
                    // this is the model's field name, '.' is expanded to
                    // nested model fields
                    'myModelField.subField': {
                                                                          
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

    start();
});

