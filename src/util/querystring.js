define([], function() {
    var querystringCache, querystringCacheObject;
    return function(arg, defaultVal) {
        if (querystringCache !== window.location.search) {
            querystringCache = window.location.search;
            querystringCacheObject = {};

            var e,
                a = /\+/g,  // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) {return decodeURIComponent(s.replace(a," "));},
                q = window.location.search.substring(1);

            while ((e = r.exec(q))) {
                querystringCacheObject[d(e[1])] = d(e[2]);
            }
        }

        if (arg == null) {
            return querystringCacheObject;
        } else {
            return querystringCacheObject[arg] == null?
                defaultVal : querystringCacheObject[arg];
        }
    };

});
