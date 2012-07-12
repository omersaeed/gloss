define([
    'vendor/spin',
    'gloss/widgets/widget'
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
            target: null
        },
        nodeTemplate: '<div></div>',

        create:function () {
            var self = this;
            this._super();

            self.spinner = new Spinner(self.options.opts);

            self.update();
        },
        enable: function() {
            var self = this;
            self.spinner.stop();
        },
        disable: function() {
            var self = this;
            if(!self.options.target) {
                self.spinner.spin(self.node);
            } else {
                self.spinner.spin(self.options.target);
            }
        },
        updateWidget:function (updated) {
            var self = this;
            this._super(updated);
        }

    });
});