define([
    'vendor/underscore',
    './../../view',
    './../grid/resizehandle',
    './../../util/styleUtils',
    'tmpl!./th.mtpl',
    'tmpl!./td.mtpl'
], function(_, View, ResizeHandle, StyleUtils, thTemplate, tdTemplate) {
    var outerWidth = function($el, width) {
        var actualWidth = width - _.reduce([
                'margin-left', 'border-left-width', 'padding-left',
                'border-right-width', 'margin-right', 'padding-right'
            ], function(memo, p) {
                return memo + parseInt($el.css(p), 10);
            }, 0);
        $el.css({
            width:    actualWidth,
            minWidth: actualWidth,
            maxWidth: actualWidth
        });
    };
    return View.extend({
        template: thTemplate,
        init: function() {
            var self = this, grid;

            self._super.apply(this, arguments);

            if (! (grid = self.get('grid'))) {
                throw Error('column must be initialized with grid instance');
            }

            self.on('click', function() {
                var cur = self.get('sort');
                if (!self.get('sortable')) {
                    return;
                }
                self.set('sort', /asc/i.test(cur)? 'descending' : 'ascending');
            });
            self._instantiateResizeHandle();
        },

        _hiddenColumnClass: function() {
            return 'hide-' + this.cssClass();
        },

        _addHiddenColumnCss: function() {
            var ss, rule;
            if (this._hiddenColumnCssAdded) {
                return;
            }
            this._hiddenColumnCssAdded = true;
            ss = _.last(document.styleSheets);
            StyleUtils.addStyleRules([[[
                '#', this.get('grid').el.id, '.',
                this._hiddenColumnClass(), ' .',
                this.cssClass()
            ].join(''), ['display', 'none']]]);
        },

        _instantiateResizeHandle: function() {
            if (this.get('resizable')) {
                this.resize = ResizeHandle(this.$el.find('.resize'))
                    .on('dragend', _.bind(this._onResize, this));
            }
        },

        _onResize: function(evt, cursorPos) {
            var diff = cursorPos.clientX - this.$el.position().left;
            if (diff > 0) {
                this.set('width', diff);
            }
            if (this.resize.node.style.removeProperty) {
                this.resize.node.style.removeProperty('left');
            }
        },

        cssClass: function() {
            return 'col-' + this.get('name');
        },

        get: function(key) {
            return key === 'width'?
                this.$el.outerWidth() : this._super.apply(this, arguments);
        },

        getValue: function(model) {
            return model.get(this.get('name'));
        },

        hide: function() {
            this._addHiddenColumnCss();
            this.get('grid').$el.addClass(this._hiddenColumnClass());
            return this;
        },

        render: function() {
            this._super.apply(this, arguments);
            this._instantiateResizeHandle();
        },

        renderTd: tdTemplate,

        show: function() {
            this.get('grid').$el.removeClass(this._hiddenColumnClass());
            return this;
        },

        update: function(updated) {
            var newWidth;
            if (updated.sort) {
                this.render();
            }
            if (updated.width) {
                newWidth = View.prototype.get.call(this, 'width');
                this.get('grid').set('fixedLayout', true);
                outerWidth(this.$el, newWidth);
            }
            this.trigger('columnchange', {column: this, updated: updated});
        }
    });
});
