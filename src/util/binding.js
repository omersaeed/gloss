define([
    'bedrock/class'
], function(Class) {

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
    // [formwidget]: https://github.com/siq/gloss/blob/master/src/widgets/formwidget.js
    //
    return Class.extend({
    });
});
