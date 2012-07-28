define([
    'vendor/jquery',
    'bedrock/class'
], function ($, Class) {

    return Class.extend({

        init: function(node) {
            this.name = '_checked';
            this.label = "<input class=checkbox-column type=checkbox />";
            this.events = [
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
            this.render = this._render;
            this.rerender = this._rerender;
        },
        headerChecked: function(evt, grid) {
            // add retard timeout otherwise .trigger in testing screws things up
            setTimeout(function() {
                var models,
                    checked = $(evt.target).attr('checked') ? true : false;

                var rows = grid.options.rows;
                for(var i=0, l=rows.length; i < l; i++) {
                    rows[i].$node.find('.checkbox-column').attr('checked', checked);
                }

//                // grid is backed by a collection
//                if(grid.options.collection) {
//                    models = grid.options.collection.models;
//                    models.forEach(function(model) {
//                        // set silently
//                        model.set('_checked', checked, true);
//                    });
//                    grid.set('models', null);
//                    grid.set('models', models);
//                } else {
//                    // grid is back by a model
//                    models = $.extend(true, [], grid.options.models);
//                    models.forEach(function(model) {
//                        // set silently
//                        model.set('_checked', checked, true);
//                    });
//                    grid.set('models', null);
//                    grid.set('models', models);
//                }
            }, 0);
        },
        rowChecked: function(evt, grid) {
            $(this.events[0].selector).attr('checked', false);
        },
        _render: function(col, model) {
            if(model._checked) {
                return '<input class=checkbox-column type=checkbox checked />';
            }
            return '<input class=checkbox-column type=checkbox />';


        },
        _rerender: function(col, td, model) {
            if(model._checked) {
                td.innerHTML = '<input class=checkbox-column type=checkbox checked />';
                return
            }
            td.innerHTML = '<input class=checkbox-column type=checkbox />';
        }
    });
});