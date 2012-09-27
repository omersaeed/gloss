define([
    'bedrock/class'
], function(Class) {
    return Class.extend({
        renderTd: function(model) {
            var v = model.get(this.name);
            return '<td>' + (v == null? '' : v.toString()) + '</td>';
        },
        renderTh: function() {
            return '<td>' + (this.name || '') + '</td>';
        }
    });
});
