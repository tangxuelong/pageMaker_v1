// 日志输出模块
'use strict';

let slice = Array.prototype.slice;
let lastTime = Date.now();
let getTimeDesc = function(date) {
	var d = new Date(date);
	return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("/") + " " + [d.getHours(), d.getSeconds(), d.getMinutes()].join(":")
};
let getAnFunction = (method, prefix) => {
	return function(){
		let arg = slice.call(arguments);
		let now = Date.now()
		arg = [prefix, getTimeDesc(now), "[" + (now - lastTime) + "ms]"].concat(arg);
		lastTime = now;
		return console[method].apply(console, arg);
	};
};

module.exports = function(key) {
	let prefix = "[" + (key || "console") + "]";
	return {
		log: getAnFunction("log", prefix),
		error: getAnFunction("error", prefix),
		warn: getAnFunction("warn", prefix)
	}
};
