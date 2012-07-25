define([
    'vendor/jquery',
    'vendor/underscore',
    './../core/eventset',
    './widgetgroup'
], function($, _, EventSet, WidgetGroup) {
    var isArray = $.isArray, isFunction = _.isFunction, isPlainObject = $.isPlainObject, isString = _.isString;
    return WidgetGroup.extend({
        defaults: {
            bindings: null,
            debounceTime: 1000,
            mappings: null,
            messageList: null,
            modelClass: null,
            showStructuralErrors: true,
            spinner: null,
            staticValues: null
        },

        create: function() {
            this._super();
            this.events = EventSet();
            this.model = null;

            if (this.options.bindings == null) {
                this.options.bindings = {};
            }
            if (this.options.mappings == null) {
                this.options.mappings = {};
            }
            this.update();
        },
        
        _onModelChange: function(eventType, model, changed) {
            _.each(self.options.bindings, function(binding) {
                if (typeof changed[boundField] !== 'undefined') {
                    binding.widgetInstance.setValue(model.getAttributeValue(boundField));
                }
            });
        },

        bind: function(model) {
            this.resetWidgets();
            this.model = model;
            this.bindModel();
            return this;
        },

        bindModel: function() {
            var self = this, widgets = this.options.widgets;
            $.each(self.options.bindings, function(i, binding) {
                if (binding.bound !== false) {
                    var name = binding.mapping || binding.field;
                    if (name != null) {
                        var value = self.getModelValue(name);
                        if (binding.widget != null) {
                            var widget = widgets[binding.widget];
                            if (widget != null) {
                                widget.setValue(value, true);
                            }
                        } else if (binding.node != null) {
                            self.$node.find(binding.node).html(_.escape(value || ''));
                        }
                    }
                }
            });
            self.propagate('bind', self.model);
            self.model.on('change', self._onModelChange);
            return this;
        },

        getBoundValues: function() {
            var self = this, values = {};
            $.each(self.options.bindings, function(i, binding) {
                var widget = binding.widgetInstance;
                if (widget) {
                    $.extend(values, self.toModelObject(binding.mapping || binding.field,
                        widget.getValue()));
                }
            });
            return values;
        },

        getModel: function() {
            if (!this.model && this.options.modelClass) {
                this.model = this.options.modelClass();
                this.bindModel();
            }
            return this.model;
        },

        getModelValue: function(name) {
            var model = this.model, mapping, value;
            if (model == null || name == null) {
                return;
            }

            mapping = this.options.mappings[name];
            if (isPlainObject(mapping)) {
                value = {};
                $.each(mapping, function(attr, field) {
                    value[attr] = model[field];
                });
            } else if (isFunction(mapping)) {
                value = mapping('getValue', model, name);
            } else if (isString(mapping)) {
                value = model[mapping];
            } else {
                value = model[name];
            }
            return value;
        },

        getWidgetForField: function(field) {
            return this.fieldToWidget[field];
        },

        initiateUpdate: function(updater) {
            var self = this, model = this.getModel(), deferred = $.Deferred();
            if (!model) {
                throw new Error('no model for update');
            }

            self.resetWidgets().startUpdating();
            updater(model).then(
                function(model) {
                    self.stopUpdating(function() {
                        deferred.resolve(model);
                    });
                },
                function(response) {
                    self.stopUpdating(function() {
                        deferred.reject(model, response);
                    });
                }
            );
            return deferred;
        },

        processErrors: function(model, response) {
            var self = this,
                messageList = this.options.messageList,
                globalErrors = response[0],
                structuralErrors = response[1];
            if (structuralErrors) {
                if (self.options.structuralErrorHandler) {
                    self.options.structuralErrorHandler(self, structuralErrors);
                } else {
                    $.each(structuralErrors, function(field, errors) {
                        var widget = self.getWidgetForField(field), messages;
                        if (isArray(errors)) {
                            messages = _.pluck(errors, 'message');
                        }
                        if (widget != null) {
                            widget.invoke('setStatus', 'invalid', messages);
                        }
                        if (messageList && messages && self.options.showStructuralErrors) {
                            messageList.append('invalid', messages);
                        }
                    });
                }
            }
            if (globalErrors && messageList) {
                messageList.append('invalid', _.pluck(globalErrors, 'message'));
            }
        },

        resetWidgets: function() {
            if (this.options.messageList != null) {
                this.options.messageList.clear();
            }
            this.propagate('setStatus', null);
            return this;
        },

        startUpdating: function() {
            this.mark = +(new Date);
            if (this.options.spinner) {
                this.options.spinner.show();
            }
            this.propagate('disable');
            return this;
        },

        stopUpdating: function(callback) {
            var mark = this.mark, delta = this.options.debounceTime;
            if (mark != null && (+(new Date) - mark) < delta) {
                var stopUpdating = this.stopUpdating;
                if (isFunction(callback)) {
                    setTimeout(function() {
                        stopUpdating(callback)
                    }, delta/2);
                } else {
                    setTimeout(stopUpdating, delta/2);
                }
            } else {
                this.propagate('enable');
                if (this.options.spinner) {
                    this.options.spinner.hide();
                }
                if (isFunction(callback)) {
                    callback();
                }
            }
            this.mark = null;
            return this;
        },
        
        toModelObject: function(name, value) {
            var mapping = this.options.mappings[name], model = {};
            if (isPlainObject(mapping)) {
                $.each(mapping, function(attr, field) {
                    model[field] = value[attr];
                });
            } else if (isFunction(mapping)) {
                model = mapping('toObject', name, value);
            } else if (isString(mapping)) {
                model[mapping] = value;
            } else {
                model[name] = value;
            }
            return model;
        },

        unbind: function() {
            this.model = null;
            this.propagate('unbind');
            return this;
        },

        updateWidget: function(updated) {
            var self = this;

            if (updated.bindings || updated.mappings || updated.widgets) {
                var mappings = this.options.mappings, widgets = this.options.widgets;
                self.events.reset();

                self.fieldToWidget = {};
                $.each(self.options.bindings, function(i, binding) {
                    var mapping;
                    if (binding.widget != null) {
                        binding.widgetInstance = widgets[binding.widget];
                        if (binding.widgetInstance != null) {
                            if (binding.mapping != null) {
                                mapping = mappings[binding.mapping];
                            } else {
                                mapping = binding.field;
                            }
                            if (isPlainObject(mapping)) {
                                $.each(mapping, function(attr, field) {
                                    self.fieldToWidget[field] = binding.widgetInstance;
                                });
                            } else if (isString(mapping)) {
                                self.fieldToWidget[mapping] = binding.widgetInstance;
                            }
                            if (binding.event != null) {
                                self.events.on(binding.widgetInstance.$node, binding.event,
                                    binding, self.updateModelByBinding);
                            }
                        }
                    }
                });
            }

            if (updated.spinner) {
                if (self.options.spinner == null) {
                    var spinner = self.$node.find('[class*=widget-loading]');
                    if (spinner.length >= 1) {
                        self.options.spinner = spinner;
                    }
                }
            }
        },

        updateModelByBinding: function(event) {
            var self = this, binding = event.data, deferred;
            self.initiateUpdate(function(model) {
                if (binding.action) {
                    return binding.action(model);
                } else {
                    return model.push(self.toModelObject(binding.mapping || binding.field,
                        binding.widgetInstance.getValue()));
                }
            }).fail(self.processErrors);
        }
    });
});
