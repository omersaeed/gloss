define([
    'vendor/jquery',
    'tmpl!./collectionpageable/collectionpageable.mtpl',
    'css!./collectionpageable/collectionpageable.css'
], function ($, template) {

    return {
        defaults:{
            collection: undefined,
            paging: true,
            pageSize: 25,
            pageSizes: [25, 50, 75, 100]
        },

        afterInit: function() {
            var self = this;

            self.$pageable = $(template());
            // wait for the node to be in the DOM so we can insert after the parent
            setTimeout(function () {
                self.$pageable.insertAfter(self.$node.parent());
            }, 100);

            self._init = true;
            self.offset = 0;
            self.page = 1;
            self.pages = 0;
            self.total = 0;

            self.$pageSize = self.$pageable.find('.page-size-selector');
            $.each(self.options.pageSizes, function(i, size) {
                self.$pageSize.append($('<option>').attr('value', size).text(size));
            });
            self.$firstPage = self.$pageable.find('.first-page');
            self.$prevPage = self.$pageable.find('.prev-page');
            self.$nextPage = self.$pageable.find('.next-page');
            self.$lastPage = self.$pageable.find('.last-page');
            self.$currentPage = self.$pageable.find('.current-page input');
            self.$totalPages = self.$pageable.find('.total-pages');

            self.$pageSize.val(self.options.pageSize);
            self.$pageSize.change(function(event) {
                self.options.pageSize = Number($(this).val());
                self.refresh(true);
            });
            self.$currentPage.on('focus', function(event) {
                $(this).select();
            });
            self.$currentPage.on('keydown', function(event) {
                var node = $(this);
                if(event.which == 13) {
                    node.blur();
                    self.jump(node.val());
                }
            });

            self.$pageable.find('.first-page').click(function(event) {
                self.jump(1);
            });
            self.$pageable.find('.prev-page').click(function(event) {
                self.jump(self.page - 1);
            });
            self.$pageable.find('.next-page').click(function(event) {
                self.jump(self.page + 1);
            });
            self.$pageable.find('.last-page').click(function(event) {
                self.jump(self.pages);
            });

            if(self.options.collection) {
                self.options.collection.load().done(function() {
                    var state = self._collectionViewableState;
                    state._updateFired = true;
                    self.refresh();
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

            if(!self._init) {
                return;
            }
            if(reset) {
                self._reset();
            }
            self.$currentPage.val(self.page);
            self.offset = limit * (self.page - 1);

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

        _updatePagerBar: function() {
            var self = this;//,
                options = self.options,
                collection = options.collection,
                limit = self.options.pageSize;

            
            collection.load().done(function(models) {
                var total = models.length;
                if(self.total != total) {
                    self.total = total;
                    self.pages = Math.ceil(self.total / limit);
                    self.$totalPages.text(self.pages);
                    if (self.pages < self.page) {
                        self.jump(1);
                    }
                }
            });
        },

        __updateWidget__: function(updated) {
            var state, self = this,
                options = self.options,
                collection = options.collection;

            if (updated.collection && typeof collection !== 'undefined') {
                if (!collection) {
                    return;
                }

                collection.load().done(function() {
                    self.refresh(true);
                });

                collection.on('update', function() {
                    self._updatePagerBar();
                });
            }
        }
    };
});
