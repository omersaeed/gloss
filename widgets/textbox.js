define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/formwidget'
], function($, _, FormWidget) {
    return FormWidget.extend({
        nodeTemplate: '<input type="text">',
        defaults: {
            acceptableChars: null,
            restriction: false,
            placeholder: null
        },
        create: function() {
            var self = this;
            self._super();
            self._acceptableChars = null;

            if(self.$node.is('textarea')) {
                self.$node.addClass('textarea');
            } else {
                self.$node.addClass('textbox');
                self.on('focus', function() {
                    this.select();
                });
            }

            self.on('keypress', function(event) {
                if(self._acceptableChars != null) {
                    if(event.which >= 32 && self._acceptableChars.indexOf(String.fromCharCode(event.which)) < 0) {
                        return false;
                    }
                }
            });
            self.update();
        },
        updateWidget: function(updated) {
            if(this.options.acceptableChars != null) {
                this._acceptableChars = this.options.acceptableChars;
            } else if(_.isString(this.options.restriction) &&
                    this.options.restriction.match(/float|int|pos|neg/)) {
                this._acceptableChars = '0123456789';
                if (this.options.restriction.indexOf('integer') < 0) {
                    this._acceptableChars += '.';
                }
                if (this.options.restriction.indexOf('positive') < 0) {
                    this._acceptableChars += '-';
                }
            }
        }
    });
});
