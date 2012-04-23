// storediq micro-templating
//
// inspired by John Resig's micro-templating:
//
//  http://ejohn.org/blog/javascript-micro-templating/
//
// tweaked by Atanas Korchev (github: akorchev):
//
//  https://gist.github.com/860240
//
// modified to work as a require.js plugin for storediq's client-side and build
// infrastructure
define(function() {
    var compile = function(str) {
        var value = "var out = ''; out+=" + "'" +
            str.replace(/[\r\t\n]/g, " ")
               .replace(/'(?=[^%]*%>)/g,"\t")
               .split("'").join("\\'")
               .split("\t").join("'")
               .replace(/<%=(.+?)%>/g, "'; out += $1; out += '")
               .split("<%").join("';")
               .split("%>").join("out+='") +
               "'; return out;";
       return new Function("data", value);
    };

    return {
        load: function(name, req, load) {
            var url = req.toUrl(name);
            req(['text!' + req.toUrl(name)], function(templateText) {
                load(compile(templateText));
            });
        }
    };
});


