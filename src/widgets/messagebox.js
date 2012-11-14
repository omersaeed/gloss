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
            optionBtn: '',
            body: '', // Message Body
            okBtnEvent: 'ok', // to rename the button event, provide a name here
            cancelBtnEvent: 'cancel', // to rename the button event, provide a name here
            optionBtnEvent: 'option',
            okBtnClass: 'ok', // to rename the OK button class, provide a name here
            cancelBtnClass: 'cancel', // to rename Cancel button class, provide a name here
            optionBtnClass: 'option',
            style: '' // provide a style here. the style will be directly applied to the messagebox icon class if provided.
        },

        create: function() {
            var self = this;
            this._super();

            if (self.options.cancelBtn !== '') {
                Button($('<button class="'+self.options.cancelBtnClass+'">'+self.options.cancelBtn+'</button>').appendTo(self.$node.find('.buttons')))
                    .on('click', self.cancel);
            }

            if (self.options.okBtn !== '') {
                Button($('<button class="'+self.options.okBtnClass+'">'+
                        self.options.okBtn+'</button>').appendTo(self.$node.find('.buttons')))
                    .on('click', self.ok);
            }

            if (self.options.optionBtn !== '') {
                Button($('<button class="'+self.options.optionBtnClass+'">'+
                        self.options.optionBtn+'</button>').appendTo(self.$node.find('.buttons')))
                    .on('click', self.option);
            }

            if (self.options.style !== '') {
                self.$node.find('.message-icon').addClass(self.options.style);
                self.$node.find('.message-text').addClass('message-body-with-icon');
            }
            self.update();
        },

        ok: function() {
            var self = this, evt;
            self.trigger(evt = $.Event(self.options.okBtnEvent));
            if (!evt.isDefaultPrevented()) {
                self.close();
            }
        },

        option: function() {
            var self = this, evt;
            self.trigger(evt = $.Event(self.options.optionBtnEvent));
            if (!evt.isDefaultPrevented()) {
                self.close();
            }
        },

        cancel: function() {
            var self = this;
            self.trigger(self.options.cancelBtnEvent);
            self.close();
        },
        updateWidget: function(updated) {
            if (updated.body) {
                // Append message body
                this.$node.find('.message-text').html(this.options.body);
            }
        }
    });
});
