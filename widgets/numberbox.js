define([
    'path!jquery',
    'path!gloss:widgets/textbox'
], function($, TextBox) {
    return TextBox.extend({
        nodeTemplate: '<input type=number>',
        defaults: {
            restriction: null,
            placeholder: null
        },

        create: function() {
            var restriction, 
                min = this.$node.attr('min'),
                step = this.$node.attr('step');
            
            if (this.options.restriction == null) {
                if (step != null && parseInt(step, 10) % 1 === 0) {
                    restriction += 'integer';
                }

                if (min != null && parseInt(min, 10) === 0) {
                    restriction += ' positive';
                }

                this.options.restriction = $.trim(restriction) || 'float';
            }

            this._super();
        }
    });
});
