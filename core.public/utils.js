// 由于本文件不在各个项目内容，编译的时候将不能进行处理
// 除了 export 语法由webpack处理之外，其他的代码不能使用任何新语法

// 类型判断
const toString = Object.prototype.toString;
export const is = {
	string: function (data) {
		return toString.call(data) === '[object String]'
	},
	array: function (data) {
		return Array.isArray(data)
	},
	object: function (data) {
		return toString.call(data) === '[object Object]'
	},
	function: function (data) {
		return toString.call(data) === '[object Function]'
	},
	number: function (data) {
		return toString.call(data) === '[object Number]'
	},
	num: function (data) {
		return !isNaN(data)
	},
	url: function (str) {
		var url = String(str);
		return /^https*:\/\//.test(url) || url.indexOf("//") === 0;
	}
};

// 全局ajax包装，默认带上cookie发送
// 全局ajax变量已经添加到eslint配置文件中，可以像用fetch一样用ajax
// 可以通过定义ajax.use(fn) 来修改ajax的全局返回值
const ajaxMiddleWare = [];
export const ajax = window.ajax = function (url, ops) {
	var job = fetch(url, Object.assign({
		credentials: 'include'
	}, ops || {}));
	ajaxMiddleWare.forEach(function (fn) {
		job = job.then(fn);
	});
	return job;
};
window.ajax.post = function (url, ops) {
	return ajax(url, Object.assign({
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		}
	}, ops || {}))
};
// 全局ajax插件，用于修改默认的ajax返回值处理
ajax.use = function (fn) {
	if (is.function(fn)) {
		ajaxMiddleWare.push(fn);
	}
	return ajax;
};

// 对象深度合并
const slice = Array.prototype.slice;
export const deepMerge = function (target) {
	if (!is.object(target)) {
		return target;
	}
	slice.call(arguments, 1).forEach(function (obj) {
		if (is.object(obj)) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
					// 如果都是对象，则继续深度合并
					if (is.object(target[key]) && is.object(obj[key])) {
						target[key] = deepMerge(target[key], obj[key]);
						// 如果都是数组，则合并数组
					} else if (is.array(target[key]) && is.array(obj[key])) {
						target[key] = target[key].concat(obj[key]);
					} else {
						// 其他情况，则直接用副本覆盖
						target[key] = deepCopy(obj[key]);
					}
				}
			}
		}
	});
	return target;
};

// 对象深度复制
export const deepCopy = function (target) {
	return JSON.parse(JSON.stringify(target))
}

// 对象深度填充
export const deepFill = function (target) {
	if (!is.object(target)) {
		return target;
	}
	slice.call(arguments, 1).forEach(function (obj) {
		if (is.object(obj)) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
					// 如果都是对象，则继续深度填充
					if (is.object(target[key]) && is.object(obj[key])) {
						target[key] = deepFill(target[key], obj[key]);
					} else if (target[key] === undefined) {
						// 只有当target不具有值的情况下，才用副本填充
						target[key] = deepCopy(obj[key]);
					}
				}
			}
		}
	});
	return target;
}

// 对象深度校准合并
export const deepBaseMerge = function (target) {
	if (!is.object(target)) {
		return target;
	}
	slice.call(arguments, 1).forEach(function (obj) {
		if (is.object(obj)) {
			for (var key in target) {
				if (target.hasOwnProperty(key)) {
					// 如果都是对象，则继续深度填充
					if (is.object(target[key]) && is.object(obj[key])) {
						target[key] = deepBaseMerge(target[key], obj[key]);
						// 如果都是数组，则合并数组
					} else if (is.array(target[key]) && is.array(obj[key])) {
						target[key] = target[key].concat(obj[key]);
					} else if (obj[key] !== undefined) {
						// 其他情况，则直接用副本覆盖
						target[key] = deepCopy(obj[key]);
					}
				}
			}
		}
	});
	return target;
}

// 对象浅层校准合并
export const baseMerge = function (target) {
	if (!is.object(target)) {
		return target;
	}
	slice.call(arguments, 1).forEach(function (obj) {
		if (is.object(obj)) {
			for (var key in target) {
				if (target.hasOwnProperty(key)) {
					// 如果都是数组，则合并数组
					if (is.array(target[key]) && is.array(obj[key])) {
						target[key] = target[key].concat(obj[key]);
					} else if (obj[key] !== undefined) {
						// 其他情况，则直接用副本覆盖
						target[key] = deepCopy(obj[key]);
					}
				}
			}
		}
	});
	return target;
}
