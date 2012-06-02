define([
    'vendor/underscore',
    'bedrock/class'
], function(_, Class) {
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
            var sliceArgs = [[0, 1], [1, 2], [2, 3]];
            hexVal = hexVal[0] === '#'? hexVal = hexVal.slice(1) : hexVal;
            if (hexVal.length === 6) {
                sliceArgs = _.map(sliceArgs, function(arg) {
                    return _.map(arg, function(v) { return v * 2; });
                });
            }
            return {
                r: parseInt(hexVal.slice.apply(hexVal, sliceArgs[0]), 16),
                g: parseInt(hexVal.slice.apply(hexVal, sliceArgs[1]), 16),
                b: parseInt(hexVal.slice.apply(hexVal, sliceArgs[2]), 16)
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
            var i = 0, buckets = this.buckets(steps);
            while (buckets[i++] < n);
            return buckets[i-1];
        },

        interpolate: function(n, steps) {
            var r, g, b, fmt = function(n) {
                return Math.floor(n).toString(16);
            };

            steps = steps == null? this.steps : steps;
            n = steps == null? n : this.bucketize(n);

            r = this.start.r + ((this.end.r - this.start.r) * n);
            g = this.start.g + ((this.end.g - this.start.g) * n);
            b = this.start.b + ((this.end.b - this.start.b) * n);

            return '#' + fmt(r) + fmt(g) + fmt(b);
        }
    });
});
