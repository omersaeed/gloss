define([
    'vendor/gloss/data/model',
    'vendor/gloss/data/fields'
], function(model, fields) {

var Model = model.Model.extend({__name__:"relatedterms",__requests__:{query:model.Request({mimetype:"application/x-www-form-urlencoded",responses:{200:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{info:fields.Structure({name:"info",structure:{responsive_volumes:fields.Sequence({item:fields.IntegerField({}),name:"responsive_volumes"})}}),resources:fields.Sequence({item:fields.Structure({structure:{term:fields.TextField({required:true,name:"term"}),score:fields.FloatField({required:true,minimum:-1.0,name:"score",maximum:1.0}),volume_id:fields.IntegerField({name:"volume_id"})}}),required:true,name:"resources"})}})},202:{mimetype:"application/json",schema:fields.Structure({name:"response",structure:{info:fields.Structure({name:"info",structure:{responsive_volumes:fields.Sequence({item:fields.IntegerField({}),name:"responsive_volumes"})}}),resources:fields.Sequence({item:fields.Structure({structure:{term:fields.TextField({required:true,name:"term"}),score:fields.FloatField({required:true,minimum:-1.0,name:"score",maximum:1.0}),volume_id:fields.IntegerField({name:"volume_id"})}}),required:true,name:"resources"})}})}},url:"/api/v1/relatedterms",token:"[[id]]",schema:fields.Structure({name:"request",structure:{term:fields.TextField({required:true,name:"term"}),volume_ids:fields.TextListField({min_length:1,separator:",",name:"volume_ids"}),volumeset_id:fields.IntegerField({name:"volumeset_id"}),limit:fields.IntegerField({minimum:1,name:"limit",maximum:200}),offset:fields.IntegerField({minimum:0,name:"offset",maximum:200}),matter_id:fields.IntegerField({name:"matter_id"})}}),method:"GET",name:"query"})}});




return Model;

});