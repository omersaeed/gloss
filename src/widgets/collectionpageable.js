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
            self.refresh();
        },

        jump: function(page) {
            if(this.page != page && page >= 1 && page <= this.pages) {
                this.page = parseInt(page);
                this.refresh();
            } else {
                this.$currentPage.val(this.page);
            }
            return this;
        },

        refresh: function(reset) {
            var self = this,
                limit = self.options.pageSize;

            if(!self._init) {
                return;
            }
            if(reset) {
                self.reset();
            }
            self._updatePagerBar();
            self.offset = limit * (self.page - 1);
            self.set('collectionLoadArgs', {
                offset: self.offset,
                limit: limit
            });

            return this;
        },

        reset: function() {
            this.offset = 0;
            this.page = 1;
            this.pages = 0;
            this.total = 0;
        },

        _updatePagerBar: function() {
            var self = this,
                options = self.options,
                collection = options.collection,
                total = collection.total,
                limit = self.options.pageSize;

            if(self.total != total) {
                self.total = total;
                self.pages = Math.ceil(self.total / limit);
                self.$totalPages.text(self.pages);
            }
            self.$currentPage.val(self.page);
        },

        __updateWidget__: function(updated) {
            var state, self = this,
                options = self.options,
                collection = options.collection;

            self._collectionViewableState = self._collectionViewableState || {};
            state = self._collectionViewableState;

            if (updated.collection && typeof collection !== 'undefined') {
                if(!collection) {
                    return;
                }
                // Add listener on the collection to handle further updates
                collection.on('update', function(evtName, theCollection) {
                    if ((state._loadResolved && state._updateFired) ||
                        !state._loadResolved) {
                        self.refresh();
                    }
                    state._updateFired = true;
                });
            }
        }
    };
});