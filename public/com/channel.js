//渠道管理相关模块
//2017-04-06 马超 增加模式识别和处理
//from=123|234,channel/123|234
//支持半角全角逗号、全角半角分号、全角顿号来作为分割符号
define([], function() {
	/*
	 * 校验是否符合渠道配置格式
	 * from=xxx|yyy,channel/zzz|kkk
	 */
	function getConfigInfo(txt) {
		var list = [];
		var map = {};
		var sameData = [];
		var errData = [];
		if (!txt) {
			return { list: [] }
		}
		String(txt).replace(/[，；;]/g, ",").split(",").forEach(function(conf) {
			var data, value, sp;
			if (!conf) {
				return;
			}
			if (conf.indexOf("=") > 0) {
				//如果是URL参数
				data = conf.split("=");
				sp = "=";
			} else if (conf.indexOf("/") > 0) {
				//如果是分析UA
				data = conf.split("/");
				sp = "/";
			}
			if (!data || !data[1]) {
				errData.push(conf);
				return;
			}
			data[1].replace(/、/g, "|").split("|").forEach(function(value) {
				var f = data[0] + sp + value;
				if (map[f]) {
					sameData.push(f);
				} else {
					map[f] = 1;
					list.push(f);
				}
			});
		});
		//构造结果
		var ret = {
			list: list
		};
		if (sameData.length) {
			ret.sameData = sameData;
		}
		if (errData.length) {
			ret.errData = errData;
		}
		return ret;
	}

	//合并配置信息
	//需要提供统一格式data数据
	/*
     {
	   key: "from=123",
	   url: "some/url/include/123/apk",
	   ext: "data in same config"
     }
	*/
	function concatInfo(dataArray){

	}

	var doc = "http://nfop.ms.netease.com/open/doc/pageMaker#h6E20-9053-6A21-5F0F-5316-914D-7F6E";
	return {
		doc: doc,
		docLink: "<a target='doc' href='" + doc + "'>配置技巧</a>",
		//检测渠道配置是否正确
		isVaildChannel: function(txt) {
			var data = getConfigInfo(txt);
			return data.list.length && !data.sameData && !data.errData
		},
		getInfo: function(txt) {
			return getConfigInfo(txt);
		}
	};
});
