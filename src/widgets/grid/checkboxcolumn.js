define([
    'vendor/jquery',
    'vendor/underscore',
    'bedrock/class',
    'bedrock/assettable'
], function ($, _, Class, asSettable) {

    var tmpl = function(tmpl) {
        return function(model, gridInstance, prop, nameAttr) {
            var val;
            prop = prop || '_checked';
            val = model.get? model.get(prop) : model[prop];
            return tmpl.replace('%s', val || '').replace('%n', nameAttr);
        };
    };

    var CheckBoxColumn = Class.extend({

        defaults: {
            name: '_checked',
            checkboxTemplate: tmpl('<input type=checkbox class=checkbox-column %s />'),
            radioTemplate: tmpl('<input type=radio name="%n" class=checkbox-column %s />'),
            type: 'checkbox', // set to 'radio' for radio buttons
            state: null // set to 'checked' for dafualt checked state
        },

        events: [
            {
                on: 'click',
                selector: 'th.col-_checked .checkbox-column',
                callback: 'headerChecked'
            },
            {
                on: 'click',
                selector: 'td.col-_checked .checkbox-column',
                callback: 'rowChecked'
            }
        ],

        init: function(opts) {
            if (opts && opts.state === 'checked') {
                opts.checkboxTemplate = tmpl('<input type=checkbox checked=checked class=checkbox-column %s />');
                opts.radioTemplate = tmpl('<input type=radio checked=checked name="%n" class=checkbox-column %s />');
            }
            this.set($.extend(true, {
                nameAttr: _.uniqueId('grid-checkbox-column')
            }, this.defaults, opts));
        },

        headerChecked: function(evt) {
            var grid = this,
                models,
                collection = grid.options.collection,
                checked = $(evt.target).attr('checked') ? true : false,
                rows = grid.options.rows;

            for (var i=0, l=rows.length; i < l; i++) {
                rows[i].$node.find('.checkbox-column').attr('checked', checked);
                // set models silently
                rows[i].options.model.set('_checked', checked, {silent: true});
            }
            // fire one change event if there's a collection other wise trigger each model
            if (collection) {
                collection.trigger('change');
            } else {
                _.each(rows, function(row) {
                    row.options.model.trigger('change');
                });
            }
        },

        rowChecked: function(evt) {
            var row = this,
                $header = row.options.grid.$node.find('th.col-_checked [type=checkbox]'),
                checked = $(evt.target).attr('checked') ? true : false;

            // uncheck the header
            $header.attr('checked', false);
            // set the model property
            row.options.model.set('_checked', checked);
        },

        render: function(col, colValue, model) {
            return this.get('tmpl')(model, this.get('nameAttr'));
        },

        rerender: function(col, td, colValue, model) {
            td.innerHTML = this.render(col, colValue, model);
        },

        onChange: function(changed) {
            if (changed.type) {
                this.set('tmpl', this.get(this.get('type') + 'Template'));
                this.set('label', this.get('type') === 'checkbox'?
                        this.render(null, null, {}) : '');
            }
        }
    });

    asSettable.call(CheckBoxColumn.prototype, {
        onChange: 'onChange',
        propName: null
    });

    return CheckBoxColumn;
});
