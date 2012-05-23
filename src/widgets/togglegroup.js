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
    'component!vendor:jquery',
    './statefulwidget',
    './formwidget',
    './button',
    'tmpl!./togglegroup/togglegroup.mtpl'
], function($, StatefulWidget, FormWidget, Button, tmpl) {
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
            var self = this, $checked;
            self._super();

            if(self.options.items !== null) {
                self.$node.append($(tmpl(self.options.items)));
            }
            self.buttons = {};
            self.$buttons = self.$node.children();
            self.value = null;

            self.$node.addClass('togglegroup');
            self.$buttons.each(function(i, element) {
                var $button = Button($(element)).$node;
                self.buttons[$button.val()] = $button;
            });
            self.$buttons.first().addClass('first');
            self.$buttons.last().addClass('last');

            self.$buttons.on('click', function(event) {
                event.stopPropagation();
                self.setValue($(this).val());
            });
            if(self.options.initialValue != null) {
                self.setValue(self.options.initialValue, true);
            } else if (($checked = self.$buttons.filter('[checked]')).length) {
                self.setValue($checked.val());
            }
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
                    this.buttons[this.value].prop('checked', false);
                    this.buttons[this.value].removeClass('checked');
                }
                this.value = value;
                if(value != null) {
                    this.buttons[value].prop('checked', true);
                    this.buttons[this.value].addClass('checked');
                }
                if(!silent) {
                    this.trigger('change');
                }
            }
            return this;
        }
    });
});
