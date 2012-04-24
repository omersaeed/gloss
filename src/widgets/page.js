/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 11:43 AM
 * Description: Base page widget to handle prepending micro
 *          templates on page load.
 */

define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            microTemplate: null,
            mTplArgs: null
        },
        create: function() {
            var self = this,
                mTpl = self.options.microTemplate,
                mTplArgs = self.options.mTplArgs;

            this._super();

            if(mTpl !== null) {
                self.$html = $(mTpl(mTplArgs));
            }
            window.onload = self.onPageLoad();
        },
        onPageLoad: function() {
            var self = this;

            if(self.$html !== undefined) {
                $('body').prepend(self.$html);
            }
        }
    });
});