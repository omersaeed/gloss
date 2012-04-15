define([
    'vendor/gloss/data/model',
    'vendor/gloss/data/fields'
], function(model, fields) {

var Model = model.Model.extend({__name__:"volumedirectory",__requests__:{query:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{total:fields.IntegerField({name:"total"}),resources:fields.Sequence({item:fields.Structure({structure:{isparent:fields.BooleanField({required:true,name:"isparent"}),parent_id:fields.TextField({name:"parent_id"}),id:fields.TextField({required:true,name:"id"}),name:fields.TextField({required:true,name:"name"}),volume_id:fields.IntegerField({required:true,name:"volume_id"})}}),name:"resources"})}})}},url:"/api/v1/volumedirectory",token:"[[id]]",schema:fields.Structure({name:"request",structure:{volume_id:fields.IntegerField({required:true,name:"volume_id"}),root_id:fields.TextField({name:"root_id"})}}),method:"GET",name:"query"}),create:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/volumedirectory",token:"[[id]]",schema:fields.Structure({name:"request",structure:{}}),method:"POST",name:"create"}),get:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/volumedirectory/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"}),update:model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/volumedirectory/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{}}),method:"POST",name:"update"}),"delete":model.Request({mimetype:"application/json",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/volumedirectory/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{}}),method:"DELETE",name:"delete"})}});




return Model;

});