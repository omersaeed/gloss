define(

[
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/button',
    'link!css/widgets/modal.css'
],

function($, _, Widget, Button) {

    return Widget.extend({
        defaults: {
            backdrop: true, // set to 'transparent' for clear, 'false' to disable
            clickBackdropToClose: false,
            position: 'center', // set to 'undefined' for manual positioning
            width: undefined,
            height: undefined,
            closeOnEscape: true,
            title: false, // set this to a string for enable a title
            closeBtn: false // 'true' to have a close button in the upper corner
        },

        create: function() {
            this.$node.hide().addClass(
                this.options.backdrop? 'modal' : 'modal without-backdrop');

            if (this.options.backdrop) {
                this.$backdrop = $('<div class=modal-backdrop>');
                if (this.options.backdrop === 'transparent') {
                    this.$backdrop.addClass('transparent');
                }
            } else {
                this.$backdrop = $(null);
            }

            this.$header = this.$node.children().find('h1');

            if (!this.$header.length &&
                    (this.options.title || this.options.closeBtn)) {
                this.$header = $('<h1>').prependTo(this.$node);
            }

            if (this.options.title) {
                this.$header.text(this.options.title);
            }

            if (this.options.closeBtn) {
                Button($('<button>X</button>').prependTo(this.$header))
                    .on('click', this.close);
            }

            if (this.options.clickBackdropToClose) {
                this.$backdrop.on('click', this.close);
            }

            if (this.options.width) {
                this.$node.width(this.options.width);

                if (this.options.position === 'center') {
                    this.$node.css({marginLeft: -this.options.width/2 + 'px'});
                }
            }

            if (this.options.height) {
                this.$node.width(this.options.width);

                if (this.options.position === 'center') {
                    this.$node.css({marginTop: -this.options.height/2 + 'px'});
                }
            }
        },

        open: function() {
            if (! this.$backdrop.parent().length && this.$node.parent().length) {
                this.$backdrop.insertBefore(this.$node);
            }
            this.$backdrop.show();

            this.$node.addClass('invisible').show();

            this.propagate('beforeShow');

            if (this.options.position === 'center' &&
                (! this.options.width || ! this.options.height)) {

                var size = {
                    width: this.$node.width(),
                    height: this.$node.height()
                };
                
                if (!this.options.width) {
                    this.$node.css({marginLeft: -size.width/2 + 'px'});
                }

                if (!this.options.height) {
                    this.$node.css({marginTop: -size.height/2 + 'px'});
                }
            }

            this.$node.removeClass('invisible').hide();

            this.$node.show();

            if (this.options.closeOnEscape) {
                $(document).on('keyup.modal', this.checkKeyup);
            }

            this.propagate('show');
            this.trigger('show');
        },

        // prevent default functionality of this.$node.show/hide()
        show: function() { },
        hide: function() { },

        close: function() {
            this.propagate('hide');
            this.$backdrop.hide();
            this.$node.hide();
            $(document).off('keyup.modal');
            this.trigger('hide');
        },

        checkKeyup: function(evt) {
            if (evt.keyCode === 27) {
                this.close();
            }
        }
    });

});
