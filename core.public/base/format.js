/*
 * 极简JS模版引擎
 */
(function(factory) {
	if (window.define && define.amd) {
		define(["jquery"], factory);
	} else if (window.jQuery) {
		factory(window.jQuery);
	}
})(function($, undefined) {
	//测试浏览器是否支持正则表达式预编译
	var baseReg = /\{([\w\.]+)\}/g,
		numReg = /^\d+$/,
		//预编译核心的正则表达式，以提高正则匹配效率
		formatReg = baseReg.compile ? baseReg.compile(baseReg.source, "g") || baseReg : baseReg,
		//其他工具函数
		toString = Object.prototype.toString,
		slice = Array.prototype.slice;
	//对外接口
	return $.format = function(string, source) {
		if (source === undefined || source === null) return string;
		var isArray = true,
			type = toString.call(source),
			//检测数据源
			data = type === "[object Object]" ? (isArray = false, source) : type === "[object Array]" ? source : slice.call(arguments, 1),
			N = isArray ? data.length : 0;
		//执行替换
		return String(string).replace(formatReg, function(match, index) {
			var isNumber = numReg.test(index),
				n, fnPath, val;
			if (isNumber && isArray) {
				n = parseInt(index, 10);
				return n < N ? data[n] : match;
			} else { //数据源为对象，则遍历逐级查找数据
				fnPath = index.split(".");
				val = data;
				for (var i = 0; i < fnPath.length; i++)
					val = val[fnPath[i]];
				return val === undefined ? match : val;
			}
		});
	};
});
