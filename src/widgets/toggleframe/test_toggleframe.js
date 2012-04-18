require([
    'path!vendor:jquery',
    'path!gloss:widgets/toggleframe',
    'path!gloss:text!widgets/toggleframe/toggleframe.html'
], function($, ToggleFrame, template) {

    module("Toggle Frame");

    asyncTest ('Toggle Frame', function(){
        var tf = ToggleFrame(template).appendTo($('body'));

        equal(tf.$buttons.length, 4, "number of buttons");
        equal(tf.$buttons.first().text(), "First", "first button name");
        equal(tf.$buttons.last().text(), "Last", "last button name");

        start();
    });

    start();
});
