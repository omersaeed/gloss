define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/gloss/widgets/grid',
    'vendor/gloss/widgets/treegrid2/treegridrow',
    'link!vendor/gloss/widgets/treegrid2/treegrid.css'
], function($, _, Grid, TreeGridRow) {
    return Grid.extend({
        defaults: {
            rowWidgetClass: TreeGridRow,
            tippingPoint: 15
        },
        create: function() {
            var self = this,
                tree = self.options.tree;
            tree.on('update', function(evt, node) {
                self.set('nodes', self.options.tree.asList());
            }).on('change', function(evt, node, type, data) {
                // 'type' will be something like move, remove, add, or model
                // (see gloss/data/tree.js).  'model' change events are handled
                // at the row level, so ignore those here
                if (type !== 'model') {
                    self.set('nodes', self.options.tree.asList());
                }
            });
            self._super();
            self.$node.addClass('tree');
            tree.root.expanded = false;
        },
        _makeRowOptions: function(node, index) {
            var self = this;
            return {
                node: node,
                grid: self,
                parentWidget: self,
                idx: index
            };
        },
        _shouldFullyRender: function() {
            var i, l, count = 0,
                options = this.options,
                tippingPoint = options.tippingPoint,
                nodes = options.nodes,
                rows = options.rows;
            if (this._super()) {
                return true;
            }
            for (i = 0, l = rows.length; i < l; i++) {
                if (rows[i].options.node !== nodes[i]) {
                    if (++count > tippingPoint) {
                        return true;
                    }
                }
            }
            return false;
        },
        add: function() {
            // this isn't implemented for the treegrid... just update the tree
            // and call 'rerender()'
        },
        expandAll: function() {
            var i, l, rows = this.options.rows;
            for (i = 0, l = rows.length; i < l; i++) {
                rows[i].expand();
            }
        },
        load: function() {
            var self = this, rows, tree = self.options.tree;
            return tree.load().done(function() {
                rows = self.options.rows;
                tree.root.expanded = true;
                rows[0].show();
                var i, l, row, cur = 1, topLevelChildren = tree.root.children;
                for (i = 1, l = rows.length; i < l; i++) {
                    row = rows[i];
                    if (rows[i].options.node === topLevelChildren[cur]) {
                        rows[i].show();
                        cur++;
                    }
                }
            });
        },
        makeRow: function(node, index) {
            var self = this, row,
                opts = self._makeRowOptions(node, index);
            if (node.expanded == null) {
                node.expanded = !node.model.isparent;
            }
            return self.options.rowWidgetClass(undefined, opts);
        },
        setModel: function(row, node) {
            var self = this;
            if (node.expanded == null) {
                node.expanded = !node.model.isparent;
            }
            row.set('node', node);
        },
        updateWidget: function(updated) {
            this._super(updated);
            if (updated.nodes) {
                this.set('models', this.options.nodes);
            }
        }
    });
});
