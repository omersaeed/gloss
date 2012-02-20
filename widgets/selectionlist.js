define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget',
    'text!vendor/gloss/widgets/selectionlist/selectionlist.html',
    'link!vendor/gloss/widgets/selectionlist/selectionlist.css',
    'link!css/widgets/selectionlist.css'
], function($, Widget, html) {
    return Widget.extend({
        defaults: {
            delayed: false,
            fields: {id: 'id', name: 'name', title: 'title'},
            filtering: true,
            generator: null,
            paging: true,
            pageSize: 25,
            pageSizes: [25, 50, 75, 100]
        },
        create: function() {
            var self = this;
            self.disabled = {};
            self.items = [];
            self.offset = 0;
            self.page = 1;
            self.pages = 0;
            self.query = null;
            self.selections = [];
            self.total = 0;

            self.$node.addClass('selectionlist');
            $(html).appendTo(self.$node);

            self.$pager = self.$node.find('.pager');
            self.$pager.on('click', 'li', function(event) {
                self._toggleSelection($(this));
            });

            self.$header = self.$node.find('.header');
            if(self.options.filtering) {
                self.$filter = self.$header.find('input');
            } else {
                self.$header.hide();
            }

            self.$controls = self.$node.find('.controls');
            if(self.options.paging) {
                self.$currentPage = self.$node.find('.current-page input');
                self.$totalPages = self.$node.find('.total-pages');

                self.$pageSize = self.$node.find('.page-size-selector');
                $.each(self.options.pageSizes, function(i, size) {
                    self.$pageSize.append($('<option>').attr('value', size).text(size));
                });
                
                self.$pageSize.val(self.options.pageSize);
                self.$pageSize.change(function(event) {
                    self.options.pageSize = Number($(this).val());
                    self.refresh(true);
                });

                self.$currentPage.focus(function(event) {
                    $(this).select();
                });
                self.$currentPage.keydown(function(event) {
                    var node = $(this);
                    if(event.which == 13) {
                        node.blur;
                        self.jump(node.val());
                    }
                });

                self.$node.find('.first-page').click(function(event) {
                    self.jump(1);
                });
                self.$node.find('.prev-page').click(function(event) {
                    self.jump(self.page - 1);
                });
                self.$node.find('.next-page').click(function(event) {
                    self.jump(self.page + 1);
                });
                self.$node.find('.last-page').click(function(event) {
                    self.jump(self.pages);
                });
            } else {
                self.$controls.hide()
            }

            self.$loading = $('<div>loading...</div>').hide().addClass('widget-loading');
            self.$node.find('.pager-container').append(self.$loading);

            self.resize();
            if(!self.options.delayed) {
                self.refresh();
            }
        },
        add: function(items) {
            var self = this, offset = this.offset, limit = this.options.pageSize;
            if(!$.isArray(items)) {
                items = [items];
            }
            $.each(items, function(i, item) {
                var idx = self.items.push(item) - 1;
                if(self.options.paging) {
                    if(idx >= offset && idx < offset + limit) {
                        self._updateNode(self.$pager.find('li').eq(idx - offset), item);
                    }
                } else {
                    self._updateNode(self.$pager.find('li').eq(idx), item);
                }
            });
            self.$node.trigger('change');
            return this;
        },
        clear: function() {
            this.refresh(true);
            return this;
        },
        clearSelections: function() {
            this.selections = [];
            this.$pager.find('li').each(function(i, node) {
                $(node).data('selected', false).removeClass('selected');
            });
            return this;
        },
        getItems: function() {
            return this.items;
        },
        getSelections: function() {
            return this.selections;
        },
        jump: function(page) {
            if(this.page != page && page >= 1 && page <= this.pages) {
                this.page = page;
                this.refresh();
            } else {
                this.$currentPage.val(this.page);
            }
            return this;
        },
        replace: function(items) {
            this.refresh(true);
            if(items != null) {
                this.add(items);
            }
            return this;
        },
        refresh: function(reset) {
            var self = this, paging = this.options.paging;
            if(reset) {
                self.reset();
            }
            self._load().done(function(total) {
                var i = 0, offset = self.offset, limit = self.options.pageSize;
                if(self.total != total) {
                    self.total = total;
                    if(paging) {
                        self.pages = Math.ceil(self.total / limit);
                        self.$totalPages.text(self.pages);
                    }
                }
                if(paging) {
                    self.$currentPage.val(self.page);
                }
                self.clearSelections();
                self.$pager.find('li').each(function(_, node) {
                    node = $(node);
                    if(i < limit) {
                        var item = self.items[offset + i];
                        if(item) {
                            self._updateNode(node, item);
                        } else {
                            node.data('item', null).hide();
                        }
                    } else {
                        node.data('item', null).hide();
                    }
                    i++;
                });
                for(; i < limit; i++) {
                    var item = self.items[offset + i];
                    if(item) {
                        self._updateNode(null, item);
                    } else {
                        break;
                    }
                }
                self.$pager.css('visibility', 'visible').scrollTop(0);
            });
            return this;
        },
        remove: function(items) {
            var self = this, options = this.options;
            if(!$.isArray(items)) {
                items = [items];
            }
            $.each(items, function(i, item) {
                var id = item[options.fields.id];
                for(var idx = 0; idx < self.items.length; idx++) {
                    if(self.items[idx][options.fields.id] === id) {
                        self.items.splice(idx, 1);
                        if(options.paging) {
                            // not implemented
                        } else {
                            self.$pager.find('li').eq(idx).detach();
                        }
                    }
                }
            });
            self.$node.trigger('change');
            return this;
        },
        reset: function() {
            this.disabled = [];
            this.items = [];
            this.offset = 0;
            this.page = 1;
            this.pages = 0;
            this.total = 0;
        },
        resize: function() {
            var height = this.$node.height();
            if(this.options.filtering) {
                height -= this.$header.outerHeight();
            }
            if(this.options.paging) {
                height -= this.$controls.outerHeight();
            }
            this.$pager.height(height);
            if(this.options.filtering) {
                this.$filter.width(this.$header.width() - 40);
            }
            return this;
        },
        toggle: function(items, disabled) {
            var self = this, field = this.options.fields.id, ids = [];
            if(!$.isArray(items)) {
                items = [items];
            }
            $.each(items, function(i, item) {
                var id = item[field];
                if(id && (self.disabled[id] ? !disabled : disabled)) {
                    self.disabled[id] = disabled;
                    ids.push(id);
                }
            });
            if(ids.length >= 1) {
                var item, id;
                self.$pager.find('li').each(function(i, node) {
                    item = $(node).data('item');
                    if(item) {
                        id = item[field];
                        if($.inArray(id, ids) >= 0) {
                            if(self.disabled[id]) {
                                $(node).data('disabled', true).addClass('disabled');
                            } else {
                                $(node).data('disabled', false).removeClass('disabled');
                            }
                        }
                    } else {
                        return false;
                    }
                });
            }
            return this;
        },
        _load: function() {
            var self = this, limit = this.options.pageSize, deferred;
            if(self.options.paging) {
                self.offset = limit * (self.page - 1);
            } else {
                self.offset = 0;
            }

            deferred = $.Deferred();
            if(self.options.generator) {
                if(self.items[self.offset]) {
                    return deferred.resolve(self.total);
                } else {
                    self._toggleLoading(true);
                    self.options.generator({
                        query: self.query,
                        offset: self.offset,
                        limit: limit
                    }).done(function(total, items) {
                        var container = self.items, offset = self.offset;
                        $.each(items, function(i, item) {
                            container[offset + i] = item;
                        });
                        self._toggleLoading(false);
                        deferred.resolve(total);
                    });
                    return deferred;
                }
            } else {
                return deferred.resolve(self.items.length);
            }
        },
        _toggleLoading: function(loading) {
            if(loading) {
                this.$pager.css('visibility', 'hidden');
                this.$loading.show();
            } else {
                this.$loading.hide();
            }
        },
        _toggleSelection: function(node) {
            var item = node.data('item');
            if(node.data('disabled')) {
                return;
            }
            if(node.data('selected')) {
                node.data('selected', false).removeClass('selected');
                this.selections.splice($.inArray(item, this.selections), 1);
                this.$node.trigger('select', item);
            } else {
                node.data('selected', true).addClass('selected');
                this.selections.push(item);
                this.$node.trigger('deselect', item);
            }
        },
        _updateNode: function(node, item) {
            if(!(node && node.length)) {
                node = $('<li>').hide().appendTo(this.$pager);
            }
            node.data('item', item).html(item[this.options.fields.name])
                .attr('title', item[this.options.fields.title] || '');

            var id = item[this.options.fields.id];
            if(id && this.disabled[id]) {
                node.data('disabled', true).addClass('disabled');
            } else {
                node.data('disabled', false).removeClass('disabled');
            }
            node.show();
        }
    });
});
