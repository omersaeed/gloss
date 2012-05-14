define([
    'component!mesh:model',
    'component!mesh:fields'
], function(model, fields) {

var Model = model.Model.extend({__name__:"documentumprofileoptions",__requests__:{get:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{rps_markups:fields.Sequence({item:fields.Structure({structure:{type:fields.TextField({name:"type"}),name:fields.TextField({name:"name"})}}),name:"rps_markups"}),acls:fields.Sequence({item:fields.Structure({structure:{owner:fields.TextField({name:"owner"}),name:fields.TextField({name:"name"})}}),name:"acls"}),id:fields.IntegerField({required:true,name:"id"}),rps_policies:fields.Sequence({item:fields.TextField({}),name:"rps_policies"})}})}},url:"/api/v1/documentumprofileoptions/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"})}});




return Model;

});
