define([
    './widget',
    'tmpl!./toolbar/toolbar.mtpl',
    'css!./toolbar/toolbar.css'
], function(Widget, template) {

    return Widget.extend({

        defaults: {
            // 'tabs' can be one of three things:
            //  - a list of strings
            //  - a list of objects of the form: {href: '...', content: '...'}
            //  - a function that returns a string of the content
            tabs: [],

            // 'controls' is a compiled template function that returns html for
            // stuff like user menu, help icon, etc that typcially go in the
            // upper-right corner of the toolbar.  by default it doesn't
            // actually show anything
            controls: function() { return ''; }
        },

        nodeTemplate: template,

        create: function() {
            this.$node.addClass('toolbar');
        }
    });
});
