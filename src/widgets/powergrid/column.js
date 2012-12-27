define([
    'vendor/jquery',
    'vendor/underscore',
    './../../view',
    './../grid/resizehandle',
    './../../util/styleUtils',
    './../../util/scrollbar',
    'tmpl!./th.mtpl',
    'tmpl!./td.mtpl'
], function($, _, View, ResizeHandle, StyleUtils, scrollbar, thTemplate, tdTemplate) {
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
        return actualWidth;
    },
    scrollBarWidth = scrollbar.width();

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
                self._setThCellWidth();
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

        _getFristTdCell: function() {
            var selector = '.' + this.columnClass(),
                $tr = this.get('grid').$tbody.children().first();
                
            return $tr.find(selector);
        },

        _instantiateResizeHandle: function() {
            var $resize;
            if (this.get('resizable')) {
                $resize = this.$el.find('.resize');
                if (!this.resize || $resize[0] !== this.resize.node) {
                    this.resize = ResizeHandle(this.$el.find('.resize'))
                        .on('dragend', _.bind(this._onResize, this));
                }
            }
        },

        _onResize: function(evt, cursorPos) {
            var diff = (cursorPos.clientX + $(window).scrollLeft()) - this.$el.offset().left;
            if (diff > 0) {
                this.set('width', diff);
            }
            if (this.resize.node.style.removeProperty) {
                this.resize.node.style.removeProperty('left');
            }
        },

        _setTdCellWidth: function(width) {
            var $el = this._getFristTdCell();

            outerWidth($el, width);
        },

        _setThCellWidth: function(width) {
            var $el = this._getFristTdCell();

            width = width || $el.outerWidth();

            if (!width) {
                this.$el.css({
                    minWidth: '100%',
                    maxWidth: '100%'
                });
            } else {
                outerWidth(this.$el, width);
            }
        },

        _postRender: function() {
            this._setThCellWidth();
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

        // when using the grid, you will often want to override one or more of
        // the following values, and they've got a bit of an intricate
        // interaction:
        //
        //  - getValue:
        //      this is responsible for pulling the value out of the model. if
        //      your column deals with a value that, for instance is the result
        //      of combining multiple properties of a model, you'd want to
        //      override this. if you think you want to return something from
        //      getValue with html tags, you probably want to override...
        //  - formatValue
        //      this is responsible for making the value human reaable. if you
        //      want to add markup and stuff, this is the place to do it.
        //  - getTitle
        //      this populates td's "title" attribute. *if your formatValue
        //      method returns a string w/ html, you WILL have to override
        //      this*, its arguments are:
        //           - the return value of formatValue
        //           - the return value of getValue
        //           - the row's model
        //  - getSortValue
        //      this is used, as the name implies, for sorting.
        //
        // you can look at the implementations to see the default values.
        getSortValue: function(model) {
            return this.getValue(model);
        },

        getTitle: function(formattedValue, value, model) {
            return formattedValue;
        },

        getValue: function(model) {
            return model.get(this.get('name'));
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

                this._setTdCellWidth(newWidth);
                this._setThCellWidth(newWidth);
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
