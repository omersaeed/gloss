define([
    'path!gloss:widgets/widget',
    'path!gloss:tmpl!widgets/toolbar/toolbar.mtpl',
    'path!gloss:css!widgets/toolbar/toolbar.css'
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
