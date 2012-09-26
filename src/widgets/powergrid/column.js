define([
    'bedrock/class'
], function(Class) {
    return Class.extend({
        renderTd: function(model) {
            return '<td>' + (model.get(this.name) || '') + '</td>';
        }
    });
});
