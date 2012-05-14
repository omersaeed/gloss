define([
    'component!vendor:jquery',
    'component!vendor:underscore',
    './statefulwidget',
    './formwidget'
], function($, _, StatefulWidget, FormWidget) {
    return FormWidget.extend({
        create: function() {
            var self = this, $checked;
            self._super();

            self.buttons = {};
            self.$buttons = self.$node.find('input[type=radio]');
            self.value = null;

            self.$node.addClass('radiogroup');
            self.$buttons.each(function(i, element) {
                var $button = $(element);
                self.buttons[$button.val()] = $button;
                if ($button.attr('id') == null) {
                    $button.attr('id', _.uniqueId('radiogroup-widget'));
                }
            });
            
            self.on('change', 'input', function(event) {
                event.stopPropagation();
                self.value = $(this).val();
                self.trigger('change');
            });
            if(self.options.initialValue != null) {
                self.setValue(self.options.initialValue, true);
            } else if (($checked = self.$buttons.filter(':checked')).length) {
                self.setValue($checked.val());
            }
        },
        disable: function() {
            this.$buttons.attr('disabled', true);
            StatefulWidget.prototype.disable.call(this);
            return this;
        },
        enable: function() {
            this.$buttons.attr('disabled', false);
            StatefulWidget.prototype.enable.call(this);
            return this;
        },
        getValue: function() {
            return this.value;
        },
        setValue: function(value, silent) {
            if(value == null) {
                value = this.options.initialValue;
            }
            if(value !== this.value) {
                if(this.value != null) {
                    this.buttons[this.value].attr('checked', false);
                }
                this.value = value;
                if(value != null) {
                    this.buttons[value].attr('checked', true);
                }
                if(!silent) {
                    this.trigger('change');
                }
            }
            return this;
        }
    });
});
