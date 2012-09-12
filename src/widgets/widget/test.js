/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../widget'
], function(Widget) {
    test('instantiating a widget', function() {
        var createRan = false,
            A = Widget.extend({
                defaults: {
                    foo: 'bar'
                },
                create: function() {
                    createRan = true;
                }
            }),
            a = A();

        ok(a, 'widget instantiated');
        equal(createRan, true, '"create" method executed');
    });

    test('setting options', function() {
        var A = Widget.extend({
                defaults: {
                    foo: 'default foo value for A'
                }
            }),
            a1 = A(), a2 = A(null, {foo: 'non-default foo value for A'}),
            B = A.extend({
                defaults: {
                    bar: 'default bar value for B'
                }
            }),
            b = B(),
            C = B.extend({
                defaults: {
                    bar: 'default bar value for C'
                }
            }),
            c = C();

        equal(a1.options.foo, 'default foo value for A');
        equal(a2.options.foo, 'non-default foo value for A');
        equal(b.options.foo, 'default foo value for A');
        equal(b.options.bar, 'default bar value for B');
        equal(c.options.foo, 'default foo value for A');
        equal(c.options.bar, 'default bar value for C');
    });

    test('mixins', function() {
        var Mixable = {
                defaults: {
                    foo: 'bar'
                },
                mixalot: function() {
                    ok(true, 'mixin successfully added a method');
                },
                clobber: function() {
                    ok(true, 'mixin successfully clobbered a method');
                }
            },
            A = Widget.extend({
                defaults: {
                    bar: 'baz'
                },
                clobber: function() {
                    ok(false, 'this should have been clobbered');
                }
            }),
            B = A.extend({
                defaults: {
                    baz: 'boom'
                }
            }, {mixins: [Mixable]}),
            // C = A.extend({
            //     defaults: {
            //         foo: 'bang'
            //     }
            // }, {mixins: [Mixable]}),
            b = B(),
            // c = C();
            C, c;

        C = A.extend({
            defaults: {
                foo: 'bang'
            }
        }, {mixins: [Mixable]}),
        c = C();

        b.mixalot();
        b.clobber();
        equal(b.options.bar, 'baz', 'inherited defaults are preserved');
        equal(b.options.baz, 'boom', 'base defaults are preserved');
        equal(b.options.foo, 'bar', 'mixed-in options are preserved');
        equal(c.options.foo, 'bang', 'mixed-in options are overridden by base options');
    });

    start();
});
