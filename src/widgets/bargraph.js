/**
 * Author: Ralph Smith
 * Date: 4/26/12
 * Time: 12:10 PM
 * Description: builds a bar graph from a JSON object
 */

define([
    'component!vendor:jquery',
    './widget',
    'tmpl!./bargraph/bargraph.mtpl',
    'css!./bargraph/bargraph.css'
], function ($, Widget, template) {
    return Widget.extend({
        defaults: {
            data: null,         /* list of the format: [
                                 * {content: '...', value: '...'},
                                 * {content: '...', value: '...'},
                                 * {content: '...', value: '...'},
                                 * ...
                                 * ]
                                 */
            barHeight: 10,      // height in px
            maxWidth: 100,      // width in px
            animationDuration: 1000
        },
        nodeTemplate: '<div>',

        create: function() {
            var self = this;
            this._super();

            self.$graphBars;
            self.maxValue;
            self.lerpValue;
            self.$node.addClass('bargraph');

            self.update();
        },
        renderGraphBars: function() {
            var self = this;
            for(var i=0, l=self.$graphBars.length; i < l; i++) {
                self.renderGraphBar($(self.$graphBars[i]));
            }
        },
        renderGraphBar: function($bar) {
            var self = this,
                cssProps, width;

            // -- interpolate width for max width
            width = $bar.attr('value') * self.lerpValue;
            cssProps = {
                width: width + 'px'
            }
            $bar.css('height', self.options.barHeight);
            $bar.animate(cssProps, self.options.animationDuration);
        },
        _getMaxValue: function() {
            var self = this,
                data = self.options.data,
                max = 0;

            for(var i=data.length-1; i >= 0; i--) {
                max = (data[i].value > max) ? data[i].value : max;
            }
            return max;
        },
        updateWidget: function(updated) {
            var self = this;
            this._super(updated);

            if(updated.data) {
                if(self.options.data !== null){
                    var $graphCells,
                        $html = $(template(self.options.data));

                    // -- set initial size of the graph cell to max
                    $graphCells = $html.find('.graph-bar-cell');
                    for(var i=$graphCells.length; i >= 0; i--) {
                        $($graphCells[i]).css('width', self.options.maxWidth);
                    }

                    self.maxValue = self._getMaxValue();
                    self.lerpValue = self.options.maxWidth / self.maxValue;
                    self.$node.find('table').remove();
                    self.$node.append($html);
                    self.$graphBars = self.$node.find('.graph-bar');
                    self.renderGraphBars();
                }
            }
        }
    });
});
