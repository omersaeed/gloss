define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget',
    'path!gloss:css!widgets/toggleframe/toggleframe.css'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            initialButton: 0
        },
        create: function() {
            var self = this;
            self.toggleButtons = {};

            self.$node.addClass('toggleframe');
            self.$toggleButtons = $('<div>').addClass('togglebuttons');
            self.$node.find('.togglebuttons').children().each(function(i, element) {
                var li = $(element), toggle;
                toggle = {
                    button: $('<button>').text(li.text()).data('idx', i).appendTo(self.$toggleButtons),
                    idx: i,
                    name: li.text()
                };
                self.toggleButtons[toggle.name] = self.toggleButtons[i] = toggle;
                self.length = i+1;
            });
            self.$buttons = self.$toggleButtons.find('button');
            self.$node.find('ul.togglebuttons').replaceWith(self.$toggleButtons);
            self.$toggleButtons.find('button').first().addClass('first');
            self.$toggleButtons.find('button').last().addClass('last');

            self.$toggleButtons.on('click', 'button', function(event) {
                self.toggle($(this).data('idx'));
            });

            self.idx = null;
            self.toggle(self.options.initialButton);
        },
        toggle: function(idx) {
            var self = this, current = this.toggleButtons[this.idx],
                target = this.toggleButtons[idx];

            if(target == null || target.idx === this.idx) {
                return;
            }

            if(current != null) {
                current.button.removeClass('selected');
            }
            target.button.addClass('selected');

            self.idx = target.idx;
            self.trigger('toggle', self);
        }
    });
});
