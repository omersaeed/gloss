/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../numberbox'
], function($, NumberBox) {

    test('numberbox instantiation', function() {
        ok(NumberBox().appendTo('#qunit-fixture'));
    });

    test('numberbox blank value', function() {
        var numberBox = NumberBox();

        equal(numberBox.getValue(), null);

        numberBox.setValue('123');
        equal(numberBox.getValue(), '123');

        numberBox.setValue('');
        equal(numberBox.getValue(), null);

    });

    start();
});
