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
            populateEmptyNode: true
        },

        create: function() {
            var self = this;
            this._super();
            
            self.selectBox = Button(self.$node.find('.ui-multiselect-btn'));
            self.selectBox.on('click', function(evt) {
                self._toggleMenu(evt);
            });
            self._selectBoxDefaultValue = self.selectBox.getValue(); 
                
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
            
            self.checkBoxGroup = CheckBoxGroup(self.$node.find('.ui-checkbox-group'));
            
            this.update();
        },
        
        _toggleMenu: function(evt) {
            this.menu.toggle(evt);
        },
                    
        getValue: function() {
            return this.checkBoxGroup.getValue();
        },

        setValue: function(array, silent) {
            var array, value;
            this.checkBoxGroup.setValue(array, silent);
        },
        
        _displayCheckedValues: function(){         
            array = _.filter(
                    _.map(this.checkboxes, function(cb) {
                        return cb.getValue()? cb.options.value : null;
                    }),
                    function(v) { return v !== null; }
                );
            if (array.length == 0){
                value = self._selectBoxDefaultValue;
            }
            else {
                value = array.join(", ");
                if (value.length > self._selectBoxDefaultValue){
                    value.substring(0, self._selectBoxDefaultValue.length -3) + '...'; 
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
            }            
        }
    }, {mixins: [CollectionViewable]});
});
