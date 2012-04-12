define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget',
    'path!gloss:link!widgets/tabbedframe/tabbedframe.css'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            initialPane: 0
        },
        create: function() {
            var self = this;
            self.tabs = {};

            self.$node.addClass('tabbedframe');
            self.$panes = self.$node.find('.panes');

            if (self.$panes.children().length !==
                self.$node.find('.tabs').children().length) {
                throw new Error('number of tabs must match number of panes');
            }

            self.$tabs = $('<div>').addClass('tabs');
            self.$node.find('.tabs').children().each(function(i, element) {
                var li = $(element), pane = self.$panes.children().eq(i), tab;
                tab = {
                    button: $('<button>').text(li.text()).data('idx', i).appendTo(self.$tabs),
                    idx: i,
                    name: li.text(),
                    pane: pane,
                    widget: Widget.surrogate(pane)
                };
                tab.widget().hide();
                self.tabs[tab.name] = self.tabs[i] = tab;
                self.length = i+1;
            });
            self.$buttons = self.$tabs.find('button');

            self.$node.find('ul.tabs').replaceWith(self.$tabs);
            self.$tabs.find('button').first().addClass('first');
            self.$tabs.find('button').last().addClass('last');

            self.$tabs.on('click', 'button', function(event) {
                self.open($(this).data('idx'));
            });

            self.idx = null;
            self.open(self.options.initialPane);
        },
        open: function(idx) {
            var self = this, current = this.tabs[this.idx], target = this.tabs[idx];
            if(target == null || target.idx === this.idx) {
                return;
            }

            self.$buttons.attr('disabled', true);
            if(current != null) {
                current.button.removeClass('selected');
                current.widget().hide();
            }

            target.widget().show();
            target.button.addClass('selected');
            self.$buttons.not(target.button).attr('disabled', false);

            self.idx = target.idx;
            self.trigger('open', self);
        },
        beforeShow: function() {
            var i, height, len = this.length, max = {height: 0, idx: 0};
            this.showIdx = this.idx;
            this.$panes.addClass('invisible').css({height: 'auto'});
            for (i = 0; i < len; i++) {
                this.open(i);
                height = this.$panes.height();
                max = height > max.height? {height: height, idx: i} : max;
            }
            this.open(max.idx);
            this.showHeight = max.height;
        },
        show: function() {
            if (this.showHeight != null) {
                this.$panes.height(this.showHeight);
            }
            this.$panes.removeClass('invisible');
            this.open(this.showIdx == null? this.idx : this.showIdx);
        }
    });
});
