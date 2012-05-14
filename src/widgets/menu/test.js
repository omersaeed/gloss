/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'component!vendor:jquery',
    './../menu'
], function($, Menu) {

    test('Menu Check', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'},
                    {content: "Directory0", value: 'directory0'},
                    {content: "Directory1", value: 'directory1'},
                    {content: "Directory2", value: 'directory2'}
                ]
            }).appendTo($('body')),
            options = menu.options;

        menu.show();

        ok(true, "true");
        ok(options.entries.length === 4, "number of entries");
    });

    start();
});
