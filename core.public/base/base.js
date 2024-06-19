(function(factory) {
	//amd api
	if (window.define && define.amd) {
		define("base", ["jquery"], function($) {
			factory();
		});
	} else if (window.jQuery) {
		factory(window.jQuery);
	}
})(function($) {
	$.extend(Number.prototype, {
		Round: function(b, c) {
			var a = Math.pow(10, b || 0);
			return c == 0 ? Math.ceil(this * a) / a : Math.round(this * a + (5 - (c || 5)) / 10) / a
		},
		Cint: function(a) {
			return this.Round(0, a)
		}
	});
});
