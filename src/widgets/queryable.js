define([
    'vendor/jquery'
], function ($) {
    return {
        defaults: {
        },
        afterInit: function() {
            var self = this;
            self.currentDfd = [];
        },
        executeQuery: function(queryObj, queryParams) {
            var self = this,
                paramsCopy = $.extend(true, {}, queryParams),
                dfd;

            dfd = queryObj.query(paramsCopy).execute().pipe(
                //Filter Success
                function(value) {
                    if(dfd !== self.currentDfd[self.currentDfd.length-1]) {
                        return dfd = $.Deferred().reject(value);
                    }
                    self.currentDfd.length = 0;
                    return(value);
                },

                //Filter Failure
                function(value) {
                    console.log('failure', value);
                    return(value);
                }
            );

            self.currentDfd.push(dfd);
            return dfd;
        }
    };
});