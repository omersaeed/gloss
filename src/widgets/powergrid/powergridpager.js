define([
    'vendor/jquery',
    './../widgetgroup',
    'tmpl!./powergridpager/powergridpager.mtpl',
    'css!./powergridpager/powergridpager.css'
], function ($, WidgetGroup, template) {

    var PowerGridPager = WidgetGroup.extend({
        defaults:{
            collection: undefined,
            paging: true,
            pageSize: 25,
            pageSizes: [25, 50, 75, 100]
        },
        nodeTemplate: template,

        create: function() {
            var self = this;

            self.offset = 0;
            self.page = 1;
            self.pages = 0;
            self.total = 0;

            self.$pageSize = self.$node.find('.page-size-selector');
            $.each(self.options.pageSizes, function(i, size) {
                self.$pageSize.append($('<option>').attr('value', size).text(size));
            });
            self.$currentPage = self.$node.find('.current-page input');
            self.$totalPages = self.$node.find('.total-pages');

            self.$pageSize.val(self.options.pageSize);
            self.$pageSize.change(function(event) {
                self.options.pageSize = Number($(this).val());
                self.refresh(true);
            });
            self.$node.on('focus', '.current-page input', function(event) {
                $(this).select();
            });
            self.$node.on('keydown', '.current-page input', function(event) {
                var node = $(this);
                if(event.which == 13) {
                    node.blur();
                    self.jump(node.val());
                }
            });

            self.$node.on('click', '.first-page', function(event) {
                self.jump(1);
            });
            self.$node.on('click', '.prev-page', function(event) {
                self.jump(self.page - 1);
            });
            self.$node.on('click', '.next-page', function(event) {
                self.jump(self.page + 1);
            });
            self.$node.on('click', '.last-page', function(event) {
                self.jump(self.pages);
            });

            _.bindAll(this, '_onCollectionUpdate');
            if(self.options.collection) {
                self.options.collection.load().done(function(models) {
                    self._updatePagerBar(models);
                    self.refresh();
                    self.options.collection.on('update', self._onCollectionUpdate);
                });
            }
        },

        jump: function(page) {
            if(this.page != page && page >= 1 && page <= this.pages) {
                this.page = parseInt(page, 10);
                this.refresh();
            } else {
                this.$currentPage.val(this.page);
            }
            return this;
        },

        refresh: function(reset) {
            var self = this,
                limit = self.options.pageSize,
                collection = self.options.collection;

            if(reset) {
                self._reset();
            }
            self.$currentPage.val(self.page);
            self.offset = limit * (self.page - 1);

            if (!collection) return;
            collection.query.params.limit = limit;
            collection.query.params.offset = self.offset;
            collection.trigger('update', collection);

            return this;
        },

        _reset: function() {
            this.offset = 0;
            this.page = 1;
            this.pages = 0;
            this.total = 0;
        },

        _updatePagerBar: function(models) {
            var self = this,
                limit = self.options.pageSize,
                total = models.length;

            if(self.total != total) {
                self.total = total;
                self.pages = Math.ceil(self.total / limit);
                self.$totalPages.text(self.pages);
                if (self.pages < self.page) {
                    self.jump(1);
                }
            }
            self._initPagerBar = true;
        },

        _onCollectionUpdate: function() {
            var self = this,
                collection = self.options.collection;
            if (!collection) return;
            collection.load().done(function(models) {
                self._updatePagerBar(models);
            });
        },

        updateWidget: function(updated) {
            var state, self = this,
                options = self.options,
                collection = options.collection;

            if (updated.collection && typeof collection !== 'undefined') {
                if (!collection) {
                    collection.off('update', self._onCollectionUpdate);
                    return;
                }

                collection.load().done(function(models) {
                    self.refresh(true);
                    if (!self._initPagerBar) {
                        self._updatePagerBar(models);
                    }
                });
                collection.on('update', self._onCollectionUpdate);
            }
        }
    });

    return PowerGridPager;
});
