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
            var self = this, tableWidth,
                formWidgets = {},
                $form = $(self.formTemplate({
                    colModel: self.options.colModel,
                    row: self
                })),
                $table = $form.find('table'),
                $formCols = $table.find('td');
            $formCols.each(function(i, el) {
                var widget, col = self.options.colModel[i];
                if (col.editable) {
                    widget = self[col.editable.toForm](col);
                    formWidgets[widget.$node.attr('name')] = widget;
                    widget.appendTo(el);
                }
            });
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
            self.form.appendTo(self.options.grid.$node);
            _.values(self.form.options.widgets)[0].$node.focus();
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
        },

        toForm: function(col) {
            var $node = $('<input type=text>')
                .attr('name', col.name)
                .attr('value', this.options.model[col.name]);

            return TextBox($node);
        }
    };
});
