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
            this.on('keyup', '[name=q]', this._onKeyup);
            this.on('click', '[name=clear]', this._onClickClear);
            this.update();
        },
        _getPreviousParams: function() {
            return $.extend(true, {}, this.options.collection.query.params);
        },
        _makeQueryParams: function() {
            var p = {query: null}, value = this.getWidget('q').getValue();
            if (value) {
                (p.query = {})[this.options.searchParam] = value;
            }
            return $.extend(true, {}, this._getPreviousParams(), p);
        },
        _onClickClear: function() {
            this.getWidget('q').setValue('');
            this.getWidget('clear').disable();
            this.submit();
        },
        _onKeyup: function() {
            var method = this.getWidget('q').getValue()? 'enable' : 'disable';
            this.getWidget('clear')[method]();
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
