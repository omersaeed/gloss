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
            if (!_.isNumber(a) || !_.isNumber(b)) {
                a = a.toString().replace(/^\W+/, '').replace(/\W+$/, '');
                b = b.toString().replace(/^\W+/, '').replace(/\W+$/, '');
            }
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        }
    };
});
