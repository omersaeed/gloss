/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../togglegroup',
    './../form',
    'text!./togglegroup.html'
], function($, _, ToggleGroup, Form, html) {

    test ('instantiate togglegroup from html', function(){
        var tg, $tg = $(html);
        tg = ToggleGroup($tg).appendTo('#qunit-fixture');

        ok(tg);
        equal(tg.buttons.length, 4, "number of buttons");
        equal(_.first(tg.buttons).$node.text(), "First", "first button name");
        equal(_.last(tg.buttons).$node.text(), "Last", "last button name");

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
        equal(tg.buttons.length, 4, "number of buttons");
        equal(_.first(tg.buttons).$node.text(), "One", "first button name");
        equal(_.last(tg.buttons).$node.text(), "Four", "last button name");
        equal(tg.getValue(), 'two');

        start();
    });

    test('togglegroup setValue', function() {
        var tg = ToggleGroup($(html)).appendTo('#qunit-fixture');
        tg.setValue('first');
        equal(tg.getValue(), 'first');

        tg.setValue('second');
        equal(tg.getValue(), 'second');
    });

    test('togglegroup visual', function(){
        var tg, $tg = $(html);
        tg = ToggleGroup($tg).appendTo('#qunit-fixture');

        ok(tg);
        tg.appendTo($('body'));

        start();
    });

    var isDisabled = function(el) {
            ok($(el).is(':disabled'));
            ok($(el).hasClass('disabled'));
        },
        isEnabled = function(el) {
            ok(!$(el).is(':disabled'));
            ok(!$(el).hasClass('disabled'));
        };

    test('selectively enabling buttons', function() {
        var tg = ToggleGroup($(html)).appendTo('#qunit-fixture');

        tg.disable();
        tg.$node.find('button').each(function(i, el) {
            isDisabled(el);
        });

        tg.enable({first: true});
        tg.$node.find('button').each(function(i, el) {
            if (i === 0) {
                isEnabled(el);
            } else {
                isDisabled(el);
            }
        });

        // this should enable the second but leave the first in the previous
        // state it was in
        tg.enable({first: false, second: true});
        tg.$node.find('button').each(function(i, el) {
            if (i < 2) {
                isEnabled(el);
            } else {
                isDisabled(el);
            }
        });
    });

    test('selectively disabling buttons', function() {
        var tg = ToggleGroup($(html)).appendTo('#qunit-fixture');

        tg.enable();
        tg.$node.find('button').each(function(i, el) {
            isEnabled(el);
        });

        tg.disable({first: true});
        tg.$node.find('button').each(function(i, el) {
            if (i === 0) {
                isDisabled(el);
            } else {
                isEnabled(el);
            }
        });

        // this should disable the second but leave the first in the previous
        // state it was in
        tg.disable({first: false, second: true});
        tg.$node.find('button').each(function(i, el) {
            if (i < 2) {
                isDisabled(el);
            } else {
                isEnabled(el);
            }
        });
    });

    module('events');

    test('setting value only triggers one event', function() {
        var changeCount = 0,
            tg = ToggleGroup($(html)).appendTo('#qunit-fixture')
                .on('change', function() {
                    changeCount++;
                });

        tg.$node.find('[value=second]').trigger('click');
        equal(changeCount, 1);
        tg.$node.find('[value=first]').trigger('click');
        equal(changeCount, 2);
        tg.$node.find('[value=last]').trigger('click');
        equal(changeCount, 3);
        tg.$node.find('[value=last]').trigger('click');
        equal(changeCount, 3);
        tg.setValue();
        equal(changeCount, 4);
    });

    start();
});
