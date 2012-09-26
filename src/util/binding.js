define([
    'vendor/underscore',
    'vendor/t',
    'bedrock/class',
    'bedrock/assettable',
    './../widgets/widget',
    './../widgets/formwidget'
], function(_, t, Class, asSettable, Widget, FormWidget) {
    var textContent = document.createElement('span').textContent?
        'textContent' : 'innerText';

    // # Binding
    //
    // bind DOM elements to model fields
    //
    // ## overview
    //
    // the easiest way to explain is to start off with some examples
    //
    // ### explicit binding
    //
    //     var $el = $('<span></span>'),
    //         binding = Binding({
    //             model: myModel,
    //             bindings: {
    //
    //                 // this is the model's field name, '.' is expanded to
    //                 // nested model fields
    //                 'myModelField.subField': {
    //
    //                     // any HTML snippet, either jQuery collection or
    //                     // bare HTMLElement
    //                     el: $el
    //
    //                 }
    //             }
    //         });
    //
    //  whenever `myModel.myModelField.subField` changes, the `innerText` of
    //  `$el` will be updated with its new value.  this is a one-way binding.
    //
    // ### automatic binding to some fields in an HTML snippet
    //
    //     var binding = Binding({model: myModel, el: $someHtml});
    //
    //  where `$someHtml` refers to markup of this structure:
    //
    //     <div>
    //       <span data-bind=field1></span>
    //       <span data-bind=field2></span>
    //     </div>
    //
    //  then whenever `myModel.field1` and `myModel.field2` change, the
    //  `innerText` of their corresponding `<span>` elements will be updated.
    //  this is also a one-way binding.
    //
    // ### automatic binding to a widget instance
    //
    //     var myWidgetGroup = WidgetGroup($userForm),
    //         myUserModel = User.model.get(1),
    //         binding = Binding({model: myUserModel, widget: myWidgetGroup});
    //
    //  where `$userForm` refers to something like this:
    //
    //      <form>
    //        <input type=email name=email placeholder=Email />
    //        <input type=password name=password placeholder=Password />
    //      </form>
    //
    //  in this case, since the `<input>` elements will be instances of
    //  [`FormWidget`][formwidget], they will be bound to their corresponding
    //  fields in `myUserModel`.  these will be 2-way bindings.
    //
    // ### further details for automatic binding
    //
    // automatic binding algorithm works as follows:
    // 
    //  - take a DOM fragment (either bare `HTMLElement` instance, jQuery
    //    collection, or `Widget` instance),
    //
    //  - check each element for `data-bind` attribute, if found, set up a
    //    one-way binding between the element and the field specified by the
    //    attribute
    //
    //  - if no `data-bind` attr, check if the element corresponds to an
    //    instance of `FormWidget`, if so, set up a two-way binding between the
    //    widget and the model field corresponding to the widget's element's
    //    'name' attribute
    //
    // ### stuff that `Binding` does not support
    //
    //  - changing the UI (either the `widget` or the `el`): i mean.. this
    //    would be kind of silly, right?
    //
    // [formwidget]: https://github.com/siq/gloss/blob/master/src/widgets/formwidget.js
    //
    var Binding = Class.extend({
        init: function(options) {
            var explicitBindings = options.bindings;

            _.bindAll(this, '_onModelChange', '_onUIChange');

            delete (options = _.extend({}, options)).bindings;

            this.set(options);

            this._setBindings(explicitBindings);
        },

        _onModelChange: function(eventName, model, changed) {
            var self = this, bindings = self.get('bindings');

            if (!bindings) {
                return;
            }

            _.each(changed, function(___, prop) {
                if (bindings[prop]) {
                    self._setUIFromModelForBinding(prop);
                }
            });
        },

        onOptionChange: function(changed, opts) {
            if (changed.model) {
                this.get('model').on('change', this._onModelChange);
                if (this.previous('model')) {
                    this.previous('model').off('change', this._onModelChange);
                }
                this._setUIFromModel();
            }

            if (changed.el || changed.widget) {
                if (this.get('el') && this.get('widget')) {
                    throw Error(
                        'Binding object has either `widget` or `el`, not both');
                }

            }
        },

        _onUIChange: function(bindingName, binding, widget) {
            if (!this.get('bindings')[bindingName]) {
                // this probably means we need to clean up a 'change' event
                // handler for some widget that we used to have a 2-way binding
                // for
                throw Error(
                    'binding receiving events for unknown field:'+bindingName);
            }
            this.get('model').set(bindingName, widget.getValue());
        },

        // this walks through the DOM element (either from `widgt` or `el`) and
        // sets up bindings for everything it finds.  this is where we
        // implement the algorithm for 'automatic binding'
        _setBindings: function(explicitBindings) {
            var el, widget, self = this,
                bindings = {},
                root =  (widget = self.get('widget'))? widget.node :
                        (el = self.get('el'))? el.jquery && el[0] :
                        el,

                // set up the binding, overriding any automatically discovered
                // settings w/ the explicit settings
                setUpBinding = function(bindings, name, newBinding, explicit) {
                    var widget = newBinding.widget;
                    bindings[name] = explicit && explicit[name]?
                        _.extend(newBinding, explicit[name]) : newBinding;
                    if (widget) {
                        widget.on('change', function() {
                            self._onUIChange(name, newBinding, widget);
                        });
                    }
                };

            t.dfs(root, function(el, parentEl, ctrl) {
                var id, widget, name, newBinding,
                    dataBind = el.getAttribute('data-bind');
                    
                if (dataBind) {
                    setUpBinding(bindings, dataBind, {el: el},
                        explicitBindings);

                    // dont traverse any further into this DOM node
                    ctrl.cutoff = true;

                } else if (
                    (widget = Widget.registry.get(el.getAttribute('id'))) &&
                    widget instanceof FormWidget) {

                    setUpBinding(bindings, widget.$node.attr('name'),
                                {widget: widget}, explicitBindings);

                    // dont traverse any further into this DOM node
                    ctrl.cutoff = true;
                }
            });

            // add any bindings that were in the explicitBindings, but not
            // discovered during the automatic binding
            bindings = _.reduce(explicitBindings, function(bindings, binding, name) {
                if (!bindings[name]) {
                    if (binding.el && binding.el.jquery) {
                        binding.el = binding.el[0];
                    }
                    bindings[name] = binding;
                }
                return bindings;
            }, bindings);

            self.set('bindings', bindings);

            self._setUIFromModel();
        },

        // update the UI with all of the values from the model
        _setUIFromModel: function() {
            var self = this;
            _.each(self.get('bindings') || [], function(___, prop) {
                self._setUIFromModelForBinding(prop);
            });
        },

        // update the UI with the value from the model for a specific binding
        // (i.e. just update one field)
        _setUIFromModelForBinding: function(binding) {
            var bindings = this.get('bindings'),
                widget = bindings[binding].widget,
                value = this.get('model').get(binding) || '';
            if (bindings[binding].el) {
                bindings[binding].el[textContent] =
                    this.get('model').get(binding) || '';
            } else if (widget) {
                if (widget.setValue) {
                    widget.setValue(value);
                } else {
                    widget.$node.text(value);
                }
            }
        }

    });

    asSettable.call(Binding.prototype, {onChange: 'onOptionChange'});

    return Binding;
});
