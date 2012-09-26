// this widget (and corresponding styling) assumes the following html
// structure:
//
//     <div class=tabbedframe>
//
//       <div class=tabs>
//         <button>First Tab Title</button>
//         <button>Second Tab Title</button>
//         <!-- ... etc ... -->
//       </div>
//
//       <div class=panes>
//
//         <div>
//           <!-- content of first tab -->
//         </div>
//
//         <div>
//           <!-- content of secon tab -->
//         </div>
//
//         <!-- ... etc ... -->
//
//       </div>
//
//     </div>
//
// a couple things to note:
//
//  - the children of the `.tabs` element MUST each have a corresponding
//    element in `.panes`
//  - ANY child of `.tabs` is considered a tab, regardless of element type or
//    class. this is similarly true of `.panes`
//  - the `.tabs` and `.panes` elements do not need to be direct children of
//    `.tabbedframe`
//
define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    'css!./tabbedframe/tabbedframe.css'
], function($, _, Widget) {
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

            self.$tabs.on('click', 'button', function(evt) {
                if (!$(this).hasClass('disable')) {
                    self.open($(this).data('idx'));
                }
            });

            self.idx = null;
            self.open(self.options.initialPane);
        },
        _enable: function(which) {
            var self = this;
            _.each(_.range(self.length), function(i) {
                var tab = self.tabs[i];
                if (typeof which[i] !== 'undefined') {
                    if (which[i]) {
                        tab.button.removeClass('disable');
                    } else {
                        tab.button.addClass('disable');
                    }
                }
            });
            return this;
        },

        // 'which' is an object that has a true/false value for each of the tab
        // indices that are to be disabled. for example, if you'd like to
        // disable tabs 1 and 3:
        //
        //   myTabbedFrame.disable({1: true, 3: true});
        disable: function(which) {
            return this._enable(_.reduce(which, function(memo, val, index) {
                memo[index] = !val;
                return memo;
            }, {}));
        },

        enable: function(which) {
            return this._enable(which);
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
