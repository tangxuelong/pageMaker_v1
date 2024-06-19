/*
 * jQuery简单扩展[小工具集]
 */
$.extend({
	//从URL中捕获参数
	getUrlPara: function(paraName) {
		var str = window.location.search.replace(/^\?/g, ""),
			dstr = str;
		//先解码，解码失败则替换&链接符号，保证内容能够解析
		//解码失败的情况极其少见，以后确认算法后可以优化代码
		try {
			dstr = decodeURI(str);
		} catch (e) {
			dstr = str.replace(/"%26"/g, "&");
		}
		return $.getParaFromString(dstr, paraName);
	},
	//从HASH中捕获参数
	getHashPara: function(paraName) {
		//FireFox中location.hash会默认进行解码,所以只能通过location.href来获取hash
		var match = window.location.href.match(/#(.*)$/);

		return $.getParaFromString(match ? match[1] : '', paraName);
	},
	//综合读取
	getPara: function(paraName) {
		return $.getUrlPara(paraName) || $.getHashPara(paraName)
	},
	//从字符串中捕获参数
	getParaFromString: function(str, paraName) {
		// var reg = new RegExp("(?:^|&)" + $.safeRegStr(paraName) + "=([^&$]*)", "gi");
		// return reg.test(str) ? decodeURIComponent(RegExp.$1) : "";
		//if($.trim(str).length <= 0) return {};
		var ars = str.split('&'),
			obj = {};
		$.each(ars, function() {
			var ar = this.split('=');
			ar[0] && ar.length > 1 && (obj[ar[0]] = decodeURIComponent(ar[1]));
		});
		if (paraName === undefined) {
			return obj;
		} else {
			return obj[paraName] || '';
		}
	},
	//替换安全的html字符串
	safeHTML: function(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	},
	//替换安全的正则表达式字符串
	safeRegStr: function(str) {
		return String(str).replace(/([\\\(\)\{\}\[\]\^\$\+\-\*\?\|])/g, "\\$1");
	},
	//给指定url追加参数
	//2014-10-22 马超 增加对#信息的处理
	addUrlPara: function(href, para) {
		var url = (href + "").split('#'),
			sp = url[0].indexOf("?") + 1 ? "&" : "?";
		return url[0] + sp + para + (url.length > 1 ? "#" + url[1] : "");
	},
	//将指定url转化为绝对路径
	//2014-12-06 马超 从easyNav中迁移过来
	fillUrl: function(url) {
		if (typeof url !== "string" || url == "") return url;
		if (!/^http/i.test(url)) {
			var port = window.location.port || "80",
				fromRoot = /^\//.test(url);
			if (!fromRoot)
				url = document.URL.replace(/\/[^\/]*$/g, "\/") + url;
			else
				url = window.location.protocol + "//" + window.location.host + (port == "80" ? "" : (":" + port)) + url;
		}
		return url;
	},
	/*
	 * 格式化日期
	 */
	formatTime: function(timeNum, tmpl) {
		//转化为数字
		var num = /^\d+$/gi.test(timeNum + "") ? +timeNum : Date.parse(timeNum);
		//如果数据不能转化为日期，则直接返回不处理
		if (isNaN(num))
			return timeNum;
		//转化日期
		var D = new Date(num),
			zz = function(a) {
				return ("0" + a).slice(-2);
			},
			yyyy = D.getFullYear(),
			M = D.getMonth() + 1,
			MM = zz(M),
			d = D.getDate(),
			dd = zz(d),
			h = D.getHours(),
			hh = zz(h),
			m = D.getMinutes(),
			mm = zz(m),
			s = D.getSeconds(),
			ss = zz(s);
		return (tmpl || "yyyy-MM-dd hh:mm:ss")
			.replace(/yyyy/g, yyyy)
			.replace(/MM/g, MM).replace(/M/g, M)
			.replace(/dd/g, dd).replace(/d/g, d)
			.replace(/hh/g, hh).replace(/h/g, h)
			.replace(/mm/g, mm).replace(/m/g, m)
			.replace(/ss/g, ss).replace(/s/g, s);
	}
});

/*
 * jQuery原型扩展
 */
$.fn.extend({
	// disabled / enabled
	// 和setControlEffect有样式联动，目的为了解决Ie6不支持多class联合定义的bug
	disabled: function(css) {
		return this.each(function() {
			var fix = this.bindDownCssFix || "",
				dis = !css ? "disabled" + fix : css;
			$(this).attr("disabled", "disabled").addClass(dis)[0].disabled = true;
		});
	},
	enabled: function(css) {
		return this.each(function() {
			var fix = this.bindDownCssFix || "",
				dis = !css ? "disabled" + fix : css;
			$(this).removeClass(dis).removeAttr("disabled")[0].disabled = false;
		});
	}
});

/*
 * 扩展Number对象
 */
$.extend(Number.prototype,{
	// dot 保留几位小数
	// step 逢几进位，默认5（四舍五入）
	Round : function(dot, step){var a = Math.pow(10, dot || 0); return step == 0 ? Math.ceil( this*a )/a : Math.round( this*a + (5 - (step || 5))/10 )/a; },
	// 同上
	Cint : function(step){ return this.Round(0, step); }
});

/*
 * 扩展String对象
 */
$.extend(String.prototype,{
	//删除前后空格
	trim : function(){return this.replace(/^(?:\s|\xa0|\u3000)+|(?:\s|\xa0|\u3000)+$/g,"");},
	//计算字节占位长度
	byteLen : function(){return this.replace(/([^\x00-\xff])/g,"ma").length;},
	//按字节截取字符串
	// len      为要截取的字节数
	// holder   截取后的字符串后缀，比如"..."
	cutString : function( len, holder ){
		var reg = /([^\x00-\xff])/g, reg2 = /([^\x00-\xff]) /g;
		if( holder ){
			var hd = String(holder), hdLen = hd.length, str = this.replace(reg,"$1 ");
			len = len >= hdLen ? len-hdLen : 0;
			holder = str.length > len ? hd : "";
			return str.substr(0,len).replace(reg2,'$1')+holder;
		}
		//算法来源于百度开源前端库
		//https://github.com/BaiduFE/Tangram-more/blob/master/src/SubstrByByte/substrByByte.js
		return this.substr(0,len).replace(reg,'$1 ').substr(0,len).replace(reg2,'$1');
	}
});