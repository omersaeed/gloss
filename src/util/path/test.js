/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../path'
], function(path) {
    module('nomralize');

    test('foo/../bar', function() {
        equal(path.normalize('foo/../bar'), 'bar');
    });

    test('../bar/baz/boom/../bang', function() {
        equal(path.normalize('../bar/baz/boom/../bang'), '../bar/baz/bang');
    });

    test('/baz//boom/bing', function() {
        equal(path.normalize('/baz//boom/bing'), '/baz/boom/bing');
    });

    test('baz//boom/../bing/', function() {
        equal(path.normalize('baz//boom/../bing/'), 'baz/bing/');
    });

    module('join');

    test('/bar boom', function() {
        equal(path.join('/bar', 'boom'), '/bar/boom');
    });

    test('/ boom', function() {
        equal(path.join('/', 'boom'), '/boom');
    });

    start();
});
