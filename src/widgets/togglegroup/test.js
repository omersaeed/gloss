/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'component!vendor:jquery',
    './../togglegroup',
    './../form',
    'text!./togglegroup.html'
], function($, ToggleGroup, Form, html) {

    test ('instantiate togglegroup from html', function(){
        var tg, $tg = $(html);
        tg = ToggleGroup($tg).appendTo('#qunit-fixture');

        ok(tg);
        equal(tg.$buttons.length, 4, "number of buttons");
        equal(tg.$buttons.first().text(), "First", "first button name");
        equal(tg.$buttons.last().text(), "Last", "last button name");

        start();
    });

    test ('instantiate togglegroup from html sets value', function(){
        var tg, $tg = $(html);
        tg = ToggleGroup($tg).appendTo('#qunit-fixture');

        equal(tg.getValue(), 'third');
        $tg.remove();
        $tg = $(html.replace(/checked/, '')).appendTo('#qunit-fixture');
        tg = ToggleGroup($tg);
        equal(tg.getValue(), null);

        start();
    });

    test ('togglegroup on form is wigetized', function(){
        var $form = $('<form>').html(html),
            form = Form($form, {widgetize: true}).appendTo('#qunit-fixture');

        ok(form.getWidget('my-togglegroup'));
        equal(form.getWidget('my-togglegroup').getValue(), 'third');

        start();
    });

    test('instantiate togglegroup with no html', function(){
        var tg;
        tg = ToggleGroup(undefined, {
            items: [
                {value: 'one', text: 'One'},
                {value: 'two', text: 'Two'},
                {value: 'three', text: 'Three'},
                {value: 'four', text: 'Four'}
            ],
            initialValue: 'two'
        }).appendTo('#qunit-fixture');

        ok(tg);
        equal(tg.$buttons.length, 4, "number of buttons");
        equal(tg.$buttons.first().text(), "One", "first button name");
        equal(tg.$buttons.last().text(), "Four", "last button name");
        equal(tg.getValue(), 'two');

        start();
    });

    test('togglegroup visual', function(){
        var tg, $tg = $(html);
        tg = ToggleGroup($tg).appendTo('#qunit-fixture');

        ok(tg);
        tg.appendTo($('body'));

        start();
    });

    start();
});
