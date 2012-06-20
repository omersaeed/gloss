define([
    'vendor/jquery',    
    'vendor/underscore',
    './formwidget',
    './collectionviewable',
    './button',
    './checkboxgroup',
    './basemenu',
    'tmpl!./multiselect/multiselect.mtpl',
    'css!./multiselect/multiselect.css'
], function($, _, FormWidget, CollectionViewable, Button, CheckBoxGroup, BaseMenu, template) {
    return FormWidget.extend({
        nodeTemplate: template,
        defaults: {            
            populateEmptyNode: true,
            checkAllLabel: 'Check all',
            uncheckAllLabel: 'Uncheck all',
            selectBoxDefaultValue: '-- Select Values --'
                
                
        },

        create: function() {
            var self = this;
            this._super();
            
            self.selectBox = Button(self.$node.find('.ui-multiselect-btn'));
            self.selectBox.on('click', function(evt) {
                self._toggleMenu(evt);
            })
            .setValue(self.options.selectBoxDefaultValue);
                
            self.resetSelectAll = self.$node.find('.ui-multiselect-all');
            self.resetSelectAll.on('click', function(evt) {
                self.setValue('all');
            });
            
            self.resetSelectNone = self.$node.find('.ui-multiselect-none');
            self.resetSelectNone.on('click', function(evt) {
                self.setValue('none');
            });
            
            self.resetClose = self.$node.find('.ui-multiselect-close');
            self.resetClose.on('click', function(evt) {
                self.menu.hide();
            });
            
            self.menu = BaseMenu(self.$node.find('.base-menu'), {
                position: {my: 'left top', at: 'left bottom', of: self.$node},
                width: self.$node,
                updateDisplay: true
            });
            
            self.$node.find('.ui-multi-select-all-label').html(self.options.checkAllLabel);
            self.$node.find('.ui-multi-select-none-label').html(self.options.uncheckAllLabel);
            
            self.checkBoxGroup = CheckBoxGroup(self.$node.find('.ui-checkbox-group'));
            
            self.on('changed', function(evt){
                self._displayCheckedValues();
            });
            
            this.update();
        },
        
        _toggleMenu: function(evt) {
            this.menu.toggle(evt);
        },
                    
        getValue: function() {
            return this.checkBoxGroup.getValue();
        },

        setValue: function(array, silent) {
            this.checkBoxGroup.setValue(array, silent);
            this._displayCheckedValues();
        },
        
        _displayCheckedValues: function(){ 
            var value = null,
                array = _.filter(
                    _.map(this.checkBoxGroup.checkboxes, function(cb) {
                        return cb.getValue()? cb.options.name : null;
                    }),
                    function(v) { return v !== null; }
                );
            if (array.length === 0) {
                value = this.options.selectBoxDefaultValue;
            }
            else {
                value = array.join(", ");
                if (value.length > this.options.selectBoxDefaultValue.length){
                    value = value.substring(0, this.options.selectBoxDefaultValue.length -3) + '...'; 
                }
            }
            this.selectBox.setValue(value);
        },
        
        updateWidget: function(updated) {
            var self = this, 
                options = self.options;
            
            this._super(updated);
            if (updated.models) {
                self.checkBoxGroup.set('models', options.models);
                _.each(self.checkBoxGroup.checkboxes, function (cb) {
                    cb.on('change', function(evt) {
                        self.trigger('changed');
                    });
                });                
            }            
        }
    }, {mixins: [CollectionViewable]});
});
