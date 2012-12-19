define([
    'vendor/jquery',
    './../view'
], function($, View) {
    return View.extend({
        init: function(options) {
            var rendered, $el, viewName, id, args = Array.prototype.slice.call(arguments, 1);
            $el = options && (options.$el || options.el) &&
                  $(options.$el || options.el);
            options = options || {};
            if (!options.$el && !options.el) {
                options.$el = $('<div><div></div></div>');
            }
            this.waitForInitialRender = $.Deferred();
            this._super.apply(this, [options].concat(args));
            if ($el) {
                this.$el = $el;
                this.el = $el[0];
            } else {
                viewName = this.$el.attr('view-name');
                id = this.el.id;
                delete this.$el;
                delete this.el;
            }
            rendered = this.pauseRender().updateAll().unpauseRender();
            if (!rendered) {
                this.render();
            }
            if (id) {
                this.$el.attr('view-name', viewName);
                this.el.id = id;
            }
            this.waitForInitialRender.resolve();
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
