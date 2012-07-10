define([
    'vendor/jquery',
    './modal',
    './button',
    'tmpl!./messagebox/messagebox.mtpl',
    'css!./messagebox/messagebox.css'
], function($, Modal, Button, template) {

     return Modal.extend({
        nodeTemplate: template,

        defaults: {
            okBtn: '', // provide a label to have an ok button in the lower right corner
            cancelBtn: '', // provide a label to have a cancel button in the lower right corner
            body: '', // Message Body
            okBtnEvent: 'ok', // to rename the button event, provide a name here
            cancelBtnEvent: 'cancel', // to rename the button event, provide a name here
            okBtnClass: 'ok', // to rename the OK button class, provide a name here
            cancelBtnClass: 'cancel', // to rename Cancel button class, provide a name here
            style: '' // provide a style here. the style will be directly applied to the messagebox icon class if provided. 
        },
        
        create: function() {
            var self = this;
            this._super();
               
            // Append message body
            self.$node.find('.message-text').append(self.options.body);
            
            if (self.options.cancelBtn !== '') {
                Button($('<button class="'+self.options.cancelBtnClass+'">'+self.options.cancelBtn+'</button>').appendTo(self.$node.find('.buttons')))
                    .on('click', self.cancel);
            }

            if (self.options.okBtn !== '') {
                Button($('<button class="'+self.options.okBtnClass+'">'+ 
                        self.options.okBtn+'</button>').appendTo(self.$node.find('.buttons')))
                    .on('click', self.ok);
            }
            if (self.options.style !== '') {
                self.$node.find('.message-icon').addClass(self.options.style);
                self.$node.find('.message-text').addClass('message-body-with-icon');
            }
        },
        
        ok: function() {
            var self = this;
            self.trigger(self.options.okBtnEvent);
            self.close();
        },
        
        cancel: function() {
            var self = this;
            self.trigger(self.options.cancelBtnEvent);
            self.close();
        }
    });    
});
