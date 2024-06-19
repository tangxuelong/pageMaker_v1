(function(factory) {
	var color = factory();
	//amd api
	if (window.define && define.amd) {
		define(["jquery"], function($) {
			$.extend(color);
			return color;
		});
	} else if (window.jQuery) {
		jQuery.extend(color);
	}
})(function() {
	function hslToRgb(h, s, l) {
		function hue2rgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}
		var r, g, b;
		if (s == 0) {
			r = g = b = l; // achromatic
		} else {
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	function rgbToHsl(r, g, b) {
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if (max == min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}
		return [h, s, l];
	}

	return {
		contrastColor: function(colorStr) {
			var r, g, b, a = 1;
			if (/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.test(colorStr)) {
				r = parseInt(RegExp.$1, 16);
				g = parseInt(RegExp.$2, 16);
				b = parseInt(RegExp.$3, 16);
			}
			if (/rgb\((\d+)\,(\d+)\,(\d+)\)/.test(colorStr)) {
				r = +RegExp.$1;
				g = +RegExp.$2;
				b = +RegExp.$3;
			}
			if (/rgba\((\d+)\,(\d+)\,(\d+),([\d\.]+)\)/.test(colorStr)) {
				r = +RegExp.$1;
				g = +RegExp.$2;
				b = +RegExp.$3;
				a = +RegExp.$4;
			}

			// return "rgb("+ [255-r, 255-g, 255-b].join(",") + ")"
			var hsl = rgbToHsl(r, g, b);
			hsl[2] = (hsl[2] + 0.5) % 1.0; //反转亮度
			hsl[2] *= a; //考虑透明度导致的亮度变化
			var new_rgb = hslToRgb.apply(null, hsl);

			return "#" + $.map(hslToRgb.apply(null, hsl), function(ele) {
				var char = ele.toString(16);
				if (char.length === 1) {
					char = '0' + char;
				}
				return char;
			}).join("");
		},
		reverseColor: function(rgbColor) {
			rgbColor = rgbColor.replace(/\s/g, "");
			var arrRGB = new Array(3);
			if (rgbColor.indexOf("rgb") > -1) {
				var colorReg = /\s*\d+,\s*\d+,\s*\d+/i;
				var t = colorReg.exec(rgbColor)[0].split(",");
				for (var i = 0; i < arrRGB.length; i++) {
					arrRGB[i] = 255 - t[i];
				}
			} else if (rgbColor.indexOf("#") > -1) {
				if (rgbColor.length > 4) //"#fc0,#ffcc00"
				{
					var j = 1;
					for (var i = 0; i < arrRGB.length; i++) {
						arrRGB[i] = 255 - parseInt(rgbColor.substr((i + j), 2), 16);
						j += 1;
					}
				} else {
					for (var i = 0; i < arrRGB.length; i++) {
						var t = rgbColor.substr((i + 1), 1);
						t = t + t;
						arrRGB[i] = 255 - parseInt(t, 16);
					}
				}
			}
			return "rgb(" + arrRGB.join(",") + ")";
		},
		getColor: function(colorString) {
			var color = $.trim(colorString).toLowerCase();
			if (/^#[\da-z]{3}$/.test(color)) {
				color = "#" + $.map(color.slice(1).split(""), function(k) {
					return k + k;
				}).join("");
			} else if (!/^#[\da-z]{6}$/.test(color)) {
				color = color;
			}
			return color;
		}
	};
});
