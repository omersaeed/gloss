define([
    'vendor/jquery',
    'vendor/underscore'
], function ($, _) {
    var remove = function(array, obj) {
        var idx = _.indexOf(array, obj);
        if (idx >= -1) {
            array.splice(idx, 1);
        }
    };

    return {
        executeQuery: function(dfd) {
            var self = this;

//            self.dfd = $.Deferred();
//
//            dfd.then(function(value) {
//                if(dfd !== self._currentDfd) {
//                    remove(self._currentDfds, dfd);
//                    return;
//                }
//                remove(self._currentDfds, dfd);
//                self._currentDfd = undefined;
//                return self.dfd.resolve(value);
//
//            }, function(value) {
//                remove(self._currentDfds, dfd);
//                return self.dfd.reject(value);
//            });
//            (self._currentDfds = self._currentDfds || []).push(dfd);
//            self._currentDfd = dfd;
//            return self.dfd;

            dfd = dfd.pipe(
                //Filter Success
                function(value) {
                    if(dfd !== self._currentDfd) {
                        remove(self._currentDfds, dfd);
                        return $.Deferred();
                    }
                    // self._currentDfds.length = 0;
                    remove(self._currentDfds, dfd);
                    self._currentDfd = undefined;

                    // seems that if the deferred was the result of $.when,
                    // 'this' will be an array instead of just a promise
                    if (_.isArray(this)) {
                        return $.when.apply($, this);
                    } else {
                        return this.resolve();
                    }
                },
                //Filter Failure
                function(value) {
                    remove(self._currentDfds, dfd);
                    return this.reject();
                }
            );
            (self._currentDfds = self._currentDfds || []).push(dfd);
            self._currentDfd = dfd;
            return dfd;
        }
    };
});
