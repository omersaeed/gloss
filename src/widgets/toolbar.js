define([
    './widget',
    'tmpl!./toolbar/toolbar.mtpl',
    'css!./toolbar/toolbar.css'
], function(Widget, template) {

    return Widget.extend({

        defaults: {
            tabs: [] // list of strings
        },

        nodeTemplate: template,

        create: function() {
            this.$node.addClass('toolbar');
        }
    });
});
