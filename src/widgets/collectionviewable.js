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
            var state, self = this,
                options = self.options,
                collection = options.collection,
                collectionMap = options.collectionMap;

            self._collectionViewableState = self._collectionViewableState || {};
            state = self._collectionViewableState;
            if(typeof collection !== 'undefined') {
                if (self.disable) {
                    self.disable();
                }
                if (collection) {
                    collection.load(options.collectionLoadArgs).done(function() {
                        var startingValue = _.isFunction(self.getValue)?
                            self.getValue() : null;

                        state._loadResolved = true;

                        self.set('models', collectionMap(collection.currentPage()));
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
                            self.set('models', collectionMap(collection.currentPage()));
                        }
                        state._updateFired = true;
                    });

                } else {
                    self.set('models', []);
                }
            }
        },
        __updateWidget__: function(updated) {
            var self = this,
                options = self.options;
            if (updated.collection) {
                self._updateCollection();
            }
            if (updated.collectionLoadArgs && options.collectionLoadArgs) {
                self._updateCollection();
            }
        }
    };
});
