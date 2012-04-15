/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
require([
    'path!vendor:jquery',
    'path!gloss:widgets/basemenu'
], function($, BaseMenu) {

    var showGrid = function() {
            $('#qunit-fixture').css({position: 'static'});
        },
        hideGrid = function() {
            $('#qunit-fixture').css({position: 'absolute'});
        },
        setup = function() {
            this.baseMenu = BaseMenu($('<div></div>'), {
                entries: [
                    {content: "Directory", name: 'directory'},
                    {content: "Directory0", name: 'directory0'},
                    {content: "Directory1", name: 'directory1'},
                    {content: "Directory2", name: 'directory2'}
                ]
            }).appendTo($('#qunit-fixture'));
        };

    module("BaseMenu", {setup: setup});

    asyncTest ('BaseMenu Check', function(){
        var menu = this.baseMenu, options = this.baseMenu.options;

        ok(true, "true");
        ok(options.entries.length === 4, "number of entries");

        menu.appendTo($('body'));

        start();
    });

    start();
});
