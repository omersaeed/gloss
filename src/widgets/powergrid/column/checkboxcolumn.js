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
            
            _.bindAll(this, '_onChange', '_onHeaderChange',
                        '_onModelChange', '_onPropChange', '_unCheckHeader');

            if (this.get('prop') == null) {
                this.set({prop: '_' + this.el.id + '_checked'},
                    {silent: true});
            }
            this._postRenderCheckbox();
            this.get('grid')
                .on('change', delegateSelector, this._onChange)
                .on('mouseup', delegateSelector, function(evt) {
                    evt.stopPropagation();
                })
                .on('propchange', this._onPropChange);
        },

        _getName: function() {
            return this.get('type') === 'radio'?  '_'+this.el.id+'_name' : '';
        },

        _isDisabled: function(model) {
            return false;
        },

        _onPropChange: function(evt, updated) {
            var grid = this.get('grid');
            if (updated.collection) {
                if (grid.previous('collection')) {
                    grid.previous('collection')
                        .off('change', this._onModelChange);
                }
                if (grid.get('collection')) {
                    grid.get('collection')
                        .on('change', this._onModelChange);
                }
            }
        },

        _onModelChange: function(eventName, coll, model, changed) {
            var grid = this.get('grid'),
                models = grid.get('models'),
                collection = grid.get('collection'),
                $thCheckbox = grid.$el.find('thead [type=checkbox]:checked');

            if (this._updateFromHeader) {
                this._updateFromHeader = false;
                return;
            }
            
            if (models.length > 0) {
                this._unCheckHeader(models);
            } else if (collection) {
                collection.load().done(this._unCheckHeader);
            }
        },

        _unCheckHeader: function(models) {
            var $thCheckbox = this.get('grid').$el.find('thead [type=checkbox]:checked'),
                uncheckHeader;

            uncheckHeader = _.any(models, function(m) {
                return !m.get('_checked');
            });
            if (uncheckHeader && ($thCheckbox.length > 0)) {
                $thCheckbox.prop('checked', false);
            }
        },

        _onHeaderChange: function() {
            var self = this,
                prop = self.get('prop'), v = self.checkbox.getValue(),
                grid = self.get('grid'),
                silentTilLast = grid.get('collection'),
                changes;

            changes = _.filter(grid.get('models'), function(model, i) {
                var changed = false;
                if (!self._isDisabled(model)) {
                    changed = (model.get(prop) !== v);
                }
                return changed;
            });

            self._updateFromHeader = (changes.length > 0);
            _.each(changes, function(model, i) {
                model.set(prop, v, silentTilLast?
                        {silent: i !== changes.length-1} : undefined);
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

        _postRenderCheckbox: function() {
            if (this.get('type') === 'checkbox') {
                this.checkbox = CheckBox()
                    .on('change', this._onHeaderChange)
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
            this._postRenderCheckbox();
        },

        update: function(updated) {
            if (updated.type) {
                this.render();
                this.get('grid').rerender();
            }
        }

    });
});
