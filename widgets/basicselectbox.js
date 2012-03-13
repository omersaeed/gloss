define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/formwidget',
    'vendor/gloss/widgets/collectionviewable'
], function($, _, FormWidget, CollectionViewable) {
    return FormWidget.extend({
        managedStates: _.filter(FormWidget.prototype.managedStates, function(s) {
            return s !== 'hover';
        }),
        defaults: {
            translator: function(model) {
                return {value: model.id, content: model.name};
            },
            width: null
        },
        nodeTemplate: '<select></select>',
        optionsTemplate: _.template([
            '<% _.each(entries, function(entry) { %>',
                '<option value="<%= entry.value %>">',
                    '<%= entry.content %>',
                '</option>',
            '<% }); %>'
        ].join('')),
        create: function() {
            this._super();
            this.$node.addClass('selectbox');
            this.$node.addClass('hover');
            this.update();
        },
        updateWidget: function(updated) {
            var self = this, options = self.options;
            if (updated.models) {
                self.set('entries', _.map(options.models, function(model) {
                    return options.translator.call(self, model);
                }));
            }
            if (updated.entries) {
                self.$node.html(self.optionsTemplate(options));
            }
            if (updated.width && options.width != null) {
                self.$node.width(options.width);
            }
        }
    }, {mixins: [CollectionViewable]});
});
