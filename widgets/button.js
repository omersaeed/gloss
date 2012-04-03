define([
    'path!jquery',
    'path!gloss:widgets/formwidget'
], function($, FormWidget) {
    return FormWidget.extend({
        defaults: {
            messageList: false
        },
        create: function() {
            this._super();
            if(!this.options.nostyling) {
                this.$node.addClass('button');
            }
        },
        prepareNode: function($node) {
            if ($node.is('button') && !$node.attr('type')) {
                var html = $('<div>').append($node.clone()).html();
                html = html.replace('<button ', '<button type=button ');
                return $(html).replaceAll($node);
            } else {
                return $node;
            }
        }
    });
});
