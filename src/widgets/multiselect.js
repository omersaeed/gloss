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
            entries: null, 
            populateEmptyNode: true,
            checkAllLabel: 'Check all',
            uncheckAllLabel: 'Uncheck all',
            selectBoxDefaultText: '-- Select Values --',
            singleItemSelectionText: '1 item selected',
            multipleItemsSelectionText: ' items selected',
            translator: function(item) {
                return {value: item.id, name: item.name, checked: item.selected};
            }
        },

        create: function() {
            var self = this, options = self.options, $replacement;
            this._super();
            
            if (options.entries == null) {
                self.$node.children().each(function(i, el) {
                    var $el = $(el),
                        entries = options.entries = options.entries || [];
                    if (el.tagName.toLowerCase() === 'option') {
                        entries.push({name: $el.text(), value: $el.val(), checked: $el.is(':selected')});
                    }                    
                });
            }

            if (self.node.tagName.toLowerCase() === 'select') {
                self.$node.replaceWith($replacement = $(self.nodeTemplate()));                
                $replacement.find('.ui-multiselect')                
                    .attr('name', self.$node.attr('name'))
                    .attr('id', self.$node.attr('id'));
                self.node = (self.$node = $replacement)[0];
            }
            if (!self.$node.hasClass('multiselect')) {
                self.$node.addClass('multiselect');
            }            
            
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
            self.checkBoxGroup.set('collection', self.options.collection);
            
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
            
            if (updated.collection) {
                self.checkBoxGroup.set('collection', options.collection);
            } 
            
            if (updated.models) {
                self.checkBoxGroup.set('models', options.models);
                this.set('entries', _.map(options.models, options.translator));
            }  
            
            if (updated.entries) {
                self.checkBoxGroup.set('entries', options.entries);
            }                

            
        }
    }, {mixins: [CollectionViewable]});
});
