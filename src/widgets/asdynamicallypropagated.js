define([
    './widget',
    './../view'
], function(Widget, View) {
    // this code-smell-of-a-mixin exists because widgets can't .propagate() to
    // views. so if you've got something like:
    //
    //      var modal = Modal(), view = View().appendTo(modal);
    //      modal.propagate('show');
    //
    // the `View` instance will never get the 'show' (or anything else
    // propagated down). this is because `Widget` figures out what its children
    // are when it's inserted into the dom via the widget registry. `View` on
    // the other hand just figures it out what its child widgets and views are
    // whenever you call `.propagate()`.
    //
    // if you want to use this so that `.propagate()` works correctly on a
    // widget instance, you would add something like:
    //
    //     var modal, view, MyModal = Modal.extend();
    //     asDynamicallyPropagated.call(MyModal.prototype);
    //     modal = MyModal();
    //     view = View.appendTo(modal);
    //
    return function() {
        this._childWidgetsAndViews = View.prototype._childWidgetsAndViews;

        this.propagate = function() {
            this.el = this.node;
            View.prototype.propagate.apply(this, arguments);
            return this;
        };
    };
});
