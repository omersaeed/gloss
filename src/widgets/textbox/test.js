/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../textbox'
], function($, TextBox) {

    var getCursorPos = function(node) {
        var ctrl = $(node)[0];

        var pos = 0;
        // IE Support
        if (document.selection) {

            ctrl.focus ();
            var Sel = document.selection.createRange ();

            Sel.moveStart ('character', -ctrl.value.length);

            pos = Sel.text.length;
        } else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            pos = ctrl.selectionStart;
        }

        return (pos);
    };

    test('textbox instantiation', function() {
        ok(TextBox().appendTo('#qunit-fixture'));
    });

    test('textbox placeholder text', function() {
        var $input = $('<input type=text placeholder=foo />').appendTo('body'),
            textBox = TextBox($input, {placeholderFallback: true}),
            textBoxH5 = TextBox($('<input type=text placeholder=bar />')
                .appendTo('body'));

        equal(textBox.$node.val(), 'foo');
        equal(textBox.getValue(), '');

        textBox.$node.focus();

        equal(getCursorPos(textBox.$node), 0);

        textBox.setValue('abc');

        ok(!textBox.$node.hasClass('placeholder'));

        equal(textBox.$node.val(), 'abc');
        equal(textBox.getValue(), 'abc');

        textBox.setValue('');

        equal(textBox.$node.val(), 'foo');
        equal(textBox.getValue(), '');
    });

    start();
});
