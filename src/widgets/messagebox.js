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
            style: '' // provide a style here. the style will be directly applied to the messagebox icon class if provided. 
        },
        
        create: function() {
            var self = this;
            this._super();
               
            // Append message body
            self.$node.find('.message-body').append(self.options.body);
            
            if (self.options.cancelBtn !== '') {
                Button($('<button>'+self.options.cancelBtn+'</button>').appendTo(self.$node))
                    .on('click', self.cancel);
            }

            if (self.options.okBtn !== '') {
                Button($('<button>'+self.options.okBtn+'</button>').appendTo(self.$node))
                    .on('click', self.ok);
            }
            if (self.options.style !== '') {
                self.$node.find('.message-icon').addClass(self.options.style);
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
