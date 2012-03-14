define([
    'vendor/jquery',
    'vendor/gloss/widgets/boundwidgetgroup'
], function($, BoundWidgetGroup) {
    return BoundWidgetGroup.extend({
        nodeTemplate: '<form>',

        defaults: {
            showStructuralErrors: false
        },

        create: function() {
            this._super();
            this.on('submit', this.submit);
        },

        processSubmit: function(response) {
            this.trigger('submitted', response);
        },

        submit: function(event) {
            if (event) {
                event.preventDefault();
            }
            this.initiateUpdate(this.updateModel).then(this.processSubmit, this.processErrors);
            return this;
        },

        updateModel: function() {
            var values = this.getBoundValues();
            if (this.options.staticValues) {
                $.extend(values, this.options.staticValues);
            }
            return this.getModel().set(values).save();
        }
    });
});
