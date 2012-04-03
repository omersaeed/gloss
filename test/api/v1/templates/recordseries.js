define([
    'vendor/gloss/data/model',
    'vendor/gloss/data/fields'
], function(model, fields) {
    Model = Model.extend({
        update_tree: function(params) {
            return this._initiateRequest('update_tree', params);
        },

        construct: function() {
            var last_run = this.last_run;
            if(last_run != null) {
                this.statistics = {
                    'identified': last_run.identified_count,
                    'up_to_date': last_run.identified_up_to_date
                };
                if (last_run.status !== 'neverrun') {
                    this.statistics.acted_on = last_run.success_count + last_run.warning_count;
                } else {
                    this.statistics.acted_on = 0;
                }
            }
            if(this.retention_period != null) {
                this.retention = this.retention_period + ' ' + this.retention_period_units;
            } else {
                this.retention = '';
            }
            this.proper_status = (this.valid) ? this.status : null;
        }
    });
});
