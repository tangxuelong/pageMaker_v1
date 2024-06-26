! function(fn) {
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = fn();

	} else if (typeof define === "function" && define.amd) {
		define([], fn);

	} else {
		var f;
		typeof window !== "undefined" ? f = window :
			typeof global !== "undefined" ? f = global :
			typeof self !== "undefined" ? f = self : f = {}, f.URL = fn();
	}
}(function() {
	var URL = {};

	//简易工具
	var $ = {
		each: function(arr, fn) {
			for (var i = 0; i < arr.length; i++) {
				fn(i, arr[i]);
			}
		},
		map: function(arr, fn) {
			$.each(arr, function(i, val) {
				arr[i] = fn(val, i);
			});
			return arr;
		},
		getParaFromString: function(str, paraName) {
			var data = {};
			$.each(("" + str).match(/([^=&#\?]+)=[^&#]+/g) || [], function(i, para) {
				var d = para.split("="),
					val = decodeURIComponent(d[1]);
				if (data[d[0]] !== undefined) {
					data[d[0]] += "," + val;
				} else {
					data[d[0]] = val;
				}
			});
			return paraName !== true ? data[paraName] || "" : data;
		}
	};

	/**
	 * @name URL.getPara
	 * @description 从页面URL中获取指定的参数内容
	 * @param {string} [url] 要处理的url，如果不提供，则取当前页面的url
	 * @param  {string|true} paraName 要读取的参数，设置为true则返回参数描述对象
	 * @return {string|object}  如果paraName是字符串则返回对应的参数值，如果paraName为true则返回所有url中的参数描述对象
	 * @function
	 */
	URL.getPara = function(url, paraName, _hash) {
		if (!url && !paraName) {
			return "";
		}
		if (!paraName && window) {
			paraName = url;
			url = window.location[_hash ? "hash" : "search"];
		}
		if (!url) {
			return "";
		}
		return $.getParaFromString((url + "").split("#")[_hash ? 1 : 0], paraName);
	};

	/**
	 * @name URL.getHash
	 * @description 从页面URL中获取指定的参数内容
	 * @param {string} [url] 要处理的url，如果不提供，则取当前页面的url
	 * @param  {string|true} paraName 要读取的参数，设置为true则返回参数描述对象
	 * @return {string|object}  如果paraName是字符串则返回对应的参数值，如果paraName为true则返回所有url中的参数描述对象
	 * @function
	 */
	URL.getHash = function(url, paraName) {
		return URL.getPara(url, paraName, true);
	};

	/**
	 * @name URL.removePara
	 * @param {string} url 要处理的url，如果不提供，则取当前页面的url
	 * @param {string|array<string>|true} paraName 要移除的参数或数组，比如 "id" 或 ["name","id"] 或 true
	 * @return {string} 处理好的url字符串(不会修改当前页面的url地址)，如果paraName传递true，则删除所有的参数
	 * @function
	 */
	URL.removePara = function(url, paraName) {
		if (!paraName) {
			paraName = url;
			url = document.URL;
		}
		if (!paraName || !url) {
			return url;
		}
		var arr1 = url.split("#"),
			arr2 = arr1[0].split("?"),
			base = arr2[0],
			para = arr2.length > 1 ? arr2[1] : "",
			hash = arr1.length > 1 ? "#" + arr1[1] : "",
			paraReg = typeof paraName === "string" ? [paraName] : paraName.join ? paraName : [];
		if (!paraReg.length || !para) {
			return base.replace(/\?.+$/, "") + hash;
		}
		$.map(paraReg, function(str) {
			return str.replace(/([\\\(\)\{\}\[\]\^\$\+\-\*\?\|])/g, "\\$1");
		});
		return (
			base + "?" + para.replace(new RegExp("(\?:^\|&)(?:" + paraReg.join("|") + ")=[^&$]+", "g"), "").replace(/^&/, "")
		).replace(/\?$/, "") + hash;
	};

	/**
	 * @name URL.addPara
	 * @param {string} [url] 要处理的url，默认是当前页面url
	 * @param {string|object} para 要增加的参数，比如 "id=1&name=machao" 或 key-value对象
	 * @param {boolean} [removeSamePara=false] 添加之前是否先移除同名的参数
	 * @return {string} 处理好的url字符串
	 * @function
	 */
	URL.addPara = function(href, para, removeSamePara) {
		//预处理参数
		var arg = arguments,
			argLen = arg.length;
		if (typeof para === "boolean" && argLen === 2) {
			removeSamePara = para;
			para = href;
			href = document.URL;
		}
		if (argLen === 1) {
			para = href;
			href = document.URL;
		}
		if (!para) {
			return href;
		}

		//兼容para是对象的情况
		if (Object.prototype.toString.call(para) === "[object Object]") {
			para = (function(para) {
				var p = [];
				for (var key in para) {
					p.push(key + "=" + para[key]);
				}
				return p.join("&");
			})(para);
		}

		//开始处理，不处理hash数据
		var url = (href + "").split('#');
		//先移除同名参数
		if (removeSamePara) {
			url[0] = URL.removePara(url[0], $.map(para.match(/([^=&#\?]+)=[^&#]+/g), function(str) {
				return str.replace(/=.+$/, "");
			}));
		}
		var sp = url[0].indexOf("?") + 1 ? "&" : "?";
		return (url[0] + sp + para + (url.length > 1 ? "#" + url[1] : "")).replace(/\?\&/, "?");
	};

	/**
	 * @name URL.getInfo
	 * @description 分析url中的信息
	 * @param  {string} [url] 要分析的url，默认是当前页面地址
	 * @return {object}  类似location对象的一个描述对象(href/orgin/protocol/username/password/host/hostname/port/pathname/search/hash)
	 */
	URL.getInfo = function(url, isFullUrl) {
		var fixUrl = isFullUrl ? url : URL.getFullPath(url || document.URL),
			info = $.map(/^((\w+:)\/\/)?(?:(\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?(\??[^#]+)?(#?.*$)/.exec(fixUrl), function(val) {
				return val || "";
			});
		return {
			href: info[0],
			origin: info[1] + info[5],
			protocol: info[2],
			username: info[3],
			password: info[4],
			host: info[5],
			hostname: info[5],
			port: info[6],
			pathname: info[7],
			search: info[8],
			hash: info[9]
		};
	};

	/**
	 * @name URL.getFullPath
	 * @description 将指定的url转化为绝对路径，basePath为参考路径，默认是当前页面
	 * @param  {string} url 要处理的url地址
	 * @param  {string} [basePath] 参考路径
	 * @return {string}  转化好的url路径
	 * @function
	 */
	URL.getFullPath = function(url, basePath) {
		if (typeof url !== "string" || !url) {
			return url;
		}

		//检查url是否为缩写形式
		url = url.replace(/^\/\//, window.location.protocol + "\/\/");
		if (/^https*:\/\//i.test(url)) {
			return url;
		}

		//basePath必须是完整路径
		basePath = URL.getFullPath(basePath || document.URL);

		//开始处理和转化
		var location = URL.getInfo(basePath);
		var port = location.port || "80",
			fromRoot = /^\//.test(url);
		if (!fromRoot) {
			url = location.href.replace(/\/[^\/]*$/g, "\/") + url;
		} else {
			url = location.protocol + "//" + location.host + (port == "80" ? "" : (":" + port)) + url;
		}
		return url;
	};

	return URL;
});
