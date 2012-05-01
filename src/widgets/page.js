/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 11:43 AM
 * Description: Base page widget to handle prepending compiled micro
 *          templates on page load.
 */

define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            template: null
        },

        create: function() {
            var self = this,
                template = self.options.template;

            this._super();

            self.loaded = false

            if(template !== null) {
                self.$html = $(template);
            }
            $(document).ready(self.onPageLoad);
        },
        on: function(event, callback) {
            /* if the page is already load then just return
             * otherwise wait for the trigger
             */
            var self = this;
            if(self.loaded) {
                callback('loaded');
            }
        },
        onPageLoad: function() {
            var self = this;

            if(self.$html !== undefined) {
                $('body').prepend(self.$html);
            }
            self.$node.trigger('loaded');
            self.loaded = true;
        }
    });
});