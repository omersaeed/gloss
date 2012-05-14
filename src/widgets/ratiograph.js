/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 6:07 PM
 * Description: Graph widget to display total object vs. current object
 */

define([
    'component!vendor:jquery',
    './widget',
    'text!./ratiograph/ratiograph.html',
    'css!./ratiograph/ratiograph.css'
], function ($, Widget, template) {
    return Widget.extend({
        defaults: {
            animationDuration: 1000,
            totalWidth: 50,
            totalHeight: 50,
            totalCount: 100,
            currentCount: 100
        },
        nodeTemplate: template,

        create: function() {
            var self = this;
            this._super();

            self.$totalCount = self.$node.find('.total-count');
            self.$currentCount = self.$node.find('.current-count');
            self.$totalView = self.$node.find('.total-count-view');
            self.$currentView = self.$node.find('.current-count-view');

            self.update();
        },
        renderCurrentCount: function() {
            var self = this,
                currentCount = self.options.currentCount,
                totalCount = self.options.totalCount,
                totalWidth = self.options.totalWidth,
                totalHeight = self.options.totalHeight,
                currentWidth, currentHeight,
                area, newArea, cssProps;


            area = totalWidth * totalHeight;
            newArea = area * (currentCount/totalCount);
            currentWidth = Math.sqrt(newArea);
            currentHeight = Math.sqrt(newArea);

            cssProps = {
                width: currentWidth + 'px',
                height: currentHeight + 'px',
                top: (totalWidth - currentWidth) + 'px',
                left: (totalHeight - currentHeight) + 'px'
            }
            self.$currentCount.text(currentCount);
            self.$currentView.animate(cssProps, self.options.animationDuration);
        },
        renderTotalCount: function() {
            var self = this;
            self.$totalCount.text(self.options.totalCount);
        },
        renderTotalView: function() {
            var self = this;
            self.$totalView.css('width', self.options.totalWidth);
            self.$totalView.css('height', self.options.totalHeight);
        },
        updateWidget: function(updated) {
            var self = this;
            this._super(updated);

            if(updated.totalCount) {
                self.renderTotalCount();
            }
            if(updated.totalWidth || updated.totalHeight) {
                self.renderTotalView();
            }
            if(updated.currentCount) {
                if(self.options.totalCount < self.options.currentCount) {
                    throw new Error('Total count cannot be less than the current count. ' +
                        'totalCount: ' + self.options.totalCount +
                        ' currentCount: ' + self.options.currentCount);
                } else {
                    self.renderCurrentCount();
                }
            }
        }
    });
});
