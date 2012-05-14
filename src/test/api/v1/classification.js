define([
    'component!mesh:model',
    'component!mesh:fields'
], function(model, fields) {

var Model = model.Model.extend({__name__:"classification",__requests__:{query:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{total:fields.IntegerField({minimum:0,name:"total"}),resources:fields.Sequence({item:fields.Structure({structure:{id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({required:true,name:"name"})}}),required:true,name:"resources"})}})}},url:"/api/v1/classification",token:"[[id]]",schema:fields.Structure({name:"request",structure:{sort:fields.QuerySortField({name:"sort"}),query:fields.TextField({name:"query"}),limit:fields.IntegerField({minimum:1,name:"limit"}),offset:fields.IntegerField({minimum:0,name:"offset"})}}),method:"GET",name:"query"}),create:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/classification",token:"[[id]]",schema:fields.Structure({name:"request",structure:{name:fields.TextField({required:true,name:"name"})}}),method:"POST",name:"create"}),get:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"}),name:fields.TextField({required:true,name:"name"})}})}},url:"/api/v1/classification/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"}),update:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/classification/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{name:fields.TextField({name:"name"})}}),method:"POST",name:"update"}),"delete":model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/classification/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{}}),method:"DELETE",name:"delete"})}});




return Model;

});
