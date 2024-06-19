/*
 * 函数执行保护
 * 2013-04-19 马超 增加
 * fn [必选]要保护的函数
 * key [必选]保护标识，设置为 @ 开头的字符串时，将采用后到优先的模式，否则就是先到优先模式
 * time [可选]缓冲保护时间，单位毫秒，默认20
 * owner [可选]保护函数的owner，即this对象，默认window
 * [警告]所有原函数的返回值将不能被处理！
 */
(function(factory) {
	//amd api
	if (window.define && define.amd) {
		define(["jquery"], function($) {
			return factory($);
		});
	} else {
		factory(window.jQuery);
	}
})(function($) {
	if (!$) return null;
	var keyCache = {}; //并发锁缓存
	return $.getProtectedFn = function(fn, key, time, owner) { //处理函数
		if (!$.isFunction(fn) || !key) return fn;
		//type 0：先到优先  1：后到优先
		var type = key.slice(0, 1) == "@" ? 1 : 0,
			//时间缓冲默认20ms， this默认传递
			tt = time || 20,
			$this = owner;
		//如果不设置时间
		if (isNaN(tt)) {
			tt = 20;
			$this = time;
		}
		return [
			//先到优先模式
			function() {
				if (keyCache[key]) return;
				keyCache[key] = true;
				//先执行函数，防止函数运行时间占用倒计时间隔
				fn.apply($this || this, arguments);
				//延时后解锁
				window.setTimeout(function() {
					if (keyCache[key]) delete keyCache[key];
				}, tt);
			},
			//后到优先模式
			function() {
				if (keyCache[key]) window.clearTimeout(keyCache[key]);
				var agr = arguments,
					env = this;
				keyCache[key] = window.setTimeout(function() {
					fn.apply($this || env, agr);
					if (keyCache[key]) delete keyCache[key];
				}, tt);
			}
		][type];
	};
});
