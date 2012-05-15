define([
    'component!vendor:jquery',
    './formwidget'
], function($, FormWidget) {
    return FormWidget.extend({
        create: function() {
            var self = this;
            self._super();

            self.changed = false;
            self.focused = false;
            self.widgets = {};

            self.on('change', '*', function(event) {
                if(self.focused) {
                    self.changed = true;
                    event.stopPropagation();
                }
            });
            self.on('focusin', function(event) {
                self.focused = true;
            });
            self.on('focusout', function(event) {
                setTimeout(function() {
                    if($(document.activeElement).closest(self.node).length === 0) {
                        self.focused = false;
                        if(self.changed) {
                            self.trigger('change');
                            self.changed = false;
                        }
                    }
                }, 0);
            });
        },
        getValue: function() {
            var value = {};
            $.each(this.widgets, function(name, widget) {
                value[name] = widget.getValue();
            });
            return value;
        },
        setValue: function(value, silent) {
            var widgets = this.widgets;
            $.each(value, function(name, subvalue) {
                widgets[name].setValue(subvalue, true);
            });
            if(!silent) {
                this.trigger('change');
            }
            return this;
        }
    });
});
