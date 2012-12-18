/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../simpleview'
], function($, _, SimpleView) {

    var template = _.template('<div><% this.set("updateRanBeforeRender", this.get("updateRan")); this.set("renderCount", this.get("renderCount")+1); %><span class=expected></span></div>'),
        MyView = SimpleView.extend({
            defaults: {foo: 123, renderCount: 0},
            template: template,
            update: function(updated) {
                this.set('updateRan', true, {silent: true});
                this.set('defaultsPresent', this.get('foo') === 123);
            }
        }),
        MyViewThatReRendersOnUpdate = MyView.extend({
            defaults: {
                rerender: 'this will trigger a double-render if we\'re not careful'
            },
            update: function(updated) {
                var ret = this._super.apply(this, arguments);
                if (updated.rerender) {
                    this.render();
                }
            }
        }),
        tests = function(view) {
            ok(view.get('updateRan'), 'update ran');
            ok(view.get('updateRanBeforeRender'), 'update ran before render');
            ok(view.get('defaultsPresent'), 'defaults are present');
            equal(view.$el.find('.expected').length, 1, 'expected span was present');
        };

    module('common patterns');

    test('dont attach the view to anything', function() {
        var view = MyView();
        tests(view);
    });

    test('attach view with appendTo after instantiation', function() {
        var view = MyView().appendTo('#qunit-fixture');
        tests(view);
    });

    test('pass in a detached $element', function() {
        var $el, view = MyView({$el: ($el = $('<div>'))});
        tests(view);
        ok(view.el === $el[0], 'element is still there');
    });

    test('pass in an attached $element', function() {
        var $el, view = MyView({
            $el: ($el = $('<div>').appendTo('#qunit-fixture'))
        });
        tests(view);
        ok(view.el === $el[0], 'element is still there');
    });

    test('pass in a detached element', function() {
        var el, view = MyView({el: (el = $('<div>')[0])});
        tests(view);
        ok(view.el === el, 'element is still there');
    });

    test('pass in an attached element', function() {
        var el, view = MyView({el: (el = $('<div>').appendTo('#qunit-fixture')[0])});
        tests(view);
        ok(view.el === el, 'element is still there');
    });

    module('pausing rendering');

    test('rendering paused during initialization', function() {
        var mvtrrou = MyViewThatReRendersOnUpdate();
        equal(mvtrrou.get('renderCount'), 1);
    });

    start();
});
