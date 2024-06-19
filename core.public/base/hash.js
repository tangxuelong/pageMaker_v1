/*
 * hash操作组件，源代码在组件库中
 */
(function(factory) {
	if (window.define && define.amd) {
		define(["jquery"], function($) {
			factory($);
		});
	} else if (window.jQuery) {
		factory(jQuery)
	}
})(function($) {
	return $.hash = function(a, b) {
		if (typeof a === "string" && b === undefined) return $.getHashPara(a);
		var c = window.location.hash.replace(/^#*/, "").split("&"),
			keys = {},
			n = c.length,
			i = 0,
			t, HASH = {},
			map = {},
			k, para;
		for (; i < n; i++) {
			t = c[i].split("=");
			if (t.length == 2 && t[0].length) {
				para = decodeURIComponent(t[0]);
				k = para.toLowerCase();
				if (!map[k]) {
					HASH[para] = decodeURIComponent(t[1]);
					map[k] = para
				}
			}
		}
		if (a === undefined) return HASH;
		if ($.isPlainObject(a)) keys = a;
		else keys[a] = b;
		for (para in keys) {
			b = keys[para];
			k = para.toLowerCase();
			map[k] && HASH[map[k]] !== undefined && delete HASH[map[k]];
			if (b !== null) {
				map[k] = para;
				HASH[para] = String(b)
			}
		}
		c.length = 0;
		for (para in HASH) c.push(encodeURIComponent(para) + "=" + encodeURIComponent(HASH[para]));
		window.location.hash = "#" + c.join("&")
	};
});
