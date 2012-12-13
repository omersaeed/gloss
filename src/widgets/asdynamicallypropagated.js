define([
    './widget',
    './../view'
], function(Widget, View) {
    return function() {
        this._childWidgetsAndViews = View.prototype._childWidgetsAndViews;

        this.propagate = function() {
            this.el = this.node;
            View.prototype.propagate.apply(this, arguments);
            return this;
        };
    };
});
