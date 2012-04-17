define([
    'path!mesh:model',
    'path!mesh:fields',
    'path!mesh:request'
], function(model, fields, Request) {

var Model = model.Model.extend({__name__:"targetvolume",__requests__:{query:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{total:fields.IntegerField({minimum:0,name:"total"}),resources:fields.SequenceField({item:fields.StructureField({structure:{category:fields.TextField({name:"category"}),type:fields.TextField({name:"type"}),name:fields.TextField({required:true,name:"name"}),id:fields.IntegerField({required:true,name:"id"})}}),required:true,name:"resources"})}})}},path:"/api/v1/targetvolume",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{query:fields.TextField({name:"query"}),all:fields.BooleanField({default_value:false,name:"all"}),limit:fields.IntegerField({minimum:1,name:"limit"}),offset:fields.IntegerField({minimum:0,name:"offset"})}}),method:"GET",name:"query"}),get:Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.StructureField({name:"response",structure:{category:fields.TextField({name:"category"}),type:fields.TextField({name:"type"}),name:fields.TextField({required:true,name:"name"}),id:fields.IntegerField({required:true,name:"id"})}})}},path:"/api/v1/targetvolume/[[id]]",token:"[[id]]",schema:fields.StructureField({name:"request",structure:{all:fields.BooleanField({default_value:false,name:"all"}),attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"})}});




return Model;

});
