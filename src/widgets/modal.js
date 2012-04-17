define([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!gloss:widgets/widget',
    'path!gloss:widgets/button',
    'path!gloss:widgets/draggable',
    'path!gloss:css!widgets/modal/modal.css'
], function($, _, Widget, Button, Draggable) {

    return Widget.extend({
        defaults: {
            draggable: { autoBind: false }, // leave this alone
            backdrop: true, // set to 'transparent' for clear, 'false' to disable
            clickBackdropToClose: false,
            position: 'center', // set to 'undefined' to use CSS positioning
            width: undefined,
            height: undefined,
            closeOnEscape: true,
            title: false, // set this to a string for enable a title
            closeBtn: false, // 'true' to have a close button in the upper corner
            titleBarDrag: true // set to 'true' for titlebar drag
        },

        create: function() {
            var self = this, $node = self.$node, options = self.options;
            $node.hide().addClass(
                options.backdrop? 'modal' : 'modal without-backdrop');

            if (options.backdrop) {
                self.$backdrop = $('<div class=modal-backdrop></div>');
                if (options.backdrop === 'transparent') {
                    self.$backdrop.addClass('transparent');
                }
            } else {
                self.$backdrop = $(null);
            }

            self.$header = $node.children().find('h1');

            if (!self.$header.length &&
                    (options.title || options.closeBtn)) {
                self.$header = $('<h1>').prependTo($node);
            }

            if (options.title) {
                self.$header.text(options.title);
            }

            if (options.closeBtn) {
                Button($('<button>X</button>').prependTo(self.$header))
                    .on('click', self.close);
            }

            if (options.clickBackdropToClose) {
                self.$backdrop.on('click', self.close);
            }

            if (options.width) {
                $node.width(options.width);

                if (options.position === 'center') {
                    $node.css({marginLeft: -options.width/2 + 'px'});
                }
            }

            if (options.height) {
                $node.width(options.width);

                if (options.position === 'center') {
                    $node.css({marginTop: -options.height/2 + 'px'});
                }
            }

            if (options.titleBarDrag) {
                self.on('mousedown', 'h1, h1 :not(button)', function(evt) {
                    // self.draggableOnMouseDown(evt);
                    self.startDrag(evt);
                }).$node.find('h1').addClass('drag-handle');
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
                (! this.options.width || ! this.options.height) &&
                ! this._positioned) {

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

                this._positioned = true;
            }

            this.$node.removeClass('invisible').hide();

            this.$node.show();

            if (this.options.closeOnEscape) {
                $(document).on('keyup.modal', this.checkKeyup);
            }

            this.propagate('show');
            this.trigger('show');
            return this;
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
            return this;
        },

        checkKeyup: function(evt) {
            if (evt.keyCode === 27) {
                this.close();
            }
        }
    }, {mixins: [Draggable]});

});
