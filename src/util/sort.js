define([
    'vendor/underscore'
], function(_) {
    return {
        // this function is a comparator intended to be passed to Array#sort()
        //
        // it sorts in a user-friendly, special-character aware, alphabetical
        // manner, so that you get something like this:
        //
        //     abc
        //     "def"
        //     ghi
        //
        // instead of this:
        //
        //     abc
        //     ghi
        //     "def"
        //
        userFriendly: function(a, b) {
            var normA, normB;
            if (!_.isNumber(a) || !_.isNumber(b)) {
                normA = a.toString().replace(/^\W+/, '').replace(/\W+$/, '');
                normB = b.toString().replace(/^\W+/, '').replace(/\W+$/, '');
            }
            return ((normA < normB) ? -1 : ((normA > normB) ? 1 : 0));
        }
    };
});
