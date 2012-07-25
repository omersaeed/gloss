define([
    'vendor/jquery',
    'vendor/underscore',
    './../widget'
], function($, _, Widget) {
    // for the IE innerHTML bug workaround
    var $dummy = $('<div></div>'),
        dummy = $dummy[0],
        canUseInnerHTML = true;

    var $ieTest = $('<table><tbody><tr></tr></tbody></table>').find('tr');

    try {
        $ieTest[0].innerHTML =  '<td>foo</td><td>bar</td>';
        if ($ieTest[0].innerHTML.match(/td/g).length !== 4) {
            canUseInnerHTML = false;
        }
    } catch (e) {
        canUseInnerHTML = false;
    }

    return Widget.extend({
        defaults: {
            bindAll: false,
            bindOnMethodHandlers: false,
            colModel: null,                     // required
            grid: null,                         // required
            model: null,                        // required
            idx: null                           // required
        },

        nodeTemplate: '<tr></tr>',

        template: _.template([
            '<% for (var i = 0, len = colModel.length, col; col = colModel[i], i < len; i++) { %>',
                '<td class="col-<%= col.name %><%= i===0? " first" : "" %><%= col.noLeftBorder? " no-left-border" : "" %>">',
                    '<%= _.isString(col.render)? this[col.render](col, grid.getColumnValue(model, col.name)) : col.render(col, grid.getColumnValue(model, col.name)) %>',
                '</td>',
            '<% } %>'
        ].join('')),

        canUseInnerHTML: canUseInnerHTML,

        create: function() {
            var self = this;

            self.cols = {};

            _.each(self.options.colModel, function(col) {
                self.cols[col.name] = col;
                if (! _.isFunction(col.render)) {
                    col.render = self[col.render] == null? 'renderCol' : col.render;
                }
            });

            self.hasRendered = false;

            self.update();
        },

        _render: function() {
            // if we use $.fn.html() here, it'll end up calling $.fn.append(),
            // which will call the function to add this widget to the registry
            if (this.canUseInnerHTML) {
                // option #1: doesn't work in IE
                this.node.innerHTML = this.template(this.options);
            } else {
                // option #2: slows things down by a factor of 2-3
                var i, len, cur, collection = $(this.template(this.options));
                this.$node.empty();
                for (i = 0, len = collection.length; i < len; i++) {
                    this.node.appendChild(collection[i]);
                }
            }
        },

        _rerender: function() {
            var i, len, col, td,
                options = this.options,
                colModel = options.colModel,
                tds = this.node.childNodes,
                model = options.model,
                grid = options.grid;
            
            for (i = 0, len = colModel.length; i < len; i++) {
                col = colModel[i];
                if (!col.modelIndependent) {
                    td = tds[i];
                    if (col.rerender) {
                        this[col.rerender](col, td, grid.getColumnValue(model, col.name));
                    } else if (col.render) {
                        tds[i].innerHTML = this[col.render](col, grid.getColumnValue(model, col.name));
                    } else {
                        if (td.innerText != null) {
                            tds[i].innerText = grid.getColumnValue(model, col.name) || '';
                        } else {
                            tds[i].textContent = grid.getColumnValue(model, col.name) || '';
                        }
                    }
                }
            }
        },

        highlight: function() {
            this.options.grid.highlight(this);
            return this;
        },

        render: function() {
            if (!this.hasRendered) {
                this.hasRendered = true;
                this._render();
            } else {
                this._rerender();
            }
        },

        renderCol: function(col, value) {
            return value;
        },

        // this is an optimized version of set that doesn't re-set the model if
        // it hasn't changed
        set: function(name, value) {
            var model, options = this.options, attrs = {};
            // don't re-set the model if it's the same
            if (_.isString(name)) {
                attrs[name] = value;
            } else {
                attrs = name;
            }
            if (attrs.model != null) {
                model = options.model;
                if (value === model || name.model === model) {
                    return this;
                } else {
                    options.model = name.model || value;
                    this.updateWidget({model: true});
                    return this;
                }
            }

            return this._super(name, value);
        },

        unhighlight: function() {
            this.$node.removeClass('highlight');
            return this;
        },

        updateWidget: function(changed) {
            if (changed.model) {
                this.render();
            }
        }
    });
});

