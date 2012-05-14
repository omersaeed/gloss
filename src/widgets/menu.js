define([
    'component!vendor:jquery',
    './basemenu',
    'css!./menu/menu.css'
], function($, BaseMenu) {
    return BaseMenu.extend({
        defaults: {
            animation: null,
            entries: null,
            position: null,
            width: null,
            updateDisplay: true
        },
        create: function() {
            var self = this;
            self._super();
            
            self.$node.addClass('menu').hide();
            self.$entries = $('<ul>').appendTo(self.$node);

            self.$node.on('click', 'li', function(event) {
                self.select($(this).data('entry'));
                return false;
            });
        },
        select: function(entry) {
            if(this.options.updateDisplay){
                this.hide();
            }
            this.triggerHandler('select', entry);
            if(entry.onselect){
                entry.onselect(entry);
            }
        },
        _constructMenu: function() {
            var self = this, entries = this.options.entries;
            if (entries == null || entries.length === 0) {
                self.constructed = false;
                return;
            }

            self.$entries.empty();
            $.each(entries, function(i, entry) {
                var $node = $('<li>').html(entry.content).data('entry', entry).attr('tabindex', -1);
                if (entry.classes != null) {
                    $node.addClass(entry.classes);
                }
                if (entry.title) {
                    $node.attr('title', entry.title);
                }
                self.$entries.append($node);
            });

            self.$entries.find('li').first().addClass('first');
            self.$entries.find('li').last().addClass('last');
            self.constructed = true;
        }
    });
});
