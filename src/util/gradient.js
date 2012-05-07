define([
    'path!bedrock:class'
], function(Class) {
    return Class.extend({
        hexRe: /^\s*#?(([0-9a-f]{3})|([0-9a-f]{6}))\s*$/i,

        init: function(start, end, steps) {
            if (this.hexRe.test(start) && this.hexRe.test(end)) {
                this.start = this.colorFromHex(start);
                this.end = this.colorFromHex(end);
            } else {
                throw Error('couldn\'t parse values: '+start+' '+end);
            }

            this.steps = steps;
        },

        colorFromHex: function(hexVal) {
            hexVal = hexVal[0] === '#'? hexVal = hexVal.slice(1) : hexVal;
            return {
                r: parseInt(hexVal.slice(0, 2), 16),
                g: parseInt(hexVal.slice(2, 4), 16),
                b: parseInt(hexVal.slice(4, 6), 16)
            };
        },

        buckets: function(steps) {
            var i, res = [], n = steps == null? this.steps : steps;
            for (i = 0; i < n-1; i++) {
                res.push(i / (n-1));
            }
            res.push(1.0);
            return res;
        },

        bucketize: function(n, steps) {
            var i, buckets = this.buckets(steps);
            while (buckets[i++] < n);
            return buckets[i-1];
        },

        interpolate: function(n, steps) {
            var r, g, b;
            steps = steps == null? this.steps : steps;
            n = steps == null? n : this.bucketize(steps);

            r = this.start.r + ((this.end.r - this.start.r) * n);
            g = this.start.g + ((this.end.g - this.start.g) * n);
            b = this.start.b + ((this.end.b - this.start.b) * n);

            return '#' + r.toString(16) + g.toString(16) + b.toString(16);
        }
    });
});
