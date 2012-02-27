define([
    'vendor/underscore'
], function(_) {
    return {
        defaults: {
            collection: null,
            collectionLoadArgs: null
        },
        __updateWidget__: function(updated) {
            var self = this, startingValue,
                options = self.options,
                collection = options.collection;
            if (updated.collection) {
                if (!self._collectionHasLoadedOnce) {
                    startingValue = self.getValue();
                }
                if (self.disable) {
                    self.disable();
                }
                collection.load(options.collectionLoadArgs).done(function() {
                    var hasStartingValue = false;
                    self.set('models', collection.models);
                    if (!self._collectionHasLoadedOnce) {
                        self.setValue(startingValue);
                    }
                    self._collectionHasLoadedOnce = true;
                    if (self.enable) {
                        self.enable();
                    }

                    // handle any future updates
                    collection.on('update', function(evtName, collection) {
                        self.set('models', collection.models);
                    });
                });
            }
        }
    };
});
