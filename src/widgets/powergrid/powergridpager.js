define([
    'vendor/jquery',
    'vendor/underscore',
    './../../view',
    'tmpl!./powergridpager/powergridpager.mtpl',
    'css!./powergridpager/powergridpager.css'
], function ($, _, View, template) {

    var PowerGridPager = View.extend({
        defaults:{
            collection: undefined,
            total: 0,
            page: 1,
            pages: 1,
            pageSize: 25,
            pageSizes: [25, 50, 75, 100]
        },
        template: template,

        init: function() {
            var self = this;
            this._super.apply(this, arguments);

            self.on('focus', '.current-page input', function(event) {
                $(this).select();
            });
            self.on('change', 'select', function(event) {
                self.set({
                    pageSize: Number($(this).val()),
                    page: 1
                });
            });
            self.on('keydown', '.current-page input', function(event) {
                var node = $(this),
                    page = node.val();
                if(event.which === 13) {
                    node.blur();
                    self.jump(page);
                }
            });
            self.on('click', '.first-page', function(event) {
                var page = 1;
                self.jump(1);
            });
            self.on('click', '.prev-page', function(event) {
                var page = self.get('page') - 1;
                self.jump(page);
            });
            self.on('click', '.next-page', function(event) {
                var page = self.get('page') + 1;
                self.jump(page);
            });
            self.on('click', '.last-page', function(event) {
                var page = self.get('pages');
                self.jump(page);
            });
            self.update(_.reduce(self.options, function(memo, val, key) {
                memo[key] = true;
                return memo;
            }, {}));
        },

        jump: function(page) {
            if(this.get('page') != page && page >= 1 && page <= this.get('pages')) {
                this.set('page', parseInt(page, 10));
            }
        },

        update: function(updated) {
            var self = this,
                collection = this.get('collection'),
                limit = this.get('pageSize'),
                page = this.get('page'),
                offset = limit * (page - 1),
                changes = false;

            if (collection && (collection.query.params.limit !== limit ||
                        collection.query.params.offset !== offset)) {
                collection.query.params.limit = limit;
                collection.query.params.offset = offset;
                changes = true;
            }
            if (updated.page || updated.pageSize || updated.total || updated.pages) {
                changes = true;
            }
            if (changes) {
                this.render();
            }
            if (collection && changes) {
                collection.load().done(function() {
                    var collection = self.get('collection');
                    if (collection.total != null) {
                        self.set({
                            total: collection.total,
                            pages: Math.ceil(collection.total / collection.query.params.limit)
                        });
                    }
                });
            }
        }
    });

    return PowerGridPager;
});
