define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/form',
    'vendor/gloss/widgets/textbox',
    'text!vendor/gloss/widgets/grid/editable.html',
    'link!vendor/gloss/widgets/grid/editable.css'
], function($, _, Widget, Form, TextBox, editableTmpl) {
    var RowForm = Form.extend({
        defaults: { widgetize: false },
        updateModel: function(model) {
            var values = this.getBoundValues();
            if (this.options.staticValues) {
                $.extend(values, this.options.staticValues);
            }
            model.set(values);
            // don't actually save the model
            return $.Deferred().resolve(model);
        }
    });

    return {
        formTemplate: _.template(editableTmpl),

        __mixin__: function(base, prototype, mixin) {
            _.each(prototype.defaults.colModel, function(col) {
                if (col.editable) {
                    if (!_.isObject(col.editable)) {
                        col.editable = {};
                    }
                    if (! col.editable.toForm) {
                        col.editable.toForm = 'toForm';
                    }
                }
            });
        },

        _bindReturnKeyPressToNextLine: function() {
            var self = this;
            self.form.on('keypress', function(evt) {
                var grid = self.options.grid, nextRow, i, l, row;
                if (Widget.identifyKeyEvent(evt) === 'enter') {
                    i = self.options.idx+1;
                    l = grid.options.rows.length; 
                    for (; i < l; i++) {
                        row = grid.options.rows[i];
                        if (row.$node.is(':visible')) {
                            nextRow = row;
                            break;
                        }
                    }
                    // nextRow = grid.options.rows[self.options.idx+1];
                    if (nextRow) {
                        evt.preventDefault();
                        self.form.trigger('submit');
                        nextRow.edit();
                    }
                }
            });
        },

        _bindLastWidgetTabToNextLine: function(widget) {
            var self = this;
            widget.on('keydown', function(evt) {
                var grid = self.options.grid, nextRow;
                if (Widget.identifyKeyEvent(evt) === 'tab' && !evt.shiftKey) {
                    self.form.trigger('submit');
                    nextRow = grid.options.rows[self.options.idx+1];
                    if (nextRow) {
                        evt.preventDefault();
                        nextRow.edit();
                    }
                }
            });
        },

        _editing: function() {
            return this.form != null;
        },

        _getBindings: function() {
            return _.reduce(this.options.colModel, function(bindings, col) {
                if (col.editable) {
                    bindings.push({widget: col.name, field: col.name});
                }
                return bindings;
            }, []);
        },

        edit: function() {
            if (this._editing()) {
                return;
            }
            var self = this, tableWidth, lastWidget,
                formWidgets = {},
                $form = $(self.formTemplate({
                    colModel: self.options.colModel,
                    row: self
                })),
                $table = $form.find('table'),
                $formCols = $table.find('td');
            self.options.grid.unhighlight();
            $formCols.each(function(i, el) {
                var widget, col = self.options.colModel[i];
                if (col.editable) {
                    widget = lastWidget = self[col.editable.toForm](col);
                    formWidgets[widget.$node.attr('name')] = widget;
                    widget.appendTo(el);
                }
            });
            if (lastWidget) {
                self._bindLastWidgetTabToNextLine(lastWidget);
            }
            $form.position({
                my: 'left top',
                at: 'left top',
                of: self.$node
            }).css({
                position: 'absolute' // b/c of IE
            });
            self.form = (self.options.rowFormClass || RowForm)($form, {
                modelClass: self.options.modelClass,
                bindings: self._getBindings(),
                widgets: formWidgets
            }).on('submit', function() {
                self.stopEdit();
            }).on('keyup', function(e) {
                if (e.keyCode === 27) {
                    self.stopEdit();
                }
            }).bind(self.options.model);
            tableWidth = Widget.measureMatchingWidth($table, self.options.grid.$table);
            $table.width(tableWidth);
            if (self.options.idx % 2 === 0) {
                $form.addClass('odd');
            }
            self.$node.find('td').each(function(i, el) {
                $formCols.eq(i).width($(el).width());
            });
            self.form.$node.find('tr').css({
                backgroundColor: self.$node.css('backgroundColor')
            });
            self._bindReturnKeyPressToNextLine();
            self.form.appendTo(self.options.grid.$node);
            _.values(self.form.options.widgets)[0].$node.focus();
            return self;
        },

        stopEdit: function() {
            if (!this._editing()) {
                return;
            }
            this.registry.remove(this.form);
            this.form.$node.remove();
            this.trigger('stopedit');
            delete this.form;
            this.render();
            return this;
        },

        toForm: function(col) {
            var $node = $('<input type=text>')
                .attr('name', col.name)
                .val(this.options.model[col.name]);

            return TextBox($node);
        }
    };
});
