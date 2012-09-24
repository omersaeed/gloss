define([
    './../view',
    './collectionviewable',
    'tmpl!./powergrid/powergrid.mtpl'
], function(View, CollectionViewable, template) {
    return View.extend({
        defaults: {
        },

        template: template,

        rerender: function() {
            console.log('re-rendering');
        },

        update: function(updated) {
            if (updated.models) {
                this.rerender();
            }
        }
    }, {mixins: [CollectionViewable]});
});
