define([
    'vendor/gloss/data/model',
    'vendor/gloss/data/fields',
    'api/v1/recordseries'
], function(model, fields, RecordSeries) {

var Model = model.Model.extend({__name__:"fileplan",__requests__:{get_tree:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Sequence({item:fields.Structure({structure:{status:fields.EnumerationField({name:"status",enumeration:["disabled","enabled"]}),retention_period_units:fields.EnumerationField({name:"retention_period_units",enumeration:["days","weeks","months","years"]}),name:fields.TextField({required:true,name:"name"}),path_linked:fields.BooleanField({name:"path_linked"}),target_volume_id:fields.IntegerField({name:"target_volume_id"}),last_run:fields.Structure({name:"last_run",structure:{status:fields.EnumerationField({name:"status",enumeration:["ok","warnings","errors","failed","inprogress","neverrun"]}),warning_count:fields.IntegerField({name:"warning_count"}),identified_count:fields.IntegerField({name:"identified_count"}),identified_up_to_date:fields.BooleanField({name:"identified_up_to_date"}),success_count:fields.IntegerField({name:"success_count"}),error_count:fields.IntegerField({name:"error_count"}),date:fields.DateTimeField({name:"date"})}}),id:fields.IntegerField({required:true,name:"id"}),isparent:fields.BooleanField({required:true,name:"isparent"}),parent_id:fields.IntegerField({name:"parent_id"}),retention_period:fields.IntegerField({name:"retention_period"}),valid:fields.BooleanField({name:"valid"}),frequency:fields.TextField({name:"frequency"}),target_volume_profile_id:fields.IntegerField({name:"target_volume_profile_id"}),action:fields.EnumerationField({name:"action",enumeration:["copy","move"]}),path:fields.TextField({name:"path"}),children:fields.RecursiveField({name:"children"})}}),name:"response"})}},url:"/api/v1/fileplan/[[id]]/tree",token:"[[id]]",schema:fields.Structure({name:"request",structure:{path:fields.TextListField({min_length:1,separator:",",name:"path"}),id:fields.IntegerField({name:"id"}),recursive:fields.BooleanField({default_value:true,name:"recursive"})}}),method:"GET",name:"get_tree"}),get:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{imports:fields.Sequence({item:fields.Structure({structure:{status:fields.EnumerationField({name:"status",enumeration:["running","completed","cancelled","failed"]}),volume_path:fields.TextField({name:"volume_path"}),id:fields.IntegerField({name:"id"}),volume_name:fields.TextField({name:"volume_name"}),volume_id:fields.IntegerField({name:"volume_id"})}}),name:"imports"}),locked:fields.BooleanField({default_value:false,name:"locked"}),id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({min_length:1,required:true,name:"name"}),description:fields.TextField({name:"description"})}})}},url:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"}),update_tree:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Sequence({item:fields.Structure({structure:{id:fields.IntegerField({name:"id"}),children:fields.RecursiveField({name:"children"})}}),name:"response"})}},url:"/api/v1/fileplan/[[id]]/tree",token:"[[id]]",schema:fields.Sequence({item:fields.Structure({structure:{name:fields.TextField({min_length:1,required:true,name:"name"}),path_linked:fields.BooleanField({name:"path_linked"}),target_volume_id:fields.IntegerField({name:"target_volume_id"}),id:fields.IntegerField({name:"id"}),target_volume_profile_id:fields.IntegerField({name:"target_volume_profile_id"}),path:fields.TextField({name:"path"}),operation:fields.ConstantField({default_value:"delete",name:"operation",value:"delete"}),children:fields.RecursiveField({name:"children"})}}),name:"request"}),method:"POST",name:"update_tree"}),create:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/fileplan",token:"[[id]]",schema:fields.Structure({name:"request",structure:{description:fields.TextField({name:"description"}),name:fields.TextField({min_length:1,required:true,name:"name"})}}),method:"POST",name:"create"}),update:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{description:fields.TextField({name:"description"}),name:fields.TextField({min_length:1,name:"name"})}}),method:"POST",name:"update"}),get_path:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Sequence({item:fields.Sequence({item:fields.IntegerField({})}),name:"response"})}},url:"/api/v1/fileplan/[[id]]/path",token:"[[id]]",schema:fields.Structure({name:"request",structure:{query:fields.TextField({name:"query"}),limit:fields.IntegerField({name:"limit"}),id:fields.IntegerField({name:"id"})}}),method:"GET",name:"get_path"}),query:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{total:fields.IntegerField({minimum:0,name:"total"}),resources:fields.Sequence({item:fields.Structure({structure:{imports:fields.Sequence({item:fields.Structure({structure:{status:fields.EnumerationField({name:"status",enumeration:["running","completed","cancelled","failed"]}),volume_path:fields.TextField({name:"volume_path"}),id:fields.IntegerField({name:"id"}),volume_name:fields.TextField({name:"volume_name"}),volume_id:fields.IntegerField({name:"volume_id"})}}),name:"imports"}),locked:fields.BooleanField({default_value:false,name:"locked"}),id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({min_length:1,required:true,name:"name"}),description:fields.TextField({name:"description"})}}),required:true,name:"resources"})}})}},url:"/api/v1/fileplan",token:"[[id]]",schema:fields.Structure({name:"request",structure:{sort:fields.QuerySortField({name:"sort"}),query:fields.TextField({name:"query"}),limit:fields.IntegerField({minimum:1,name:"limit"}),offset:fields.IntegerField({minimum:0,name:"offset"})}}),method:"GET",name:"query"}),"delete":model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{}}),method:"DELETE",name:"delete"}),clone:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{operation:fields.ConstantField({default_value:"clone",required:true,name:"operation",value:"clone"}),name:fields.TextField({name:"name"})}}),method:"POST",name:"clone"}),permissions:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Sequence({item:fields.Structure({structure:{granted:fields.BooleanField({name:"granted"}),permission:fields.TextField({name:"permission"})}}),name:"response"})}},url:"/api/v1/fileplan/[[id]]/permissions",token:"[[id]]",method:"GET",name:"permissions"})}});


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


return Model;

});