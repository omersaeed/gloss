define([
    'component!vendor:jquery',
    'component!vendor:underscore',
    './../core/eventset',
    './widget',
    './boundwidgetgroup'
], function($, _, EventSet, Widget, BoundWidgetGroup) {
    var isArray = $.isArray, isPlainObject = $.isPlainObject, isString = _.isString;
    return BoundWidgetGroup.extend({
        defaults: {
            errorHandler: null,
            errorList: null,
            spinner: null
        },
        create: function() {
            this.events = EventSet();
            this._super();
        },
        bind: function(model) {
            this.reset();
            this._super(model);
        },
        reset: function() {
            if(this.options.errorList != null) {
                this.options.errorList.clear();
            }
            this.propagate('setStatus', 'unknown');
        },
        startUpdating: function() {
            this.mark = +(new Date);
            if(this.options.spinner) {
                this.options.spinner.show();
            }
            this.propagate('disable');
        },
        stopUpdating: function() {
            var mark = this.mark;
            if(mark != null && (+(new Date) - mark) < 1000) {
                setTimeout(this.stopUpdating, 500);
            } else {
                this.propagate('enable');
                if(this.options.spinner) {
                    this.options.spinner.hide();
                }
            }
            this.mark = null;
        },
        update: function() {
            var events = this.events, widgets = this.options.widgets, handler = this.updateModel;
            this._super();

            events.reset();
            if(this.options.bindings != null) {
                $.each(this.options.bindings, function(i, binding) {
                    if(binding.event != null) {
                        var widget = widgets[binding.widget];
                        if(widget != null) {
                            events.on(widget.$node, binding.event, binding, handler);
                        }
                    }
                });
            }

            if(this.options.spinner == null) {
                var spinner = this.$node.find('[class*=widget-loading]');
                if(spinner.length) {
                    this.options.spinner = spinner;
                }
            }
        },
        updateModel: function(event) {
            var self = this, binding = event.data, deferred;
            self.reset();
            self.startUpdating();
            if(binding.action) {
                deferred = binding.action(self.model);
            } else {
                var widget = self.options.widgets[binding.widget];
                if(widget != null) {
                    var model = self.toModelObject(binding.mapping || binding.field, widget.getValue());
                    deferred = self.model.push(model);
                }
            }
            if(deferred != null) {
                deferred.always(self.stopUpdating).fail(function(response) {
                    if(self.options.errorHandler != null) {
                        self.options.errorHandler(self, response);
                    } else {
                        if(response.structural_errors != null) {
                            self._handleStructuralErrors(response.structural_errors);
                        }
                    }
                });
            }
        },
        _handleStructuralErrors: function(response) {
            var self = this, errorList = this.options.errorList;
            $.each(response, function(field, errors) {
                var widget = self.getWidgetForField(field);
                if(widget != null) {
                    widget.setStatus('error');
                }
                if(errorList != null && isArray(errors)) {
                    $.each(errors, function(i, error) {
                        if(error.message != null) {
                            errorList.append('error', error.message);
                        }
                    });
                }
            });
        }
    });
});
