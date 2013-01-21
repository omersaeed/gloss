define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    './grid',
    './treegrid/treegridrow',
    'css!./treegrid/treegrid.css'
], function($, _, t, Grid, TreeGridRow) {
    return Grid.extend({
        defaults: {
            rowWidgetClass: TreeGridRow,
            tippingPoint: 15
        },
        create: function() {
            this.$node.addClass('tree');
            this.expanded = {};
            this._super();
        },
        _addAfterRow: function(models, afterRow) {
            var self = this,
                par = afterRow.options.node.par,
                idx = afterRow.options.node.index() + 1;
            return afterRow.options.node.par.add(models, idx)
                .pipe(function(newNodes) {
                    var newRowIdx = afterRow.options.idx;
                    t.dfs(afterRow.options.node, function() { newRowIdx++; });
                    return self._pipeNewNodesToRows(models, newNodes, newRowIdx);
                });
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
        _pipeNewNodesToRows: function(models, newNodes, idx) {
            if (_.isArray(models)) {
                return this.options.rows.slice(idx, models.length);
            } else {
                return this.options.rows[idx];
            }
        },
        _setTree: function() {
            var self = this, tree = self.options.tree;
            tree.on('update', function(evt, node) {
                self.set('nodes', self.options.tree.asList());
            }).on('change', function(evt, node, type, data) {
                // 'type' will be something like move, remove, add, or model
                // (see gloss/data/tree.js).  'model' change events are handled
                // at the row level, so ignore those here
                if (type !== 'model') {
                    self.set('nodes', self.options.tree.asList());
                }
                self.set('modified', true);
            });
            self.setExpanded(tree.root, false);
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
        add: function(models, where) {
            var node, self = this, rows = self.options.rows, lastRow = _.last(rows);
            if ((where || {}).after) {
                return self._addAfterRow(models, where.after);
            } else {
                node = rows.length? lastRow : self.options.tree.root;
                return node.add(models).pipe(function(newNodes) {
                    var idx = lastRow? lastRow.options.idx+1 : 0;
                    return self._pipeNewNodesToRows(models, newNodes, idx);
                });
            }
        },
        getExpanded: function(node) {
            return this.expanded[node.model.id];
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
                self.setExpanded(tree.root, true);
                // tree.root.expanded = true;
                if (!rows.length) {
                    return;
                }
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
        // this function exists b/c of the search API for fileplan record
        // series.  this is probably not the way we want to do things
        loadPath: function(path) {
            var self = this, i, len, row,
                rows = self.options.rows,
                curId = 0,
                tree = self.options.tree,
                root = tree.root,
                args = root.options.collectionArgs;
            path = path.slice(0);
            root.set('collectionArgs', $.extend(true, args, {
                query: {path: path, recursive: true}
            }));
            return root.load().pipe(function() {
                len = rows.length;
                i = 0;
                while (path.length) {
                    curId = path.splice(0, 1)[0];
                    for (; i < len; i++) {
                        row = rows[i];
                        if (row.options.node.model.id === curId) {
                            if (path.length) {
                                // since we just loaded the path, and this node
                                // is on the path, .expand() should return
                                // immediately
                                row.expand();
                            }
                            i++;
                            break;
                        }
                    }
                }
                return row;
            });
        },
        makeRow: function(node, index) {
            var self = this, row,
                opts = self._makeRowOptions(node, index);
            if (self.getExpanded(node) == null) {
                self.setExpanded(node, !node.model.isparent);
            }
            return self.options.rowWidgetClass(undefined, opts);
        },
        setExpanded: function(node, value) {
            this.expanded[node.model.id] = value;
        },
        setModel: function(row, node) {
            var self = this;
            if (self.getExpanded(node) == null) {
                self.setExpanded(node, !node.model.isparent);
            }
            row.set('node', node);
        },
        updateWidget: function(updated) {
            this._super(updated);
            if (updated.nodes) {
                this.set('models', this.options.nodes);
            }

            if (updated.modified) {
                this.$node[this.options.modified? 'addClass' : 'removeClass']('modified');
            }

            if (updated.tree) {
                this._setTree();
            }
        }
    });
});
