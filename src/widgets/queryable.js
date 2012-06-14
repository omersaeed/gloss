define([
], function () {
    return {
        defaults: {
        },
        afterInit: function() {
            var self = this;
            self.currentDfd = [];
        },
        executeQuery: function(dfd) {
            var self = this;

            dfd = dfd.pipe(
                //Filter Success
                function(value) {
                    if(dfd !== self.currentDfd[self.currentDfd.length-1]) {
                        return $.Deferred().reject();
                    }
                    self.currentDfd.length = 0;
                    return this.resolve();
                },

                //Filter Failure
                function(value) {
                    console.log('failure', value);
                    return $.Deferred().reject(value);
                }
            );

            self.currentDfd.push(dfd);
            return dfd;
        }
    };
});