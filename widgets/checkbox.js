define([
    'path!jquery',
    'path!gloss:widgets/formwidget'
], function($, FormWidget) {
    return FormWidget.extend({
        nodeTemplate: '<input type=checkbox />',
        create: function() {
            var self = this;
            self._super();

            self.$node.addClass('checkbox');
            if(self.options.initialValue === true) {
                self.$node.prop('checked', true);
            }
        },
        getValue: function() {
            return this.$node.is(':checked');
        },
        setValue: function(value, silent) {
            var checked = this.$node.is(':checked');

            if (typeof value === 'undefined') {
                value = false;
            }

            if(value !== checked) {
                this.$node.prop('checked', value);
                if(!silent) {
                    this.trigger('change');
                }
            }
            return this;
        }
    });
});
