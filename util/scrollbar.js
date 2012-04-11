define([
    'path!vendor:jquery'
], function($) {
    var w;
    return {
        width: function() {
            if (typeof w === 'undefined') {
                var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>'); 
                $('body').append(div); 
                var w1 = $('div', div).innerWidth(); 
                div.css('overflow-y', 'scroll'); 
                var w2 = $('div', div).innerWidth(); 
                $(div).remove(); 
                w = w1 - w2;
            }
            return w;
        }
    };
});
