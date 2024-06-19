/*
 * 自加载模块控制组件
 * 2013-07-01 马超 增加
 *
 * target 	[可选]待绑定的对象，如果省略，则绑定当前调用者this
 * ops		[必选]待绑定的配置，格式 {"method1 method2": {css:"",js:"",check:function(){}}} 其中css和js配置也可以是数组
 * cdnURL	[可选]加载资源的cdn路径，如果提供，则自动补足相关url地址
 */
$.autoAPI = function( target, ops, cdnURL ){
	//如果不提供target，则默认使用this
	if( typeof ops != "object" ){
		cdnURL = ops;
		ops = target;
		target = 0;
	}
	var lib = target || this;
	//遍历配置进行扩展
	$.each(ops||{}, function(interfaces, source){
		//必须配置js，否则不处理
		source && source.js && $.each(interfaces.split(" "), function(i, method){
			//当已有函数的时候，则不进行占位处理
			if( lib[method] )return;
			var contextList = [],
				paras = [];
			var fn = lib[method] = function(){
				var arg = arguments;
				//将上下文保留, 防止上下文在闭包的情况下出现问题
				contextList.push(this);
				//将调用参数保留
				paras.push(arg);
				//已经在加载中了，则不再处理
				if( fn.autoLoaded == 1 ) return;
				fn.autoLoaded = 1;
				//最长1秒后解锁
				var timer = window.setTimeout(function(){ fn.autoLoaded = 0; }, 1000);
				//开始加载资源
				source.css && $.loadCss(source.css, cdnURL);
				//防止重复死循环加载，加标志位进行处理
				$.loadJS(source.js, function(){
					timer && window.clearTimeout(timer);
					if( lib[method] === fn ){ //接口木有被覆盖，则放弃处理
						window.console && window.console.log("方法"+ method +"在"+ source.js +"中未被定义！自动加载模块处理失败！");
						lib[method] = $.noop;
						return;
					}
					for(var n=paras.length, i=0; i<n; i++)
						lib[method].apply(contextList[i], paras[i]);
					paras.length = 0;
				}, cdnURL);
			};
		});
	});
	return this;
};

/*
 * easyBase核心模块：load
 * 扩展两个jquery工具入口
 * $.loadJS / $.loadCss
 */
(function(){
var resCache = {},
load = function(type, url, chk, fn, charset){
	var key = url.toLowerCase().replace(/#.*$/,"").replace("/\?.*$/", ""), tag, head, isFunc = $.isFunction, cache = resCache[key]||[], userChk = (chk || $.noop)(url), GC = window.CollectGarbage || $.noop;
	if( userChk===true ){ //如果检查函数认为已经加载，则立即返回
		isFunc(fn) && fn();
		return;
	}
	resCache[key] = cache;
	if( !cache || !cache.loaded || userChk == false ){ //尚未加载
		isFunc(fn) && cache.push(fn);
		cache.loaded = 1;
		tag = document.createElement(type), head = document.getElementsByTagName("head")[0] || document.documentElement;
		//添加缓存控制参数
		url = url + (url.indexOf("?") >=0 ? "&" : "?") + (window.Core ? Core.version : +new Date());
		if( type == "link" ){ // load css
			tag.rel = "stylesheet";
			tag.type = "text/css";
			tag.media = "screen";
			tag.charset = charset || "UTF-8";
			tag.href = url;
		}else{ //load js
			tag.type = "text/javascript";
			tag.charset = charset || "UTF-8";
			var done = false;
			tag.onload = tag.onreadystatechange = function(){
				if ( !done && (!this.readyState || {loaded:1,complete:1}[this.readyState]) ) {
					//重置状态
					done = true;
					tag.onload = tag.onreadystatechange = null;
					this.parentNode.removeChild(this);
					//处理缓存
					var cache = resCache[key], n = cache.length, i=0;
					//打标记
					cache.loaded = 2;
					//调用回调
					for(; i<n; i++)
					  	isFunc(cache[i]) && cache[i]();
					//立即重置缓存
					cache.length = 0;
					//释放引用，内存回收
					cache = head = tag = null;
					GC();
				}
			};
			tag.src = url;
		}
		head.appendChild( tag, head.lastChild );
	}else if( cache.loaded == 2 ){ //已经加载过
		isFunc(fn) && fn();
		cache = null;
		GC();
	}else{ //加载中
		isFunc(fn) && cache.push(fn);
		cache = null;
		GC();
	}
},
fixURL = function(url, cdn){
	if( !cdn )return url;
	return /^http/i.test(url) ? url : (cdn.replace(/\/*$/, "") + (url.indexOf("/") == 0 ? "" : "/") + url);
};
//扩展jquery
$.extend({
	/*
	 * 加载javascript
	 */
	loadJS : function(url, chkFn, callback, charset, cdnURL){
		//如果仅仅提供一个函数，则当作回调处理
		if( !$.isFunction(callback) ){
			cdnURL = charset;
			charset = callback;
			callback = chkFn;
			chkFn = null;
		}
		//如果一个函数都没有提供
		if( !$.isFunction(callback) ){
			cdnURL = charset;
			charset = callback;
			callback = null;
		}
		//如果charset是url，则当作cdnURL
		if( /^http/i.test(charset) ){
			cdnURL = charset;
			charset = "";
		}
		if( $.isArray(url) ){
			//如果是数组，则并发加载
			//2013-05-03 马超 修改为串行加载
			var N = url.length,
				loadNo = function( index ){
					if( index < N ){ // 尚未加载完毕，继续加载
						load("script", fixURL(url[index], cdnURL), chkFn, function(){ loadNo(index+1) }, charset);
					}else{ //加载完毕
						$.isFunction(callback) && callback();
					}
				};
			//开始加载
			loadNo( 0 );
		}else //单文件加载
			load("script", fixURL(url, cdnURL), chkFn, callback, charset);
		//返回
		return this;
	},
	/*
	 * 加载样式表
	 */
	loadCss : function(url, cdnURL){
		if( $.isArray(url) ){
			var N = url.length, i=0;
			for(; i<N; i++)
				load("link", fixURL(url[i], cdnURL));
		}else
			load("link", fixURL(url, cdnURL));
		return this;
	}
});
})();