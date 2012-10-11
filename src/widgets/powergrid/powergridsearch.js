define([
    'vendor/jquery',
    './../widgetgroup',
    './../collectionviewable',
    'tmpl!./powergridsearch.mtpl'
], function($, WidgetGroup, CollectionViewable, template) {
    var PowerGridSearch = WidgetGroup.extend({
        defaults: {
            placeholder: 'Enter terms to search...',
            searchParam: 'name__icontains',
            searchButtonText: 'Search',
            populateEmptyNode: true,
            widgetize: true
        },
        nodeTemplate: template,
        create: function() {
            this._super.apply(this, arguments);
            this.on('submit', this.submit);
            this.update();
        },
        _makeQueryParams: function() {
            var p = {query: {}};
            p.query[this.options.searchParam] = this.getWidget('q').getValue();
            return $.extend(true, {}, this._getPreviousParams(), p);
        },
        _getPreviousParams: function() {
            return $.extend(true, {}, this.options.collection.query.params);
        },
        submit: function(evt) {
            var collection = this.options.collection;
            if (evt) {
                evt.preventDefault();
            }
            if (!collection) {
                return;
            }
            return collection.reset(this._makeQueryParams()).load();
        }
    }, {mixins: [CollectionViewable]});

    return PowerGridSearch;
});
