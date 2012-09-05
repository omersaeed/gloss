/*
 * Format:
 *
 *  Empty node:
 *
 *      ToggleGroup(undefined, {
 *          items: [
 *               {value: 'one', text: 'One'},
 *               {value: 'two', text: 'Two'},
 *               {value: 'three', text: 'Three'},
 *               {value: 'four', text: 'Four'}
 *           ],
 *          initialValue: 'two'
 *      });
 *
 *  Non-Empty node:
 *
 *      $node = <div class=togglegroup>
 *                  <button value=val0>Value 0</button>
 *                  <button value=val1>Value 1</button>
 *              </div>
 *
 *      ToggleGroup($node);
 *

 */

define([
    'vendor/jquery',
    'vendor/underscore',
    './formwidget',
    './button',
    'tmpl!./togglegroup/togglegroup.mtpl'
], function($, _, FormWidget, Button, tmpl) {

    return FormWidget.extend({
        defaults: {
            items: null,         // list of the format: [
                                //  {value: '...', text: '...'},
                                //  {value: '...', text: '...'},
                                //  ...
                                // ]
            initialValue: null
        },
        create: function() {
            var self = this;

            self._super();

            if(self.options.items !== null) {
                self.$node.append($(tmpl(self.options.items)));
            }

            self.buttons = self.$node.children().map(function(i, el) {
                return Button(el).on('click', function(evt) {
                    self.setValue(self.buttons[i].getValue());
                });
            });

            _.first(self.buttons).$node.addClass('first');
            _.last(self.buttons).$node.addClass('last');

            self.$node.addClass('togglegroup');

            if(self.options.initialValue != null) {
                self.setValue(self.options.initialValue, true);
            } else {
                _.every(self.buttons, function(button) {
                    if (button.$node.attr('checked')) {
                        return !self.setValue(button.getValue()); // break
                    }
                    return true; // continue loop until we find checked btn
                });
            }

            self.on('mouseover', 'button', function() {
                $(this).prev().addClass('left-of-hover');
            }).on('mouseout', 'button', function() {
                $(this).prev().removeClass('left-of-hover');
            });
        },
        _enable: function(enable, which) {
            _.each(this.buttons, function(button) {
                if (which[button.getValue()]) {
                    button[enable? 'enable' : 'disable']();
                }
            });
            return this;
        },
        enable: function(which) {
            return which == null? this._super() : this._enable(true, which);
        },
        disable: function(which) {
            return which == null? this._super() : this._enable(false, which);
        },
        getValue: function() {
            var button = _.find(this.buttons, function(button) {
                return button.$node.prop('checked');
            });
            return button? button.getValue() : null;
        },
        setValue: function(value, silent) {
            var changed = false;
            _.each(this.buttons, function(button) {
                var checked = button.$node.prop('checked'),
                    valueFound = button.getValue() === value,
                    method = valueFound? 'addClass' : 'removeClass';
                changed = !!checked !== !!valueFound? true : changed;
                button.$node.prop('checked', valueFound)[method]('checked');
            });

            if (!silent && changed) {
                this.trigger('change');
            }

            return this;
        }
    });
});
