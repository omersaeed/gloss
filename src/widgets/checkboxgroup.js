define([
    'path!vendor:underscore',
    'path!gloss:widgets/formwidget',
    'path!gloss:widgets/collectionviewable',
    'path!gloss:widgets/checkbox',
    'path!gloss:tmpl!widgets/checkboxgroup/checkboxgroup.mtpl'
], function(_, FormWidget, CollectionViewable, CheckBox, template) {
    return FormWidget.extend({
        defaults: {
            template: template,
            translate: function(model) {
                return {name: model.name, value: model.id};
            }
        },

        create: function() {
            this._super();
            this.update();
        },

        getValue: function() {
            return _.filter(
                _.map(this.checkboxes, function(cb) {
                    return cb.getValue()? cb.options.value : null;
                }),
                _.identity
            );
        },

        setValue: function(array) {
            _.each(this.checkboxes, function(cb) {
                cb.setValue(_.indexOf(array, cb.options.value) >= 0);
            });
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
                this.$node.html(template(this))
                    .find('input[type=checkbox]').each(function(i, el) {
                        checkboxes.push(CheckBox(el, {
                            value: options.entries[i].value,
                            name: options.entries[i].name
                        }));
                    });
            }
        }
    }, {mixins: [CollectionViewable]});
});
