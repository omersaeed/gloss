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
            var p = {query: null}, value = this.getWidget('q').getValue();
            if (value) {
                (p.query = {})[this.options.searchParam] = value;
            }
            return $.extend(true, {}, this._getPreviousParams(), p);
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
