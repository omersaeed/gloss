define([
    'vendor/gloss/widgets/treegrid2/treegridrow',
    'vendor/gloss/widgets/button'
], function(TreeGridRow, Button) {
    return TreeGridRow.extend({
        create: function() {
            var colModel = this.options.colModel;
            this.options.colModel = [{
                name: 'grab',
                render: 'renderColGrab',
                modelIndependent: true
            }].concat(colModel);
            this.options.model = this.options.node.model;
            this._super();
        },

        colGrabClick: function() {
            console.log('col grab was clicked',this.options.node.model.name);
        },

        render: function() {
            var self = this, hasRendered = self.hasRendered;

            self._super.apply(self, arguments);

            if (! hasRendered) {
                setTimeout(function() {
                    Button(self.$node.find('button.grab'), {
                        parentWidget: self
                    }).on('click', function() {
                        self.colGrabClick();
                    });
                }, 0);
            }
        },

        renderColGrab: function() {
            return '<button type="button" class="grab">m</button>';
        }

    });
});

