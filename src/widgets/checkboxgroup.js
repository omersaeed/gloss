define([
    'path!vendor:underscore',
    'path!gloss:widgets/formwidget',
    'path!gloss:widgets/collectionviewable',
    'path!gloss:tmpl!widgets/checkboxgroup/checkboxgroup.mtpl'
], function(_, FormWidget, CollectionViewable, template) {
    return FormWidget.extend({
        defaults: {
            template: template,
            translate: function(model) {
                return {name: model.name, value: model.id};
            }
        },

        create: function() {
            this.update();
        },

        getValue: function() {
            return _.filter(
                this.$node.find('input[type=checkbox]').map(function(i, el) {
                    return el.checked? el.getAttribute('data-value') : null;
                }),
                _.identity
            );
        },

        setValue: function(array) {
            var stringified = _.map(array, function(i) { return ''+i; });
            this.$node.find('input[type=checkbox]').each(function(i, el) {
                if (_.indexOf(stringified, el.getAttribute('data-value')) >= 0) {
                    el.checked = true;
                }
            });
            return this;
        },

        updateWidget: function(updated) {
            var options = this.options;

            if (updated.models) {
                this.set('entries', _.map(options.models, options.translate));
            }

            if (updated.entries) {
                this.$node.html(template(this));
            }
        }
    }, {mixins: [CollectionViewable]});
});
