define([
    'vendor/gloss/data/model',
    'vendor/gloss/data/fields',
    'api/v1/recordseries'
], function(model, fields, RecordSeries) {
    Model = Model.extend({
        getPath: function(query, limit) {
            var params = {query: query};
            if (limit != null) {
                params.limit = limit;
            }
            return this._initiateRequest('get_path', params);
        },
        getTree: function(params) {
            var self = this, params = params || {};
            return self._initiateRequest('get_tree', params).pipe(function(data) {
                self._instantiateSeries(data);
                return data;
            });
        },

        setTree: function(params) {
            return self._initiateRequest('set_tree', params);
        },
        _instantiateSeries: function(candidates) {
            var manager = RecordSeries.models, model;
            for(var i = 0, l = candidates.length; i < l; i++) {
                model = manager.instantiate(candidates[i], true);
                candidates[i] = model;
                if(model.children != null && model.children.length > 0) {
                    this._instantiateSeries(model.children);
                }
            }
        },
        getPermissions: function() {
            return this._initiateRequest('permissions', {});
        },
        clone: function(params) {
            var params = params || {};
            params.operation = 'clone';
        	return this._initiateRequest('clone', params);
        }
    });
});
