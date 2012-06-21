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
            selectBoxDefaultText: '-- Select Values --',
            singleItemSelectionText: '1 item selected',
            multipleItemsSelectionText: ' items selected'
        },

        create: function() {
            var self = this;
            this._super();
            
            self.selectBox = Button(self.$node.find('.ui-multiselect-btn'));
            self.selectBox.on('click', function(evt) {
                self._toggleMenu(evt);
            })
            .setValue(self.options.selectBoxDefaultText);
                
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
            self.checkBoxGroup.on ('change', function(evt){
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
        },
        
        _displayCheckedValues: function(){ 
            var value = null,
                array = this.getValue();
            if (array.length === 0) {
                value = this.options.selectBoxDefaultText;
            } else if (array.length === 1) {
                value = this.options.singleItemSelectionText;
            } else {
                value = array.length + this.options.multipleItemsSelectionText;
            }
            
            this.selectBox.setValue(value);
        },
        
        updateWidget: function(updated) {
            var self = this, 
                options = self.options;
                        
            this._super(updated);
            
           if (updated.models) {
                self.checkBoxGroup.set('models', options.models);
            }            
        }
    }, {mixins: [CollectionViewable]});
});
