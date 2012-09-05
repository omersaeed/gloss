define([
    'vendor/jquery',
    'vendor/underscore',
    './formwidget',
    'css!./textbox/textbox.css'
], function($, _, FormWidget) {

    var placeholderSupported = (function() {
            var supported;
            return function() {
                if (typeof supported === 'undefined') {
                    supported =
                        !!('placeholder' in document.createElement('input'));
                }
                return supported;
            };
        })(),

        // got this from http://stackoverflow.com/a/512542/5377
        setCursorPosition = function(node, pos) {
            if (node.setSelectionRange) {
                node.focus();
                node.setSelectionRange(pos,pos);
            } else if (node.createTextRange) {
                var range = node.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        };

    return FormWidget.extend({
        nodeTemplate: '<input type="text">',
        defaults: {
            acceptableChars: null,
            restriction: false,

            // this is set to 'true' if the widget is using it's own fallback
            // for html5 'placeholder' attribute.  you can set it to 'true' to
            // force the fallback to be used.
            placeholderFallback: false
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

            if (self.$node.attr('placeholder') &&
                (!placeholderSupported() || self.options.placeholderFallback)) {
                self._setupPlaceholderFallback();
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
        _setupPlaceholderFallback: function() {
            var self = this;
            self._placeholder = self.$node.attr('placeholder');
            self.$node.removeAttr('placeholder');
            self.options.placeholderFallback = true;
            self.$node.on('keydown', function(evt) {
                if (evt.which >= 65 && evt.which <= 90 &&
                        self.$node.hasClass('placeholder')) {
                    self.$node.val('').removeClass('placeholder');
                }
            }).on('keyup', function() {
                if (!self.$node.val()) {
                    self.$node.val(self._placeholder).addClass('placeholder');
                    setTimeout(function(){setCursorPosition(self.node, 0);}, 0);
                }
            }).on('focus', function(evt) {
                if (self.$node.hasClass('placeholder')) {
                    setTimeout(function(){setCursorPosition(self.node, 0);}, 0);
                }
            });
            if (!self.$node.val()) {
                self.$node.val(self._placeholder).addClass('placeholder');
            }
        },
        getValue: function() {
            if (this.$node.hasClass('placeholder')) {
                return '';
            } else {
                return this._super.apply(this, arguments);
            }
        },
        setValue: function(value) {
            var ret = this._super.apply(this, arguments);
            if (this.options.placeholderFallback) {
                if (value) {
                    this.$node.removeClass('placeholder');
                } else {
                    this.$node.val(this._placeholder).addClass('placeholder');
                }
            }
            return ret;
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
