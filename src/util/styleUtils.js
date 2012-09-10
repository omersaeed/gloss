define([], function() {
    /**
     * https://developer.mozilla.org/en-US/docs/DOM/CSSStyleSheet/insertRule
     *
     * Add a stylesheet rule to the document (may be better practice, however,
     *  to dynamically change classes, so style information can be kept in
     *  genuine styesheets (and avoid adding extra elements to the DOM))
     * Note that an array is needed for declarations and rules since ECMAScript does
     * not afford a predictable object iteration order and since CSS is 
     * order-dependent (i.e., it is cascading); those without need of
     * cascading rules could build a more accessor-friendly object-based API.
     * @param {Array} decls Accepts an array of JSON-encoded declarations
     * @example
    addStylesheetRules([
      ['h2', // Also accepts a second argument as an array of arrays instead
        ['color', 'red'],
        ['background-color', 'green', true] // 'true' for !important rules 
      ], 
      ['.myClass', 
        ['background-color', 'yellow']
      ]
    ]);
     */
    var addStylesheetRules = function(decls) {
        var style = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild(style);
        if (!window.createPopup) { /* For Safari */
           style.appendChild(document.createTextNode(''));
        }
        var s = document.styleSheets[document.styleSheets.length - 1];
        for (var i=0, dl = decls.length; i < dl; i++) {
            var j = 1, decl = decls[i], selector = decl[0], rulesStr = '';
            if (Object.prototype.toString.call(decl[1][0]) === '[object Array]') {
                decl = decl[1];
                j = 0;
            }
            for (var rl=decl.length; j < rl; j++) {
                var rule = decl[j];
                rulesStr += rule[0] + ':' + rule[1] + (rule[2] ? ' !important' : '') + ';\n';
            }
     
            if (s.insertRule) {
                s.insertRule(selector + '{' + rulesStr + '}', s.cssRules.length);
            }
            else { /* IE */
                s.addRule(selector, rulesStr, -1);
            }
        }
    };
    
    return {
        addStyleRules: addStylesheetRules
    };
});
