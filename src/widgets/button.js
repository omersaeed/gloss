define([
    'vendor/jquery',
    './formwidget'
], function($, FormWidget) {
    return FormWidget.extend({
        defaults: {
            messageList: false
        },
        create: function() {
            this._super();
            if(!this.options.nostyling) {
                this.$node.addClass('button');
            }
        }
    });
});
