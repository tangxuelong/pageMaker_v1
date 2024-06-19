(function(factory) {
	//amd api
	if (window.define && define.amd) {
		define(function() {
			factory();
		});
	} else {
		factory();
	}
})(function() {
	Number.prototype.Round = function(b, c) {
		var a = Math.pow(10, b || 0);
		return c == 0 ? Math.ceil(this * a) / a : Math.round(this * a + (5 - (c || 5)) / 10) / a
	};
	Number.prototype.Cint = function(a) {
		return this.Round(0, a)
	};
});
