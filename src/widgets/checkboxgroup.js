define([
    'vendor/underscore',
    './formwidget',
    './collectionviewable',
    './checkbox',
    'tmpl!./checkboxgroup/checkboxgroup.mtpl'
], function(_, FormWidget, CollectionViewable, CheckBox, template) {
    return FormWidget.extend({
        defaults: {
            template: template,
            translate: function(model) {
                return {name: model.name, value: model.id};
            }
        },

        create: function() {
            var self = this;
            this._super();
            this.$node.find('input[type=checkbox]').each(function(i, el) {
                if (!self.registry.isWidget(el)) {
                    (self.checkboxes = self.checkboxes || []).push(CheckBox(el));
                }
            });
            this.update();
        },

        getValue: function() {
            return _.filter(
                _.map(this.checkboxes, function(cb) {
                    return cb.getValue()? cb.options.value : null;
                }),
                function(v) { return v !== null; }
            );
        },

        setValue: function(array, silent) {
            var cur = this.getValue().sort();
            if (_.isString(array)) {
                if (array === 'all') {
                    array = _.map(this.checkboxes, function(cb) {
                        return cb.options.value;
                    });
                } else {
                    array = [];
                }
            }
            array = array.slice(0).sort();
            if (!_.isEqual(cur, array)) {
                _.each(this.checkboxes, function(cb) {
                    cb.setValue(_.indexOf(array, cb.options.value) >= 0, true);
                });
                if (!silent) {
                    this.trigger('change');
                }
            }
            return this;
        },

        updateWidget: function(updated) {
            var options = this.options, checkboxes;

            if (updated.models) {
                this.set('entries', _.map(options.models, options.translate));
            }

            if (updated.entries) {
                _.each(this.checkboxes || [], function(cb) { cb.destroy(); });
                this.checkboxes = checkboxes = [];
                this.$node.html(options.template(this))
                    .find('input[type=checkbox]').each(function(i, el) {
                        checkboxes.push(CheckBox(el, {
                            value: options.entries[i].value,
                            name: options.entries[i].name,
                            initialValue: options.entries[i].checked
                        }));
                    });
            }
        }
    }, {mixins: [CollectionViewable]});
});
