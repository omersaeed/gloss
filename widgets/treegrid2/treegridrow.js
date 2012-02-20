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
            childText: '&#9679;' // black circle
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

        _expandSpan: function() {
            return this.$node.find('td').eq(this.options.expandColIndex)
                .find('.expand');
        },

        collapse: function() {
            var options = this.options, node = options.node;
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
            var self = this;
            row.expand().done(function() {
                self.options.node.moveTo(row.options.node, index);
            });
        },

        render: function() {
            var self = this,
                hasRendered = self.hasRendered;
            self._super();
            if (self.options.node.par.expanded) {
                self.show();
            } else {
                self.hide();
            }
            if (!hasRendered) {
                setTimeout(function() {
                    // var options = self.options,
                    //     index = options.expandColIndex,
                    //     expandCol = self.node.childNodes[index];
                    // self._indentNode = expandCol.childNodes[0];
                    // self._expandNode = expandCol.childNodes[1];
                    // self._valueNode = expandCol.childNodes[2];
                    // $(self._expandNode)
                    //     .off('click')
                    //     .on('click', function() {
                    // console.log('binding for',self.$node);
                    self.$node.find('.expand')
                        .off('click')
                        .on('click', function() {
                            if (self.options.model.isparent) {
                                self.toggle();
                            }
                        });
                }, 0);
            }
        },

        renderColExpand: function() {
            // console.log('  rendering',this.$node);
            var i, l,
                options = this.options,
                node = options.node,
                ret = ['<span class=indent>'];
            for (i = 0, l = node.level; i < l; i++) {
                ret.push('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
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
            ret.push(options.model[this.options.expandColName]);
            ret.push('</span>');
            return ret.join('');
        },

        rerenderColExpand: function() {
            // console.log('RE-rendering',this.$node);
            var options = this.options,
                node = options.node,
                index = options.expandColIndex,
                name = options.expandColName,
                expandCol = this.node.childNodes[index],
                indentTxt = Array(node.level+1).join('&nbsp;&nbsp;&nbsp;&nbsp;'),
                indent = expandCol.childNodes[0],
                expandTxt = !node.model.isparent? options.childText :
                            node.expanded? options.expandText :
                            options.collapseText,
                expand = expandCol.childNodes[1],
                value = expandCol.childNodes[2];
            if (indent.innerText != null) {
                indent.innerHTML = indentTxt;
                expand.innerHTML = expandTxt;
                value.innerText = node.model[name];
            } else {
                indent.innerHTML = indentTxt;
                expand.innerHTML = expandTxt;
                value.textContent = node.model[name];
            }

            // this.$node.children().eq(this.options.expandColIndex).empty()
            //     .__append__($(this.renderColExpand()));

//             var expandText, options = this.options, node = options.node, name = options.expandColName;
//             if (!node.model.isparent) {
//                 expandText = options.childText;
//             } else if (node.expanded) {
//                 expandText = options.expandText;
//             } else {
//                 expandText = options.collapseText;
//             }
//             this._expandNode.innerHTML = expandText;
//             if (this._indentNode.innerText != null) {
//                 this._indentNode.innerText = Array(node.level+1).join('&nbsp;&nbsp;&nbsp;&nbsp;');
//                 this._valueNode.innerText = node[name];
//             } else {
//                 this._indentNode.textContent = Array(node.level+1).join('&nbsp;&nbsp;&nbsp;&nbsp;');
//                 this._valueNode.textContent = node[name];
//             }
        },

        set: function(name, value) {
            var attrs = {},
                node = this.options.node;
            if (_.isString(name)) {
                attrs[name] = value;
            } else {
                attrs = name;
            }

            if (attrs.node != null) {
                if (this._nodeUpdate) {
                    node.off('update', this._nodeUpdate);
                }
                if (value === node || name.node === node) {
                    return this;
                }
            }

            Widget.prototype.set.call(this, name, value);
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
