define([
    'path!gloss:data/model',
    'path!gloss:data/fields'
], function(model, fields) {

var Model = model.Model.extend({__name__:"targetvolume",__requests__:{query:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{total:fields.IntegerField({minimum:0,name:"total"}),resources:fields.Sequence({item:fields.Structure({structure:{category:fields.TextField({name:"category"}),type:fields.TextField({name:"type"}),name:fields.TextField({required:true,name:"name"}),id:fields.IntegerField({required:true,name:"id"})}}),required:true,name:"resources"})}})}},url:"/api/v1/targetvolume",token:"[[id]]",schema:fields.Structure({name:"request",structure:{sort:fields.QuerySortField({name:"sort"}),query:fields.TextField({name:"query"}),all:fields.BooleanField({default_value:false,name:"all"}),limit:fields.IntegerField({minimum:1,name:"limit"}),offset:fields.IntegerField({minimum:0,name:"offset"})}}),method:"GET",name:"query"}),get:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{category:fields.TextField({name:"category"}),type:fields.TextField({name:"type"}),name:fields.TextField({required:true,name:"name"}),id:fields.IntegerField({required:true,name:"id"})}})}},url:"/api/v1/targetvolume/[[id]]",token:"[[id]]",schema:fields.Structure({name:"request",structure:{all:fields.BooleanField({default_value:false,name:"all"}),attrs:fields.TextField({name:"attrs"})}}),method:"GET",name:"get"})}});




return Model;

});
