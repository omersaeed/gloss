/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
require([
    'path!vendor:jquery',
    'path!gloss:widgets/selectbox'
], function($, SelectBox) {

    module("Select Box");

    asyncTest ('Select Box', function(){
        var sb = SelectBox($('<div></div>'), {
            entries: [
                {content: "Directory", name: 'directory'},
                {content: "Directory0", name: 'directory0'},
                {content: "Directory1", name: 'directory1'},
                {content: "Directory2", name: 'directory2'}
            ]
        });

        equal(sb.options.entries.length, 4, "number of entries is 4");

        sb.appendTo($('body'));

        start();
    });

    start();
});
