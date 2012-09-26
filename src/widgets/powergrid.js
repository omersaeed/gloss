define([
    './../view',
    './ascollectionviewable',
    'tmpl!./powergrid/powergrid.mtpl'
], function(View, asCollectionViewable, template) {
    var PowerGrid = View.extend({
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
    });

    asCollectionViewable.call(PowerGrid.prototype);

    return PowerGrid;
});
