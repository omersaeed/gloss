define([
    'path!mesh:model',
    'path!mesh:fields',
    'path!mesh:request',
    'path!gloss:test/api/v1/recordseries'
], function(model, fields, Request, RecordSeries) {

var Model = model.Model.extend({__name__:"fileplan",__requests__:{get_tree:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.SequenceField({item:fields.StructureField({structure:{status:fields.EnumerationField({name:"status",enumeration:["disabled","enabled"]}),retention_period_units:fields.EnumerationField({name:"retention_period_units",enumeration:["days","weeks","months","years"]}),name:fields.TextField({required:true,name:"name"}),path_linked:fields.BooleanField({name:"path_linked"}),target_volume_id:fields.IntegerField({name:"target_volume_id"}),last_run:fields.StructureField({name:"last_run",structure:{status:fields.EnumerationField({name:"status",enumeration:["ok","warnings","errors","failed","inprogress","neverrun"]}),warning_count:fields.IntegerField({name:"warning_count"}),identified_count:fields.IntegerField({name:"identified_count"}),identified_up_to_date:fields.BooleanField({name:"identified_up_to_date"}),success_count:fields.IntegerField({name:"success_count"}),error_count:fields.IntegerField({name:"error_count"}),date:fields.DateTimeField({name:"date"})}}),id:fields.IntegerField({required:true,name:"id"}),isparent:fields.BooleanField({required:true,name:"isparent"}),parent_id:fields.IntegerField({name:"parent_id"}),retention_period:fields.IntegerField({name:"retention_period"}),valid:fields.BooleanField({name:"valid"}),frequency:fields.TextField({name:"frequency"}),target_volume_profile_id:fields.IntegerField({name:"target_volume_profile_id"}),action:fields.EnumerationField({name:"action",enumeration:["copy","move"]}),path:fields.TextField({name:"path"})}}),name:"response"})}},path:"/api/v1/fileplan/[[id]]/tree",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{path:fields.TextField({min_length:1,separator:",",name:"path"}),id:fields.IntegerField({name:"id"}),recursive:fields.BooleanField({default_value:true,name:"recursive"})}}),method:"GET",name:"get_tree"}),get:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{imports:fields.SequenceField({item:fields.StructureField({structure:{status:fields.EnumerationField({name:"status",enumeration:["running","completed","cancelled","failed"]}),volume_path:fields.TextField({name:"volume_path"}),id:fields.IntegerField({name:"id"}),volume_name:fields.TextField({name:"volume_name"}),volume_id:fields.IntegerField({name:"volume_id"})}}),name:"imports"}),locked:fields.BooleanField({default_value:false,name:"locked"}),id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({min_length:1,required:true,name:"name"}),description:fields.TextField({name:"description"})}})}},path:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"}),update_tree:Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.SequenceField({item:fields.StructureField({structure:{id:fields.IntegerField({name:"id"})}}),name:"response"})}},path:"/api/v1/fileplan/[[id]]/tree",token:"[[id]]",schema:fields.SequenceField({item:fields.StructureField({structure:{name:fields.TextField({min_length:1,required:true,name:"name"}),path_linked:fields.BooleanField({name:"path_linked"}),target_volume_id:fields.IntegerField({name:"target_volume_id"}),id:fields.IntegerField({name:"id"}),target_volume_profile_id:fields.IntegerField({name:"target_volume_profile_id"}),path:fields.TextField({name:"path"})}}),name:"request"}),method:"POST",name:"update_tree"}),create:Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},path:"/api/v1/fileplan",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{description:fields.TextField({name:"description"}),name:fields.TextField({min_length:1,required:true,name:"name"})}}),method:"POST",name:"create"}),update:Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},path:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{description:fields.TextField({name:"description"}),name:fields.TextField({min_length:1,name:"name"})}}),method:"POST",name:"update"}),get_path:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.SequenceField({item:fields.SequenceField({item:fields.IntegerField({})}),name:"response"})}},path:"/api/v1/fileplan/[[id]]/path",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{query:fields.TextField({name:"query"}),limit:fields.IntegerField({name:"limit"}),id:fields.IntegerField({name:"id"})}}),method:"GET",name:"get_path"}),query:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{total:fields.IntegerField({minimum:0,name:"total"}),resources:fields.SequenceField({item:fields.StructureField({structure:{imports:fields.SequenceField({item:fields.StructureField({structure:{status:fields.EnumerationField({name:"status",enumeration:["running","completed","cancelled","failed"]}),volume_path:fields.TextField({name:"volume_path"}),id:fields.IntegerField({name:"id"}),volume_name:fields.TextField({name:"volume_name"}),volume_id:fields.IntegerField({name:"volume_id"})}}),name:"imports"}),locked:fields.BooleanField({default_value:false,name:"locked"}),id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({min_length:1,required:true,name:"name"}),description:fields.TextField({name:"description"})}}),required:true,name:"resources"})}})}},path:"/api/v1/fileplan",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{query:fields.TextField({name:"query"}),limit:fields.IntegerField({minimum:1,name:"limit"}),offset:fields.IntegerField({minimum:0,name:"offset"})}}),method:"GET",name:"query"}),"delete":Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},path:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{}}),method:"DELETE",name:"delete"}),clone:Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},path:"/api/v1/fileplan/[[id]]",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{name:fields.TextField({name:"name"})}}),method:"POST",name:"clone"}),permissions:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.SequenceField({item:fields.StructureField({structure:{granted:fields.BooleanField({name:"granted"}),permission:fields.TextField({name:"permission"})}}),name:"response"})}},path:"/api/v1/fileplan/[[id]]/permissions",token:"[[id]]",method:"GET",name:"permissions"})}});


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
