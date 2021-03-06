define([
    'vendor/underscore',
    './collectionviewable'
], function(_, CollectionViewable) {
    return function() {
        this._updateCollection = CollectionViewable._updateCollection;
        this._onCollectionViewableUpdate =
            CollectionViewable._onCollectionViewableUpdate;

        this.update = _.wrap(this.update, function(func) {
            var rest = Array.prototype.slice.call(arguments, 1),
                ret = func.apply(this, rest);
            CollectionViewable.__updateWidget__.apply(this, rest);
            return ret;
        });

        this.defaults = _.extend({}, CollectionViewable.defaults, this.defaults);
    };
});
