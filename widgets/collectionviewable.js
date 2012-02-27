define([
    'vendor/underscore'
], function(_) {
    return {
        defaults: {
            collection: null,
            collectionLoadArgs: null
        },
        __updateWidget__: function(updated) {
            var self = this, options = self.options, collection = options.collection;
            if (updated.collection) {
                collection.load(options.collectionLoadArgs).done(function() {
                    self.set('models', collection.models);

                    // handle any future updates
                    collection.on('update', function(evtName, collection) {
                        self.set('models', collection.models);
                    });
                });
            }
        }
    };
});
