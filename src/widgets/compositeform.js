define([
    'vendor/jquery',
    'vendor/underscore',
    './form'
], function($, _, Form) {
    return Form.extend({
        defaults: {
            boundWidgetGroups: null
        },

        create: function() {
            var self = this;
            self._super();
            if (self.options.boundWidgetGroups == null) {
                self.options.boundWidgetGroups = {};
            }
        },

        // we need to override this from boundwidgetgroup.js
        getModel: function() {
            return _.map(this.groups() || [], function(group) {
                return group.getModel();
            });
        },

        getWidget: function(widget) {
            return _.filter(_.map(this.options.boundWidgetGroups, function(item) {
                return item.group.getWidget(widget);
            }), _.identity)[0];
        },

        groups: function(which) {
            if (typeof which === 'undefined') {
                return _.reduce(this.options.boundWidgetGroups, function(groups, item) {
                    groups[item.name] = item.group;
                    return groups;
                }, {});
            } else {
                return (_.find(this.options.boundWidgetGroups, function(group) {
                    return group.name === which;
                }) || {}).group;
            }
        },

        processErrors: function(model, response) {
            _.each(this.groups(), function(group) {
                group.processErrors(group.getModel(), response);
            });
            this._super.apply(this, arguments);
        },

        updateModel: function() {
            var self = this, dfd = $.Deferred(), count = 0,
                updateWidget = Form.constructor.prototype.updateModel,
                groups = _.pluck(self.options.boundWidgetGroups, 'group').reverse(),
                runOne = function() {
                    if (! groups.length) {
                        dfd.resolve();
                    } else {
                        updateWidget.call(groups.pop()).then(runOne, dfd.reject);
                    }
                };
            runOne();
            return dfd;
        }
    });
});
