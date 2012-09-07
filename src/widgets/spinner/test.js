define([
    'vendor/jquery',
    'gloss/util/styleUtils',
    './../spinner'
], function ($, StyleUtils, Spinner) {

    test('Object instantiation', function () {
        var s = Spinner().appendTo('#qunit-fixture');

        ok(s);
    });

    test('functional', function () {
        var s = Spinner('<h1></h1>').appendTo('body');

        ok(s);
        s.disable();
        s.enable();

    }),

   test('visual', function () {
       var s = Spinner(undefined, {
           target: $('body')[0]
       }).appendTo('body');

       ok(s);
       s.disable();
       setTimeout(function() {
           s.enable();
       }, 5000);
   });

    test('modifying styles', function () {
        var spinner,
            hideColumnCssNotFormated = "#widget10.hide-col-owner .col-owner { display: none; }",
            hideColumnCssFormated = [
                            ["#widget10.hide-col-owner .col-owner", ["display","none"]],
                            ["#widget11.hide-col-owner .col-owner", ["display","none"]]
                        ],
            $target = $(
                    '<div>' +
                        '<div class=target></div>' +
                    '</div>');

        spinner = Spinner();
        $target.width(100);
        $target.height(100);
        $('body').append($target)
        spinner.set('target', $target[0]);
        
        ok(spinner);
        spinner.disable();
        setTimeout(function() {
            spinner.enable();
            setTimeout(function() {
                // this will break it 
//                $('style').html(hideColumnCssNotFormated);
                // so use this instead WITH the proper formating
                StyleUtils.addStyleRules(hideColumnCssFormated);
                spinner.disable()
            }, 500);
        }, 500);
    });

    start();
});
