define([
    'vendor/jquery',
    'vendor/gloss/widgets/widget'
], function($, Widget) {
    var inArray = $.inArray;
    return Widget.extend({
        managedStates: ['active', 'disabled', 'focused', 'hover', 'readonly'],
        create: function() {
            this.activeStates = [];
            this.state = {
                active: false,
                disabled: false,
                focused: false,
                hovering: false,
                readonly: false
            };
            this.on('blur focus mouseenter mouseleave mousedown', this._onStateEvent);
        },
        getState: function(state) {
            var currentState;
            if (state == null) {
                currentState = $.extend({}, this.state);
            } else {
                currentState = this.state[state];
            }
            return currentState;
        },
        addState: function(states, silent) {
            var active = this.activeStates, managed = this.managedStates, state;
            if(!$.isArray(states)) {
                states = [states];
            }
            for(var i = 0, l = states.length; i < l; i++) {
                state = states[i];
                if(inArray(state, managed) >= 0 && inArray(state, active) < 0) {
                    active.push(state);
                }
            }
            if(!silent) {
                this.updateState();
            }
            return this;
        },
        disable: function() {
            var tabindex = this.$node.attr('tabindex');
            this.state.disabled = true;
            this.addState('disabled');
            this.propagate('disable');
            if (tabindex > -1) {
                this.$node.removeAttr('tabindex');
                this._tabindex = tabindex;
            }
            return this;
        },
        enable: function() {
            this.state.disabled = false;
            this.removeState('disabled');
            this.propagate('enable');
            if (this._tabindex != null) {
                this.$node.attr('tabindex', this._tabindex);
                delete this._tabindex;
            }
            return this;
        },
        removeState: function(states, silent) {
            var active = this.activeStates, managed = this.managedStates, state, idx;
            if(!$.isArray(states)) {
                states = [states];
            }
            for(var i = 0, l = arguments.length; i < l; i++) {
                idx = inArray(states[i], active);
                if(idx >= 0) {
                    active.splice(idx, 1);
                }
            }
            if(!silent) {
                this.updateState();
            }
            return this;
        },
        updateState: function() {
            var state = this.state, managed = this.managedStates, classes, current;
            classes = [];

            current = this.$node.attr('class');
            if(current != null && current.length > 0) {
                current = current.split(' ');
                for(var i = 0, l = current.length; i < l; i++) {
                    if(inArray(current[i], managed) < 0) {
                        classes.push(current[i]);
                    }
                }
            }

            if(this.state.disabled) {
                classes.push('disabled');
            } else if(this.state.readonly) {
                classes.push('readonly');
            } else {
                if(this.state.active) {
                    classes.push('active');
                } else if(this.state.hovering) {
                    classes.push('hover');
                }
                if(this.activeStates.length > 0) {
                    classes = classes.concat(this.activeStates);
                }
            }
            if(this.state.focused) {
                classes.push('focused');
            }

            this.$node.attr('class', classes.join(' '));
            return this;
        },
        _onStateEvent: function(event) {
            var self = this;
            if(!self.state.disabled) {
                switch(event.type) {
                    case 'blur':
                        self.state.focused = false;
                        break;
                    case 'focus':
                        self.state.focused = true;
                        break;
                    case 'mouseenter':
                        self.state.active = self.state._mouseDown;
                        self.state.hovering = true;
                        break;
                    case 'mouseleave':
                        self.state.active = false;
                        self.state.hovering = false;
                        break;
                    case 'mousedown':
                        self.state.active = true;
                        self.state._mouseDown = true;
                        $('body').on('mouseup', function callback(event) {
                            self.state.active = false;
                            self.state._mouseDown = false;
                            self.updateState();
                            $('body').off('mouseup', callback);
                        });
                        break;
                }
                self.updateState();
            }
        }
    });
});
