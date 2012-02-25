define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/form',
    'text!vendor/gloss/widgets/grid/editable.html',
    'link!vendor/gloss/widgets/grid/editable.css'
], function($, _, Widget, Form, editableTmpl) {
    var RowForm = Form.extend({
        defaults: { widgetize: true },
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
                $form = $(self.formTemplate({
                    colModel: self.options.colModel,
                    row: self
                })),
                $table = $form.find('table'),
                $formCols = $table.find('td');
            self.form = (self.options.rowFormClass || RowForm)($form, {
                modelClass: self.options.modelClass,
                bindings: self._getBindings()
            }).on('submit', function() {
                self.stopEdit();
            }).on('keyup', function(e) {
                if (e.keyCode === 27) {
                    self.stopEdit();
                }
            }).bind(self.options.model);
            $form.position({
                my: 'left top',
                at: 'left top',
                of: self.$node
            }).css({
                position: 'absolute' // b/c of IE
            });
            tableWidth = Widget.measureMatchingWidth($table, self.options.grid.$table);
            $table.width(tableWidth);
            if (self.options.idx % 2 === 0) {
                $form.addClass('odd');
            }
            self.$node.find('td').each(function(i, el) {
                $formCols.eq(i).width($(el).width());
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
            return [
                '<input type=text name="',
                col.name,
                '" value="',
                this.options.model[col.name],
                '" />'
            ].join('');
        }
    };
});
