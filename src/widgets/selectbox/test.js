/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
require([
    'path!vendor:jquery',
    'path!gloss:widgets/selectbox',
    'path!gloss:widgets/form',
    'path!gloss:text!widgets/selectbox/selectbox.html'
], function($, SelectBox, Form, html) {

    module("Select Box");

    test('Select Box', function(){
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
    });

    test('selectbox from html', function() {
        var sb = SelectBox($(html).appendTo('#qunit-fixture'));
        equal(sb.options.entries.length, 3);
        equal(sb.getValue(), 3);
    });
    test ('selectbox on form is wigetized', function(){
        var $form = $('<form>').html(html).appendTo('#qunit-fixture'),
            form = Form($form, {widgetize: true});

        ok($form);
        ok(form);

        form.appendTo($('body'));
    });
    start();
});
