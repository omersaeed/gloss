define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    './formwidget',
    './collectionviewable',
    './menu',
    'css!./selectbox/selectbox.css'
], function($, _, Widget, FormWidget, CollectionViewable, Menu) {
    return FormWidget.extend({
        defaults: {
            entries: null,              // list of the format: [
                                        //  {content: '...', value: '...'},
                                        //  {content: '...', value: '...'},
                                        //  ...
                                        // ]

            translator: function(item) {
                return {value: item.id, content: item.name, title: item.name};
            },

            // optionally set fixed width
            width: null
        },
        create: function() {
            var self = this, options = self.options, $replacement;
            this._super();

            self.entry = null;
            self.opened = false;

            if (options.entries == null) {
                self.$node.children().each(function(i, el) {
                    var $el = $(el),
                        entries = options.entries = options.entries || [];
                    entries.push({content: $el.text(), value: $el.val()});
                    if ($el.is(':selected')) {
                        self.entry = _.last(entries);
                    }
                });
            }

            if (self.node.tagName.toLowerCase() === 'select') {
                self.$node.replaceWith($replacement = $('<div></div>'));
                $replacement
                    .attr('name', self.$node.attr('name'))
                    .attr('id', self.$node.attr('id'));
                self.node = (self.$node = $replacement)[0];
            } else {
                self.$node.empty();
            }
            self.$node.addClass('selectbox');

            if (self.$node.attr('tabindex') == null) {
                self.$node.attr('tabindex', 0);
            }
            self.$node.append('<span class=arrow>&#x25bc;</span>');
            self.$text = $('<span class=content>')
                .html(self.entry? self.entry.content : '')
                .appendTo(self.$node);

            self.$menu = $('<div>').hide().appendTo(self.$node);
            self.menu = Menu(self.$menu, {
                position: {my: 'left top', at: 'left bottom', of: self.$node},
                width: self,
                updateDisplay: false,
                onselect: function(event, entry) {
                    self.toggle(false);
                    if (self.entry == null || entry.value !== self.entry.value) {
                        self.setValue(entry.value);
                    }
                }
            });
            
            self.update();
            self.on('click', self.toggle);
            self.on('keydown', self.onKeyEvent);
        },
        _setAutoWidth: function() {
            var w, $test = $('<div/>').addClass(this.$node.attr('class')),
                contents = _.pluck(this.options.entries, 'content');
            w = Widget.measureMinimumWidth($test, contents);
            this.$node.css({width: ''}).find('.content').width(w);
        },
        getValue: function() {
            return this.entry != null? this.entry.value : null;
        },
        onKeyEvent: function(event) {
            var key = Widget.identifyKeyEvent(event),
                offset = _.indexOf(this.options.entries, this.entry);
            if(key === 'up' && offset > 0) {
                if(this.open) {

                } else {
                    
                }
            } else if(key === 'down' && offset < (this.options.entries.length - 1)) {

            }
        },
        setValue: function(value, silent) {
            if(this.options.entries == null) {
                return this;
            }
            if(!$.isPlainObject(value)) {
                value = _.find(this.options.entries, function(entry) {
                    return entry.value === value;
                });
            }
            if(value != null) {
                this.entry = value;
                this.$text.html(this.entry.content);
                if(!silent) {
                    this.trigger('change');
                }
            }
            return this;
        },
        toggle: function(open) {
            var self = this;
            if(typeof open !== 'boolean') {
                open = !self.opened;
            }
            if(open && !self.opened && !self.state.disabled) {
                Widget.onPageClick(self.$node, function() {
                    self.toggle(false);
                });
                self.$node.addClass('open');
                self.menu.show();
                self.opened = true;
            } else if(!open && self.opened) {
                self.menu.hide();
                self.$node.removeClass('open');
                self.opened = false;
                self.node.focus();
            }
            return self;
        },
        updateWidget: function(updated) {
            var $node = this.$node, options = this.options, w;

            if (updated.initialValue && options.initialValue != null) {
                this.setValue(options.initialValue, true);
            }

            if (updated.models) {
                this.set('entries', _.map(options.models, options.translator));
            }

            if (updated.entries) {
                if (options.width == null) {
                    this._setAutoWidth();
                }

                this.menu.set('entries', options.entries);

                if (options.entries && options.entries.length) {
                    if (this.entry == null) {
                        this.setValue(options.entries[0]);
                    }
                } else {
                    this.setValue(null);
                }
            }

            if (updated.width) {
                if (options.width != null) {
                    $node.outerWidth(options.width)
                        .find('.content').css('width', '');
                } else {
                    this._setAutoWidth();
                }
            }

        }
    }, {mixins: [CollectionViewable]});
});
