define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/formwidget',
    'vendor/gloss/widgets/menu'
], function($, _, Widget, FormWidget, Menu) {
    return FormWidget.extend({
        defaults: {
            entries: null,              // list of the format: [
                                        //  {content: '...', value: '...'},
                                        //  {content: '...', value: '...'},
                                        //  ...
                                        // ]
            collection: null,           // collection object to populate entries
            translator: function() { }, // function to translate the collection
                                        // into the same format as the
                                        // 'entries' option
            collectionLoadArgs: {all: true}
        },
        create: function() {
            var self = this, options = this.options;
            this._super();

            self.entry = null;
            self.opened = false;
            self.populated = false;

            self.$node.addClass('selectbox').empty();
            if(self.$node.attr('tabindex') == null) {
                self.$node.attr('tabindex', 0);
            }
            self.$text = $('<span>').appendTo(self.$node);

            self.$menu = $('<div>').hide().appendTo(self.$node);
            self.menu = Menu(self.$menu, {
                position: {my: 'left top', at: 'left bottom', of: self.$node},
                width: self,
                updateDisplay: false,
                onselect: function(event, entry) {
                    self.toggle(false);
                    if(self.entry != null && entry.value !== self.entry.value) {
                        self.setValue(entry.value);
                    }
                }
            });
            
            if (options.collection) {
                options.collection.on('update', function(evtName, collection) {
                    var newEntries = options.translator?
                        _.map(collection.models, options.translator) : collection.models;
                    self.set('entries', newEntries);
                });
            }

            self.update();
            self.on('click', self.toggle);
            self.on('keydown', self.onKeyEvent);
        },
        getValue: function() {
            if(this.entry != null) {
                return this.entry.value;
            } else if (/select/i.test(this.$node[0].tagName)) {
                return this.$node.val();
            } else {
                return null;
            }
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
                if (/select/i.test(this.$node[0].tagName)) {
                    this.$node.val(value);
                }
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
            var $node = this.$node, options = this.options;

            if (updated.collection && options.collection) {
                options.collection.load(options.collectionLoadArgs);
            }

            this.toggle(false);

            if(options.entries != null && options.entries.length > 0) {
                this.populated = true;
            } else {
                this.populated = false;
                return;
            }

            $node.width(Widget.measureMinimumWidth($('<div/>').addClass($node.attr('class')),
                _.pluck(options.entries, 'content')) + 6);

            if(options.initialValue != null) {
                this.setValue(options.initialValue, true);
            }
            if(this.entry == null) {
                this.entry = options.entries[0];
                this.$text.html(this.entry.content);
            }
            this.menu.set('entries', options.entries);
        }
    });
});
