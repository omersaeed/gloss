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
            body: ''
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
        },
        
        ok: function() {
            var self = this;
            self.trigger('ok');
            self.close();
        },
        
        cancel: function() {
            var self = this;
            self.trigger('cancel');
            self.close();
        }
    });    
});
