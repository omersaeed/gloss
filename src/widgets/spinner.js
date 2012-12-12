define([
    'vendor/spin',
    './widget'
], function (Spinner, Widget) {
    return Widget.extend({
        defaults:{
            opts: {
                lines: 13, // The number of lines to draw
                length: 7, // The length of each line
                width: 4, // The line thickness
                radius: 10, // The radius of the inner circle
                rotate: 0, // The rotation offset
                color: '#000', // #rgb or #rrggbb
                speed: 1, // Rounds per second
                trail: 60, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                top: 'auto', // Top position relative to parent in px
                left: 'auto' // Left position relative to parent in px
            },
            target: null,
            deferInstantiation: false
        },
        nodeTemplate: '<div></div>',
        spinner: null,
        customOpts: null,
        visible: false,
        create:function () {
            var self = this;
            this._super();
            self.update();
            if(!self.options.deferInstantiation) {
                self.instantiate();
            }
        },
        
        updateOpts: function(params) {
            var self = this;
            self.customOpts = params;
        },
        
        enable: function() {
            var self = this;
            self.visible = false;
            if(self.spinner) {
                self.spinner.stop();
            }
            return this;
        },
        disable: function() {
            var self = this;
            self.visible = true;
            // checking for .el will prevent multiple spin calls that will break spin.js
            if(self.spinner && !self.spinner.el) {
                if(!self.options.target) {
                    self.spinner.spin(self.node);
                } else {
                    self.spinner.spin(self.options.target);
                }
            }
            return this;
        },
        updateWidget:function (updated) {
            var self = this;
            this._super(updated);
        },
        
        instantiate: function() {
            // Instantiate only once and also when needed to ensure that the spinner gets rendered correctly.
            var self = this;
            if(!self.spinner) {
                if(self.customOpts) {
                    self.spinner = new Spinner(self.customOpts);
                } else {
                    self.spinner = new Spinner(self.options.opts);
                }
            }
            
            // Contextually user may have enabled / disabled widgets so apply the setting now.
            if(self.visible) {
                self.disable();
            } else {
                self.enable();
            }
        }
    });
});
