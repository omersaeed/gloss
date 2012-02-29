define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'vendor/gloss/widgets/widget',
    'vendor/gloss/widgets/grid/row',
    'vendor/gloss/widgets/button'
], function($, _, t, Widget, Row, Button) {
    return Row.extend({
        defaults: {
            node: null, // required
            expandText: '&#x25bc;',
            collapseText: '&#x25b6;',
            // childText: '&#8226;' // bullet
            childText: '&#9679;', // black circle
            indentText: '&nbsp;&nbsp;&nbsp;&nbsp;'
        },

        __new__: function() {
            var i, l, col, defaults = this.defaults, colModel = defaults.colModel;
            if (colModel) {
                for (i = 0, l = colModel.length; i < l; i++) {
                    col = colModel[i];
                    if (col.expandCol) {
                        defaults.expandColIndex = i;
                        defaults.expandColName = col.name;
                        col.render = 'renderColExpand';
                        col.rerender = 'rerenderColExpand';
                        break;
                    }
                }
            }
            if (! defaults.events) {
                defaults.events = [];
            }
            defaults.events.push({
                on: 'click',
                selector: '.expand',
                callback: 'onClickExpand'
            });
            this._super.apply(this, arguments);
        },

        create: function() {
            var i, l, col, self = this,
                colModel = self.options.colModel;
            self._super();
        },

        _childRows: function() {
            var childCount = 0,
                options = this.options,
                index = options.idx,
                grid = options.grid;
            t.dfs(options.node.children || [], function() {
                childCount++;
            });
            return grid.options.rows.slice(index+1, index+childCount+1);
        },

        _parentRow: function() {
            var i, options = this.options,
                rows = options.grid.options.rows,
                par = options.node.par,
                idx = options.idx;
            if (!idx || par.model.id == null) {
                return undefined;
            } else {
                for (i = idx-1; i >= 0; i--) {
                    if (rows[i].options.node === par) {
                        return rows[i];
                    }
                }
            }
        },

        _expandSpan: function() {
            return this.$node.find('td').eq(this.options.expandColIndex)
                .find('.expand');
        },

        collapse: function() {
            var options = this.options, node = options.node;
            this.options.grid.unhighlight();
            if (! node.model.isparent) {
                return $.Deferred().resolve();
            }
            node.expanded = false;
            this._expandSpan().html(this.options.collapseText);
            _.each(this._childRows(), function(row) { row.hide(); });
            return $.Deferred().resolve();
        },

        expand: function() {
            var self = this, options = self.options, node = options.node;
            self.options.grid.unhighlight();
            if (! node.model.isparent) {
                return $.Deferred().resolve();
            }
            node.expanded = true;
            self._expandSpan().html(self.options.expandText);
            return node.load().done(function() {
                var expand = [];
                t.dfs(node.children, function() { expand.push(this.par.expanded); });
                _.each(self._childRows(), function(row, i) {
                    row[expand[i]? 'show' : 'hide']();
                });
            });
        },

        moveTo: function(row, index) {
            var self = this,
                options = self.options,
                node = options.node;
            if (row) {
                row.expand().done(function() {
                    node.moveTo(row.options.node, index);
                });
            } else {
                node.moveTo(options.grid.options.tree.root, index);
            }
        },

        onClickExpand: function() {
            if (this.options.model.isparent) {
                this.toggle();
            }
        },

        render: function() {
            var self = this;
            self._super();
            if (self.options.node.par.expanded) {
                self.show();
            } else {
                self.hide();
            }
        },

        renderColExpand: function() {
            var i, l,
                options = this.options,
                node = options.node,
                ret = ['<span class=indent>'],
                indentText = options.indentText;
            for (i = 0, l = node.level; i < l; i++) {
                ret.push(indentText);
            }
            ret.push('</span><a href="javascript:void(0)" class="expand');
            if (! node.model.isparent) {
                ret.push('">', options.childText);
            } else if (node.expanded) {
                ret.push(' parent">', options.expandText);
            } else {
                ret.push(' parent">', options.collapseText);
            }
            ret.push('</a><span class=content>');
            ret.push(options.model[this.options.expandColName] || '');
            ret.push('</span>');
            return ret.join('');
        },

        rerenderColExpand: function() {
            var options = this.options,
                node = options.node,
                index = options.expandColIndex,
                name = options.expandColName,
                expandCol = this.node.childNodes[index],
                indentTxt = Array(node.level+1).join(options.indentText),
                indent = expandCol.childNodes[0],
                expandTxt = !node.model.isparent? options.childText :
                            node.expanded? options.expandText :
                            options.collapseText,
                expand = expandCol.childNodes[1],
                value = expandCol.childNodes[2];
            if (indent.innerText != null) {
                indent.innerHTML = indentTxt;
                expand.innerHTML = expandTxt;
                value.innerText = node.model[name] || '';
            } else {
                indent.innerHTML = indentTxt;
                expand.innerHTML = expandTxt;
                value.textContent = node.model[name] || '';
            }
        },

        toggle: function() {
            if (this.options.node.expanded) {
                return this.collapse();
            } else {
                return this.expand();
            }
        },

        updateWidget: function(updated) {
            var self = this,
                options = self.options;
            if (updated.node) {
                options.model = options.node.model;
                updated.model = true;
            }
            self._super(updated);
        }

    });
});
