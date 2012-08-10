define([
    'vendor/jquery',
    'tmpl!./collectionpageable/collectionpageable.mtpl',
    'css!./collectionpageable/collectionpageable.css'
], function ($, template) {

    var generator = function(collection, options) {
        var deferred = $.Deferred(),
            query = {offset: options.offset, limit: options.limit};

        collection.load(query).done(function(results) {
            deferred.resolve(collection.total, results);
        });
        return deferred;
    };

    return {
        defaults:{
            collection: undefined,
            collectionLoadArgs: null,
            collectionMap: function(models) {return models;},
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
            var self = this, paging = self.options.paging;
            if(reset) {
                self.reset();
            }
            if (self.disable) {
                self.disable();
            }
            self._load().done(function(total) {
                var limit = self.options.pageSize;
                if(self.total != total) {
                    self.total = total;
                    self.pages = Math.ceil(self.total / limit);
                    self.$totalPages.text(self.pages);
                }
                self.$currentPage.val(self.page);
                if (self.enable) {
                    self.enable();
                }
            });
            return this;
        },

        reset: function() {
            this.offset = 0;
            this.page = 1;
            this.pages = 0;
            this.total = 0;
        },

        _load: function() {
            var self = this,
                limit = self.options.pageSize,
                collection = self.options.collection,
                collectionMap = self.options.collectionMap,
                collectionLoadArgs = self.options.collectionLoadArgs,
                deferred, loadOptions, state;

            self._collectionViewableState = self._collectionViewableState || {};
            state = self._collectionViewableState;

            self.offset = limit * (self.page - 1);
            loadOptions = $.extend(
                true,
                {
                    offset: self.offset,
                    limit: limit
                },
                collectionLoadArgs
            );

            deferred = $.Deferred();
            if(!collection) {
                self.set('models', []);
                return deferred.resolve(self.total);
            }

            generator(collection, loadOptions).done(function(total, items) {
                var startingValue = _.isFunction(self.getValue)?
                    self.getValue() : null;

                state._loadResolved = true;

                self.set('models', collectionMap(items));
                _.each(self.options.entries, function(entry) {
                    // use type coercion in case it's an int
                    if (_.isFunction(self.setValue) && entry.value == startingValue) {
                        self.setValue(startingValue);
                    }
                });
                deferred.resolve(total);
            });

            return deferred;
        },

        __updateWidget__: function(updated) {
            var state, self = this,
                options = self.options,
                collection = options.collection,
                collectionMap = options.collectionMap;
            self._collectionViewableState = self._collectionViewableState || {};
            state = self._collectionViewableState;
            if (updated.collection && typeof collection !== 'undefined') {
                if(options.paging) {
                    if(!collection || !this._init) {
                        return;
                    }
                    self.refresh();

                    // Add listener on the collection to handle further updates
                    collection.on('update', function(evtName, theCollection) {
                        if ((state._loadResolved && state._updateFired) ||
                            !state._loadResolved) {
                                self.refresh();
                        }
                        state._updateFired = true;
                    });
                    return;
                }

                // basic collection viewable functionality
                if (self.disable) {
                    self.disable();
                }
                if (collection) {
                    collection.load(options.collectionLoadArgs).done(function() {
                        var startingValue = _.isFunction(self.getValue)?
                            self.getValue() : null;

                        state._loadResolved = true;

                        self.set('models', collectionMap(collection.models));
                        _.each(self.options.entries, function(entry) {
                            // use type coercion in case it's an int
                            if (_.isFunction(self.setValue) && entry.value == startingValue) {
                                self.setValue(startingValue);
                            }
                        });
                        if (self.enable) {
                            self.enable();
                        }
                    });

                    // Add listener on the collection to handle further updates
                    collection.on('update', function(evtName, theCollection) {
                        if ((state._loadResolved && state._updateFired) ||
                            !state._loadResolved) {
                            self.set('models', collectionMap(collection.models));
                        }
                        state._updateFired = true;
                    });

                } else {
                    self.set('models', []);
                }
            }
        }
    };
});