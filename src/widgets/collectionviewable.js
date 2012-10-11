define([
    'vendor/underscore'
], function(_) {
    return {
        defaults: {
            collection: undefined,
            collectionLoadArgs: null,
            collectionMap: function(models) {return models;}
        },
        _updateCollection: function() {
            var self = this,
                state = self._collectionViewableState,
                options = self.options,
                collection = options.collection,
                collectionMap = options.collectionMap;

            if(typeof collection !== 'undefined') {
                if (self.disable) {
                    state._disabledForLoad = true;
                    self.disable();
                }
                if (collection) {
                    collection.load(options.collectionLoadArgs).done(function() {
                        var startingValue = _.isFunction(self.getValue)?
                            self.getValue() : null;

                        state._loadResolved = true;

                        self.set('models',
                            collectionMap.call(self, collection.currentPage()));
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
                } else {
                    self.set('models', []);
                }
            }
        },

        _onCollectionViewableUpdate: function(evtName, theCollection) {
            var self = this,
                state = self._collectionViewableState,
                options = self.options,
                collection = self.options.collection,
                collectionMap = options.collectionMap;
            if ((state._loadResolved && state._updateFired) ||
                !state._loadResolved) {
                self.set('models',
                    collectionMap.call(self, collection.currentPage()));
                if (state._disabledForLoad) {
                    state._disabledForLoad = null;
                    if (self.enable) {
                        self.enable();
                    }
                }
            }
            state._updateFired = true;
        },

        __updateWidget__: function(updated) {
            var self = this, state,
                options = self.options,
                collection = options.collection,
                collectionMap = options.collectionMap;

            self._collectionViewableState = self._collectionViewableState || {};
            state = self._collectionViewableState;

            // if (!state.updatedCallbackWasBound && self.options.bindAll) {
            //     self._onCollectionViewableUpdate =
            //         _.bind(self._onCollectionViewableUpdate, self);
            //     state.updatedCallbackWasBound = true;
            // }

            if (updated.collection) {

                // first the cleanup
                if (self._collectionViewableLast) {
                    self._collectionViewableLast.off('update',
                            self._onCollectionViewableUpdate);
                }
                self._collectionViewableLast = collection;

                self._updateCollection();
                if(collection) {
                    // Add listener on the collection to handle further updates
                    collection.on('update', self._onCollectionViewableUpdate, self);
                }
            } else if (updated.collectionLoadArgs && options.collectionLoadArgs) {
                self._updateCollection();
            }
        }
    };
});
