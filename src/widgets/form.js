define([
    'vendor/jquery',
    'bedrock/class',
    './boundwidgetgroup'
], function($, Class, BoundWidgetGroup) {
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

        getValues: function() {
            var values = this.getBoundValues();
            if (this.options.staticValues) {
                // Do proper binding for static values as well.
                $.each(this.options.staticValues, function(key, value) {
                    Class.prop(values, key, value);
                });
            }
            return values;
        },
        
        updateModel: function() {
            return this.getModel().set(this.getValues()).save();
        }
    });
});
