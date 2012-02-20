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
            _.each(base.defaults.colModel, function(col) {
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

        _getBindings: function() {
            return _.reduce(this.options.colModel, function(bindings, col) {
                if (col.editable) {
                    bindings.push({widget: col.name, field: col.name});
                }
                return bindings;
            }, []);
        },

        // _getColWidths: function() {
        //     return this.$node.find('.td').map(function(i, el) {
        //         return $(el).outerWidth();
        //     });
        // },

        // _setColWidths: function(widths) {
        //     this.$node.find('.td').each(function(i, el) {
        //         $(el).outerWidth(widths[i]);
        //     });
        // },

        // hack to get table-cell rendering working correctly on webkit
        _tableCellHack: function() {
            var self = this,
                $siblings = $(null).add(self.$node.prev()).add(self.$node.next());
            self.$node.addClass('invisible');
            $siblings.removeClass('tr');
            setTimeout(function() {
                $siblings.addClass('tr');
                self.$node.removeClass('invisible');
            }, 0);
        },

        edit: function() {
            var self = this,
                $form = $(self.formTemplate({
                    colModel: self.options.colModel,
                    row: self
                })),
                $formCols = $form.children();
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
            }).width(Widget.measureMatchingWidth($form, self.$node));
            if (self.options.idx % 2 === 0) {
                $form.addClass('odd');
            }
            self.$node.find('td').each(function(i, el) {
                // why 3?!?!?!!!!
                $formCols.eq(i).outerWidth($(el).outerWidth() - 3);
            });
            self.form.appendTo(self.options.grid.$node);
        },

        stopEdit: function() {
            this.registry.remove(this.form);
            this.form.$node.remove();
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
