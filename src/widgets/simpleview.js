define([
    'vendor/jquery',
    './../view'
], function($, View) {
    return View.extend({
        init: function(options) {
            var rendered, args = Array.prototype.slice.call(arguments, 1);
            options = options || {};
            if (!options.$el && !options.el) {
                options.$el = $('<div><div></div></div>');
            }
            this._super.apply(this, [options].concat(args));
            rendered = this.pauseRender().updateAll().unpauseRender();
            if (!rendered) {
                this.render();
            }
        },
        pauseRender: function() {
            this._pauseRender = true;
            return this;
        },
        render: function() {
            var ret;
            if (!this._pauseRender) {
                ret = this._super.apply(this, arguments);
            } else {
                this._callRenderAfterUnpause = true;
                ret = this;
            }
            return this;
        },
        renderIsPaused: function() {
            return this._pauseRender;
        },
        unpauseRender: function() {
            var rendered = false;
            delete this._pauseRender;
            if (this._callRenderAfterUnpause) {
                this.render();
                rendered = true;
            }
            delete this._callRenderAfterUnpause;
            return rendered;
        }
    });
});
