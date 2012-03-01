require([
    'vendor/jquery',
    'vendor/gloss/widgets/menu'
], function($, Menu) {

    var showGrid = function() {
            $('#qunit-fixture').css({position: 'static'});
        },
        hideGrid = function() {
            $('#qunit-fixture').css({position: 'absolute'});
        },
        setup = function() {
            this.menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory", name: 'directory'},
                    {content: "Directory0", name: 'directory0'},
                    {content: "Directory1", name: 'directory1'},
                    {content: "Directory2", name: 'directory2'}
                ]
            }).appendTo($('#qunit-fixture'));
        };

    module("Menu", {setup: setup});

    asyncTest ('Menu Check', function(){
        var menu = this.menu, options = this.menu.options;

        ok(true, "true");
        ok(options.entries.length === 4, "number of entries");

        menu.appendTo($('body'));

        start();
    });
});