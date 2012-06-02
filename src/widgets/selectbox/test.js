/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    './../selectbox',
    './../form',
    './../../data/mock',
    './../../test/api/v1/targetvolume',
    'text!./../../test/api/v1/test/fixtures/targetvolume.json',
    'text!./selectbox.html'
], function($, SelectBox, Form, Mock, TargetVolume, targetvolume_json, html) {

    module("Select Box");

    Mock(TargetVolume, JSON.parse(targetvolume_json));

    test('Select Box', function(){
        var sb = SelectBox($('<div></div>'), {
            entries: [
                {content: "Directory",  value: 'directory'},
                {content: "Directory0", value: 'directory0'},
                {content: "Directory1", value: 'directory1'},
                {content: "Directory2", value: 'directory2'}
            ]
        });

        equal(sb.options.entries.length, 4, "number of entries is 4");

        sb.appendTo($('#qunit-fixture'));
    });

    test('selectbox from html', function() {
        var sb = SelectBox($(html).appendTo('#qunit-fixture'));
        equal(sb.options.entries.length, 3);
        equal(sb.getValue(), 3);
    });

    test('selectbox on form is wigetized', function(){
        var $form = $('<form>').html(html).appendTo('#qunit-fixture'),
            form = Form($form, {widgetize: true});

        ok($form);
        ok(form);

        form.appendTo($('#qunit-fixture'));
    });

    test('instantiating from &lt;select&gt;', function() {
        var $sel = $('<select name=foo><option value=1>bar</option><option value=2>baz</option></select>'),
            selectbox = SelectBox($sel);

        deepEqual(selectbox.options.entries, [
            {content: 'bar', value: "1"},
            {content: 'baz', value: "2"}
        ]);
        deepEqual(selectbox.menu.options.entries, [
            {content: 'bar', value: "1"},
            {content: 'baz', value: "2"}
        ]);

        equal(selectbox.$node.attr('name'), 'foo');

        equal(selectbox.$node.attr('id'), selectbox.id);
    });

    asyncTest('selectbox with collection at instantiation time loads', function() {
        var sb = SelectBox(undefined, {
            collection: TargetVolume.collection()
        }).appendTo('body');
        setTimeout(function() {
            equal(sb.options.entries.length, 6);
            equal(sb.menu.options.entries.length, 6);
            sb.$node.trigger('click');
            setTimeout(function() {
                equal(sb.$node.find('.menu ul li').length, 6);
                start();
            });
        }, 50);
    });

    asyncTest('selectbox with collection set after instantiation loads', function() {
        var sb = SelectBox().appendTo('body');
        sb.set('collection', TargetVolume.collection());
        setTimeout(function() {
            equal(sb.options.entries.length, 6);
            equal(sb.menu.options.entries.length, 6);
            sb.$node.trigger('click');
            setTimeout(function() {
                equal(sb.$node.find('.menu ul li').length, 6);
                start();
            });
        }, 50);
    });

    start();
});
