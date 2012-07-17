define([
    'vendor/jquery'
], function($) {

	var bytes = function(bytes, options) {
		var i, units, defaults = {
			units: 'short'
		};
		options = $.extend({}, defaults, options || {});
		bytes = parseInt(bytes, 10);
		units = {
			10: options.units === 'short'? ' B' :  ' Bytes',
			20: options.units === 'short'? ' KB' : ' Kilobytes',
			30: options.units === 'short'? ' MB' : ' Megabytes',
			40: options.units === 'short'? ' GB' : ' Gigabytes',
            50: options.units === 'short'? ' TB' : ' Terabytes',
            60: options.units === 'short'? ' PB' : ' Petabytes'
		};

		for (i in units)
			if (bytes < Math.pow(2, i))
				return (bytes / Math.pow(2, i-10)).toFixed(1) + units[i];
		return (bytes / Math.pow(2, 30)).toFixed(1) + units[60];
	};

    var inverse_bytes = function(s) {
        var factor;

        if (/megabyte|mb/i.test(s)) {
            factor = 1000000;
        } else if (/kilobyte|kb/i.test(s)) {
            factor = 1000;
        } else if (/gigabyte|gb/i.test(s)) {
            factor = 1000000000;
        } else if (/terabyte|tb/i.test(s)) {
            factor = 1000000000000;
        } else if (/petabyte|pb/i.test(s)) {
            factor = 1000000000000000;
        } else if (/b/i.test(s)) {
            factor = 1;
        } else {
            try {
                return parseInt(s, 10);
            } catch (e) {
                return 0;
            }
        }

        return factor * parseInt(s, 10);
    }

	var percent = function(num) {
		return (num * 100).toFixed(1) + '%';
	};

	var number = function(number, decimals, decimalPoint, thousandsSep) {
		// http://kevin.vanzonneveld.net
		// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
		// *     example 1: number_format(1234.56);
		// *     returns 1: '1,235'
		// *     example 2: number_format(1234.56, 2, ',', ' ');
		// *     returns 2: '1 234,56'
		// *     example 3: number_format(1234.5678, 2, '.', '');
		// *     returns 3: '1234.57'
		// *     example 4: number_format(67, 2, ',', '.');
		// *     returns 4: '67,00'
		// *     example 5: number_format(1000);
		// *     returns 5: '1,000'
		// *     example 6: number_format(67.311, 2);
		// *     returns 6: '67.31'
		// *     example 7: number_format(1000.55, 1);
		// *     returns 7: '1,000.6'
		// *     example 8: number_format(67000, 5, ',', '.');
		// *     returns 8: '67.000,00000'
		// *     example 9: number_format(0.9, 0);
		// *     returns 9: '1'
		// *    example 10: number_format('1.20', 2);
		// *    returns 10: '1.20'
		// *    example 11: number_format('1.20', 4);
		// *    returns 11: '1.2000'
		// *    example 12: number_format('1.2000', 3);
		// *    returns 12: '1.200'
		// *    example 13: number_format('1 000,50', 2, '.', ' ');
		// *    returns 13: '100 050.00'
		// Strip all characters but numerical ones.
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep,
			dec = (typeof decimalPoint === 'undefined') ? '.' : decimalPoint,
			s = '',
			toFixedFix = function (n, prec) {
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};
		// Fix for IE parseFloat(0.55).toFixed(0) = 0;
		s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
		if (s[0].length > 3) {
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		if ((s[1] || '').length < prec) {
			s[1] = s[1] || '';
			s[1] += new Array(prec - s[1].length + 1).join('0');
		}
		return s.join(dec);
	};

    return {
        bytes: bytes,
        percent: percent,
        number: number,
        inverse: {
            bytes: inverse_bytes
        }
    };
});
