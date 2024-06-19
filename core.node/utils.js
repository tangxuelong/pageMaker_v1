'use strict';
// 小工具集合
// 不依赖于其他任何模块

const toString = Object.prototype.toString;
module.exports = {
	xss(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	},

	random(level) {
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
	},

	//类型判断方法
	is: {
		string: data => toString.call(data) === '[object String]',
		array: data => Array.isArray(data),
		object: data => toString.call(data) === '[object Object]',
		function: data => toString.call(data) === '[object Function]',
		number: data => toString.call(data) === '[object Number]',
		num: data => !isNaN(data),
		url: str => {
			var url = String(str);
			return /^https*:\/\//.test(url) || url.indexOf("//") === 0;
		}
	},

	mimeTypes: {
		png: 'image/png',
		gif: 'image/gif',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		json: 'text/json',
		js: 'application/x-javascript',
		css: 'text/css',
		htm: 'text/html',
		html: 'text/html',
		mp3: 'audio/mp3',
		wav: 'audio/wav',
		txt: 'text/plain',
		svg: 'text/xml',
		x: 'application/octet-stream',
		get: function (str) {
			let ext = String(str).replace(/^\.+/, '').toLowerCase();
			return this[ext] || this.x;
		}
	},

	//替换安全的正则表达式字符串
	safeRegStr: function(str) {
		return String(str).replace(/([\\\(\)\{\}\[\]\^\$\+\-\*\?\|])/g, "\\$1");
	},

	// 用户操作次数记录
	act: {
		key(type) {
			let today = new Date();
			let year = today.getFullYear();
			let month = today.getMonth() + 1;
			let day = today.getDate();
			let hour = today.getHours();
			let min = today.getMinutes();
			let num = 1;
			switch (true) {
				// 以天为单位
				case /^(\d{0,2})day$/.test(type):
					num = Number(RegExp.$1 || "1");
					return [year, month, num + 'd', Math.ceil(day / num)].join("-");
					// 以小时为单位
				case /^(\d{0,2})hour$/.test(type):
					num = Number(RegExp.$1 || "1");
					return [year, month, day, num + 'h', Math.ceil(hour / num)].join("-");
					// 以分钟为单位
				case /^(\d{0,2})min(?:ute)*$/.test(type):
					num = Number(RegExp.$1 || "1");
					return [year, month, day, hour, num + 'm', Math.ceil(min / num)].join("-");
			}
			// 默认设置下，以天为单位
			return [year, month, day].join("-");
		},
		can(act, user, limitNumber, type) {
			if (!act || !user || !limitNumber || act === "can" || act === "key") {
				console.warn("错误的调用了act.can方法。");
				return false;
			}
			// 创建初始化的缓存
			this[act] = this[act] || {};
			// 检查同一个用户是否操作过多
			let key = this.key(type);
			let userCache = this[act][user] = this[act][user] || {};
			userCache[key] = userCache[key] || 0;
			if (userCache[key] >= limitNumber) {
				return false;
			}
			userCache[key]++;
			return true;
		}
	},

	// 简易waterfall工作流
	// 流程控制比promise单一，非常适合发布过程
	waterfall() {
		let fns = Array.prototype.slice.call(arguments);
		let len = fns.length;
		let step = 0;
		let next = function (err, data) {
			if (err) {
				fns[len - 1](err, data);
			} else {
				step++;
				fireFn(data);
			}
		};
		let fireFn = function (data) {
			if (step === 0) {
				fns[step](next);
			} else if (step < len - 1) {
				fns[step](data, next);
			} else {
				fns[step](null, data);
			}
		}
		// 启动
		fireFn();
	}

};
