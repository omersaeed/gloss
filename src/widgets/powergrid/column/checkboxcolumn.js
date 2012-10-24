define([
    'vendor/jquery',
    'vendor/underscore',
    './../column',
    './../../checkbox'
], function($, _, Column, CheckBox) {
    return Column.extend({
        defaults: {
            label: '',
            type: 'checkbox',
            name: 'checkbox_column',
            prop: null
        },

        init: function() {
            this._super.apply(this, arguments);
            if (this.get('prop') == null) {
                this.set({prop: '_' + this.el.id + '_checked'},
                    {silent: true});
            }
            this._postRender();
            this.get('grid').on(
                'change',
                'tbody tr .'+this.columnClass()+' input',
                _.bind(this._onChange, this));
        },

        _getName: function() {
            return this.get('type') === 'radio'?  '_'+this.el.id+'_name' : '';
        },

        _isDisabled: function(model) {
            return false;
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

        _postRender: function() {
            if (this.get('type') === 'checkbox') {
                this.checkbox = CheckBox()
                    .on('change', _.bind(this._onHeaderChange, this))
                    .appendTo(this.$el);
            }
        },

        cssClasses: function() {
            return this._super.apply(this, arguments) + ' checkbox-column';
        },

        getValue: function(model) {
            return model.get(this.get('prop'));
        },

        formatValue: function(value, model) {
            var disabld = this._isDisabled(model)? 'disabled' : '',
                checked = value? 'checked' : '';
            return [
                '<input type="', this.get('type'), '" name="',
                    this._getName(), '" ', checked, ' ', disabld, ' />'
            ].join('');
        },

        render: function() {
            this._super.apply(this, arguments);
            this._postRender();
        },

        update: function(updated) {
            if (updated.type) {
                this.render();
                this.get('grid').rerender();
            }
        }

    });
});
