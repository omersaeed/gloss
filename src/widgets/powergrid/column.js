define([
    'vendor/underscore',
    './../../view',
    './../grid/resizehandle',
    './../../util/styleUtils',
    'tmpl!./th.mtpl',
    'tmpl!./td.mtpl'
], function(_, View, ResizeHandle, StyleUtils, thTemplate, tdTemplate) {
    var outerWidth = function($el, width) {
        var minWidth = 10,
            actualWidth = width - _.reduce([
                'margin-left', 'border-left-width', 'padding-left',
                'border-right-width', 'margin-right', 'padding-right'
            ], function(memo, p) {
                return memo + parseInt($el.css(p), 10);
            }, 0);
        if (actualWidth < minWidth) {
            actualWidth = minWidth;
        }
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

            $(window).resize(_.debounce(function() {
                self._setTdCellWidth(self.get('width'));
            }, 50));
        },

        _hiddenColumnClass: function() {
            return 'hide-' + this.columnClass();
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
                this.columnClass()
            ].join(''), ['display', 'none']]]);
        },

        _instantiateResizeHandle: function() {
            if (this.get('resizable')) {
                this.resize = ResizeHandle(this.$el.find('.resize'))
                    .on('dragend', _.bind(this._onResize, this));
            }
        },

        _onResize: function(evt, cursorPos) {
            var diff = (cursorPos.clientX + $(window).scrollLeft()) - this.$el.position().left;
            if (diff > 0) {
                this.set('width', diff);
            }
            if (this.resize.node.style.removeProperty) {
                this.resize.node.style.removeProperty('left');
            }
        },

        _setTdCellWidth: function(width) {
            var selector = '.col-' + this.get('name'),
                $tr = this.get('grid').$tbody.children().first(),
                $el = $tr.find(selector);
            outerWidth($el, width);
        },

        _postRender: function() {
            this._setTdCellWidth(this.get('width'));
        },

        // the 'columnClass' is something like 'col-name'. it's used as a
        // generic css identifier. the 'cssClasses' combines both the
        // 'columnClass' and other styling classes, stuff like 'first', 'last',
        // or 'number' (in the case of a column that's formatted as a number'
        columnClass: function() {
            return 'col-' + this.get('name').replace(/\./g, '__');
        },
        cssClasses: function() {
            return this.columnClass() +
                (this.get('first')? ' first' : ' ') +
                (this.get('last')? ' last' : ' ');
        },

        formatValue: function(value, model) {
            return value;
        },

        get: function(key) {
            return key === 'width'?
                this.$el.outerWidth() : this._super.apply(this, arguments);
        },

        getValue: function(model) {
            return model.get(this.get('name'));
        },

        getSortValue: function(model) {
            return this.getValue(model);
        },

        hide: function() {
            this._addHiddenColumnCss();
            this.get('grid').$el.addClass(this._hiddenColumnClass());
            return this;
        },

        isVisible: function() {
            return !this.get('grid').$el.hasClass(this._hiddenColumnClass());
        },

        toggle: function() {
            if (this.isVisible()) {
                this.hide();
            } else {
                this.show();
            }
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
            var newWidth, render = true;
            if (updated.sort) {
                render = true;
                this.$el[this.get('sort')? 'addClass':'removeClass']('sorted');
            }
            if (updated.width) {
                newWidth = View.prototype.get.call(this, 'width');
                this.get('grid').set('fixedLayout', true);
                outerWidth(this.$el, newWidth);
                this._setTdCellWidth(newWidth);
            }
            if (updated.label) {
                render = true;
            }

            if (render) {
                this.render();
            }
            this.trigger('columnchange', {column: this, updated: updated});
        }
    });
});
