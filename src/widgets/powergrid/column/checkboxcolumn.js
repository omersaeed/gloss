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
            var delegateSelector = 'tbody tr .'+this.columnClass()+' input';
            if (this.get('prop') == null) {
                this.set({prop: '_' + this.el.id + '_checked'},
                    {silent: true});
            }
            this._postRender();
            this.get('grid')
                .on('change', delegateSelector, _.bind(this._onChange, this))
                .on('mouseup', delegateSelector, function(evt) {
                    evt.stopPropagation();
                });
        },

        _getName: function() {
            return this.get('type') === 'radio'?  '_'+this.el.id+'_name' : '';
        },

        _isDisabled: function(model) {
            return false;
        },

        _onHeaderChange: function() {
            var self = this,
                prop = self.get('prop'), v = self.checkbox.getValue(),
                grid = self.get('grid'),
                modelLength = grid.get('models').length,
                silentTilLast = grid.get('collection');

            _.each(grid.get('models'), function(model, i) {
                if (!self._isDisabled(model)) {
                    model.set(prop, v, silentTilLast?
                        {silent: i !== modelLength-1} : undefined);
                }
            });

            grid.rerender();
        },

        _onChange: function(evt) {
            var checked, self = this,
                $target = $(evt.target),
                model = self.get('grid')._modelFromTr($target.closest('tr'));
            if (self.get('type') === 'radio') {
                _.each(self.get('grid').get('models'), function(m) {
                    if (m !== model) {
                        m.del(self.get('prop'));
                    }
                });
            }
            model.set(self.get('prop'), (checked = $target.is(':checked')));
            if (!checked) {
                self.checkbox.$node.prop('checked', false);
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
