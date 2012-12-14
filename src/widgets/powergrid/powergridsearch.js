define([
    'vendor/jquery',
    'vendor/underscore',
    './../widgetgroup',
    './../collectionviewable',
    'tmpl!./powergridsearch.mtpl'
], function($, _, WidgetGroup, CollectionViewable, template) {
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
            if (!this.getWidget('q').getValue()) {
                this.getWidget('clear').disable();
            }
            this.on('submit', this.submit);
            this.on('keyup', '[name=q]', this._onKeyup);
            this.on('click', '[name=clear]', this._onClickClear);
            this.update();
        },
        _getPreviousParams: function() {
            return $.extend(true, {}, this.options.collection.query.params);
        },
        _makeQueryParams: function() {
            var p = {query: {}},
                value = this.getWidget('q').getValue().trim(),
                previousParams = this._getPreviousParams(),
                result = {};

            if (value) {
                p.query[this.options.searchParam] = value;
            }

            // to check if the previous params had a query parameter then remove search param from it
            if (previousParams.query && _.has(previousParams.query, this.options.searchParam)) {
                previousParams.query = _.omit(previousParams.query, this.options.searchParam);
            }

            result = $.extend(true, result, previousParams, p);

            // If query parameter is empty then delete it
            result.query = _.isEmpty(result.query) ? null : result.query;
            return result;
        },
        _onClickClear: function() {
            var clear = this.getWidget('clear'),
                q = this.getWidget('q').setValue('');

            if (this._filtered) {
                this.submit();
            }
        },
        _onKeyup: function() {
            var method = this._filtered || this.getWidget('q').getValue()?
                'enable' : 'disable';
            this.getWidget('clear')[method]();
        },
        submit: function(evt) {
            var params, self = this, collection = self.options.collection;
            if (evt) {
                evt.preventDefault();
            }
            if (!collection) {
                return;
            }
            self.propagate('disable');
            self.trigger('searchStarted');

            params = self._makeQueryParams();
            self._filtered = !!params.query;
            return collection.reset(params).load().always(function() {
                self.propagate('enable');
                self.trigger('searchCompleted');

                if (!self.getWidget('q').getValue()) {
                    self.getWidget('clear').disable();
                }
            });
        }
    }, {mixins: [CollectionViewable]});

    return PowerGridSearch;
});
