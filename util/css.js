// keep this slim...
define([], function() {

    return {

        inject: function (text) {

            if (text.replace(/^\s+|\s+$/g,"") === '') return;

            var css = document.createElement('style');
            css.setAttribute('type', 'text/css');

            if (css.styleSheet) { // b/c of IE...
                css.styleSheet.cssText = text;
            } else {
                css.innerHTML = text;
            }

            document.getElementsByTagName('head')[0].appendChild(css);
        },

        load: function (url) {
            var link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = url;
            document.getElementsByTagName('head')[0].appendChild(link);
        }

    };

});

