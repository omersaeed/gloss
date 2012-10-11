define([
    'vendor/underscore'
], function(_) {
    var SEP = '/';

    var path = {
        normalize: function(p) {
            return (p.charAt(0) === SEP? '/' : '') +

                _.reduce(_.compact(p.split(SEP)), function(memo, d, i) {
                    return memo.length > 0 && d === '..'?
                        memo.slice(0, -1) : memo.concat(d);
                }, []).join(SEP) +

                (p.substr(-1) === SEP? '/' : '');
        },

        join: function(p1, p2) {
            return path.normalize(p1 + '/' + p2);
        }
    };

    return path;
});
