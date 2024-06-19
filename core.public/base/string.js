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
	String.random = function(level) {
		var lvl = {
				2: 2,
				3: 3,
				4: 4,
				5: 5
			}[level] || 1,
			rnd = "";
		for (var i = 0; i < lvl; i++) {
			rnd += Math.random().toString(36).slice(2);
		}
		return rnd;
	};
});
