define([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!gloss:widgets/formwidget',
    'path!gloss:widgets/collectionviewable'
], function($, _, FormWidget, CollectionViewable) {
    return FormWidget.extend({
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
            this.update();
        },
        setValue: function(newValue) {
            // PP-1973 when a select element's value is set to 'null' in IE8,
            // FF and webkit, the box assumes the value of the first option.
            // in IE9 however, it's value becomes null.  we abstract this
            // difference here
            var values;
            if (newValue == null) {
                values = this.$node.find('option').map(function(i, el) {
                    return $(el).val();
                });
                if (_.indexOf(values, newValue) < 0) {
                    return this._super(values[0]);
                }
            }
            return this._super(newValue);
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
