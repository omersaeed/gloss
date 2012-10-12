define([
    'vendor/jquery',
    'vendor/underscore',
    './../column',
    './../../checkbox'
], function($, _, Column, CheckBox) {
    return Column.extend({
        defaults: {
            label: '',
            name: 'checkbox_column',
            prop: '_checked'
        },

        init: function() {
            this._super.apply(this, arguments);
            this._postRender();
            this.get('grid').on(
                'change',
                'tbody tr .'+this.cssClass()+' [type=checkbox]',
                _.bind(this._onChange, this));
        },

        _postRender: function() {
            this.$el.addClass('checkbox-column');
            this.checkbox = CheckBox()
                .on('change', _.bind(this._onHeaderChange, this))
                .appendTo(this.$el);
        },

        _onHeaderChange: function() {
            var prop = this.get('prop'), v = this.checkbox.getValue();
            _.each(this.get('grid').get('models'), function(model) {
                model.set(prop, v, {silent: true});
            });
            this.get('grid').rerender();
        },

        _onChange: function(evt) {
            var $target = $(evt.target), checked;
            this.get('grid')._modelFromTr($target.closest('tr'))
                .set(this.get('prop'), (checked = $target.is(':checked')));
            if (!checked) {
                this.checkbox.$node.prop('checked', false);
            }
        },

        getValue: function(model) {
            var chkd = model.get(this.get('prop'))?  'checked' : '';
            return '<input type=checkbox ' + chkd + ' />';
        },

        render: function() {
            this._super.apply(this, arguments);
            this._postRender();
        }
    });
});
