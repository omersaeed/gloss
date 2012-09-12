define([
    'vendor/jquery',
    'vendor/underscore',
    'bedrock/class',
    'bedrock/settable'
], function ($, _, Class, Settable) {

    var tmpl = function(tmpl) {
        return function(model, gridInstance, prop, nameAttr) {
            var val;
            prop = prop || '_checked';
            val = model.get? model.get(prop) : model[prop];
            return tmpl.replace('%s', val || '').replace('%n', nameAttr);
        };
    };

    return Class.extend({

        defaults: {
            name: '_checked',
            checkboxTemplate: tmpl('<input type=checkbox class=checkbox-column %s />'),
            radioTemplate: tmpl('<input type=radio name="%n" class=checkbox-column %s />'),
            type: 'checkbox' // set to 'radio' for radio buttons
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
            this.set($.extend(true, {
                nameAttr: _.uniqueId('grid-checkbox-column')
            }, this.defaults, opts));
        },
        headerChecked: function(evt, grid) {
            var models,
                checked = $(evt.target).attr('checked') ? true : false;

            var rows = grid.options.rows;
            for(var i=0, l=rows.length; i < l; i++) {
                rows[i].$node.find('.checkbox-column').prop('checked', checked);
            }

            // this functionality is not yet in there... needs to happen some
            // time...
            // // grid is backed by a collection
            // if(grid.options.collection) {
            //     models = grid.options.collection.models;
            //     models.forEach(function(model) {
            //         // set silently
            //         model.set('_checked', checked, true);
            //     });
            //     grid.set('models', null);
            //     grid.set('models', models);
            // } else {
            //     // grid is back by a model
            //     models = $.extend(true, [], grid.options.models);
            //     models.forEach(function(model) {
            //         // set silently
            //         model.set('_checked', checked, true);
            //     });
            //     grid.set('models', null);
            //     grid.set('models', models);
            // }
        },
        rowChecked: function(evt, grid) {
            $(this.events[0].selector).attr('checked', false);
        },
        render: function(col, colValue, model) {
            return this.get('tmpl')(model, this.get('nameAttr'));
        },
        rerender: function(col, td, colValue, model) {
            td.innerHTML = this.render(col, colValue, model);
        },
        _settableProperty: null,
        _settableOnChange: function(changed) {
            if (changed.type) {
                this.set('tmpl', this.get(this.get('type') + 'Template'));
                this.set('label', this.get('type') === 'checkbox'?
                        this.render(null, null, {}) : '');
            }
        }
    }, {mixins: [Settable]});
});
