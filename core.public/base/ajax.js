
/*
 * ajax包装，针对域名、并发、跨域、回调等做了一系列的优化
 * 2013-07-01 马超 从easyCore中剥离出来
 * 
 * 往jquery上扩展两个入口 get2/post2
 */
(function(){
/*
 * 一级域名设置
 */
var baseDomain = "163.com",
/*
 * 基本域名校验规则
 * baseReg = new RegExp("\\."+ baseDomain.replace(/\./g, "\\.")+"$"),
 */
baseReg = /\.163\.com$/i,
/*
 * 创建跨域代理iframe
 * 需要在相应的域名根目录下放置 agent.htm（如 http://caipiao.163.com/agent.htm）
 */
altDomain = function( domain ){
	var d = (domain+"").toLowerCase(), i = d.indexOf("http");
	return i<0 ? baseReg.test(d) ? d : "" : i ? "" : d.replace(/^https?:\/\//,"").replace(/\/.+$/,"");
},
agentCache = {},
callbackCache = {},
createAgent = function( domain, callback ){
	var targetDomain = altDomain( domain ),
		currentHost = window.location.host +"",
		agent = agentCache[targetDomain],
		url = domain.replace(/\/$/g, "")+"/agent/ajaxAgentV2.htm",
		fireCallback = function( jq ){
			var cache = callbackCache[ targetDomain ] || [];
			$.each(cache, function(i, fn){
				fn( jq );
			});
			callbackCache[ targetDomain ] = null;
		};
	if( url.indexOf("http") < 0 ){
		url = "http://"+url;
	}
	if( !targetDomain || targetDomain == currentHost ){ //如果没有指定特殊的域名或是当前域名，则直接返回当前页面的jQuery
		fireCallback( $ );
		callback( $ );
		return;
	}
	//如果有缓存的agent，则检查是否可用
	if( agent ){
		try{
			agent.__test = +new Date();
		}catch(e){
			agentCache[ targetDomain ] = agent = null;
		}
	}
	//如果缓存的agent尚且可用，则直接返回
	if( agent ){
		fireCallback( agent );
		callback( agent );
		return;
	}
	//否则就创建一个全新的agent
	//检查是否已经创建中了，已经有程序在创建了，就进入缓存等待处理
	if( callbackCache[ targetDomain ] ){
		callbackCache[ targetDomain ].push( callback );
		return;
	}
	//如果页面尚未准备好，则等待
	if( !document.body ){
		window.setTimeout(function(){ createAgent(domain, callback) }, 1);
		return;
	}
	//否则进入创建agent的流程
	callbackCache[ targetDomain ] = callbackCache[ targetDomain ] || [];
	callbackCache[ targetDomain ].push( callback );

	//插入iframe
	var iframe = document.createElement("iframe");
	iframe.src = "about:blank";
	iframe.width = 0;
	iframe.height = 0;
	iframe.setAttribute("frameborder",0);
	iframe.scrolling = "no";
	document.body.appendChild(iframe);

	//使用同一个iframe不断更换domain来设置
	function tryOnce( domain, errCallback ){
		//绑定load事件
		$(iframe).bind("load", function(){
			try{
				var jq = iframe.contentWindow.jQuery;
				jq.__test = +new Date();
				fireCallback( jq );
			}catch(e){
				errCallback && errCallback();
			}
		});
		iframe.src = url+"?domain="+ domain +"&v="+ +new Date();
	}
	//根据domain情况，来逐个判断如何通讯
	//case 1 当前domain长度小于agent域名，则必须agent设置同样的domain
	if( targetDomain.indexOf(document.domain) > 0 ){
		//如果当前页面没有显示声明domain，则无法和iframe通讯
		tryOnce(document.domain = document.domain);
	//case 2 如果当前domain和agent是同域，则在IE下agent不需要设置domain，在大多数浏览器中需要设置同样的domain
	//所以启动试错程序，并且需要处理在试错过程中，域名再次被缩短的情况
	}else{
		tryOnce(document.domain, function(){
			//出现错误，则重新尝试
			//如果域名发生变化，则
			if( targetDomain.indexOf(document.domain) > 0 ){
				tryOnce(document.domain);
			}else{
				tryOnce("");
			}
		});
	}
},
//格式化json数据（非严格）
parseJSON = function(data){
	data = data.replace(/("|')\\?\/Date\((-?[0-9+]+)\)\\?\/\1/g, "new Date($2)");
	return (new Function("return " + data))();
},
/*
 * Core.get / Core.post 支持函数，私有
  * key 的第一个字符如果是以下字符，则启动对应的并发处理策略
 * 		@	后到优先策略：取消前一个未完成的ajax请求，然后发送新的ajax请求
 * 		！  节约型策略：即共享类型，由同类型的第一个请求发送ajax，（在第一个ajax返回之前的）后续的同类型共享ajax返回结果
 * 		*	无缓存策略：不给url自动添加cache参数
 * 		[其他]	先到优先策略：同类型的ajax在第一个没有完成之前，取消后续的请求
 * 2012-06-12 马超 增加跨域ajax请求的处理
 * 2012-09-20 马超 完善ajax包装
 * 2014-04-02 马超 增加节约型并发处理
 */
httpCache={},
ajax = function(type, url, data, callback, key){
	var host = window.location.host+"", domain = altDomain(url) || host, protocol = "http:", port = "80", fn;
	//分析url的访问协议
	if( /^(https?:)/i.test( url ) ){//如果指明了访问协议，则检查协议和端口号
		protocol = RegExp.$1.toLowerCase();
		if( /:(\d+)/i.test( url ) )
			port = RegExp.$1 || "80";
	}else{ //否则url是相对路径，则协议和端口都OK
		protocol = window.location.protocol;
		port = window.location.port || "80";
	}
	//如果访问协议和端口号不一致，则直接忽略此次ajax请求
	if( window.location.protocol != protocol || (window.location.port||"80") != port ){
		fn = $.isFunction(callback) ? callback : $.isFunction(data) ? data : $.noop;
		fn.call(window.Core||window, 2, "", "protocols or ports not match");
		return;
	}
	//同在一级主域下才可以跨域处理，否则一律转化为相对路径访问
	//只有在http协议下才启用跨域代理
	if( baseReg.test( domain ) && baseReg.test( host ) && domain.indexOf(document.domain) >=0 && protocol == "http:" ){
		createAgent(domain, function( jq ){
			ajaxCore(jq, type, url, data, callback, key);
		});
	}else{ //转化为相对路径
		ajaxCore(jQuery, type, url.replace(/https?:\/\/[^\/]+/, ""), data, callback, key);
	}
},
callbackCache={},
ajaxCore = function(jq, type, url, data, callback, key){
	var fn = $.isFunction(callback) ? callback : $.noop, URL = url, xhr, state, lib = window.Core||window, noCache = false, cachePara = (URL.indexOf("?")+1 ? "&" : "?") +"cache="+ (+new Date()), typeInfo, retType;
	if( $.isFunction(data) ){
		fn = data;
		data = null;
		key = callback;
	}
	if( key && key.indexOf("*") == 0 ){ //无缓存
		noCache = true;
		key = key.substr(1);
	}
	if( key ){
		//2014-04-02 马超新增 节约型并发处理，将回调进行缓存，等待同类型的ajax返回处理
		if( key.indexOf("!") === 0 ){
			//截取key
			key = key.substr(1);
			//有缓存对象了，则表示已经同类型的ajax请求已经在处理了
			if( callbackCache[key] ){
				callbackCache[key].push( fn );
				return;
			}
			//没有同类型的ajax请求，则创建一个缓存供后续的请求进入
			//并且需要重置回调函数
			callbackCache[key] = [];
			callback = fn;
			fn = function(){
				var arg = arguments, owner = this;
				callback.apply(owner, arg);
				$.each(callbackCache[key], function(j,cb){
					cb.apply(owner, arg);
				});
				delete callbackCache[key];
			};
		}
		xhr = httpCache[key];
		if( xhr ){
			//普通并发处理，直接取消当前处理
			if( key.indexOf("@") !== 0 ){
				return;
			}
			//否则，取消上一个未完成的ajax请求
			state = xhr.readyState;
			if( state > 0 && state < 5 ){
				//IE9' abort bug, see more:
				//http://www.enkeladress.com/article.php/internetexplorer9jscripterror
				try{
					xhr.aborted = true;
				}catch(e){} //防止IE6报错
				xhr.abort();
			}
		}
	}
	//2013-07-02 增加 GET.JSON、POST.JSON 类型
	typeInfo = type.split(".");
	retType = typeInfo.length > 1 ? typeInfo[1] : "";
	//发送
	xhr = jq.ajax({
		url: URL + (noCache ? "" : cachePara),
		type: typeInfo[0],
		data: data,
		success : function( txt, status, res ){
			//主动删除缓存
			delete httpCache[key];
			//如果请求被取消，则不进行任何处理
			if( res.aborted )
				return;
			//强制转化为文本，因为部分浏览器的返回会被jquery自动转化为json数据
			txt = res.responseText;
			//无法连接服务器（返回空数据）被认为是错误，但chorme却认为是正确返回
			if( txt == undefined || txt == null || txt == "" || txt.indexOf("<!DOCTYPE")>=0 ){
				fn.call(lib, 1, txt, status);
				return;
			}
			//检查格式是否需要转化
			if( retType == "JSON" ){
				try{
					txt = parseJSON( txt );
				}catch(e){
					//格式化数据出错
					fn.call(lib, 3, res.responseText, status);
					return;
				}
			}
			//通知回调
			fn.call(lib, 0, txt, status);
		},
		error : function( res, status ){
			//主动删除缓存
			delete httpCache[key];
			//没有文件等错误，会返回两次error事件，一次状态是error，一次状态是null
			if( !status || status == "error" ){
				//通知回调
				fn.call(lib, 1, "", status);
				return;
			}
			if( res.aborted )
				return;
			//通知回调
			fn.call(lib, 1, res.responseText, status);
		}
	});
	//存储
	key && (httpCache[key] = xhr);
};

/*
 * 绑定到jquery上
 */
$.extend({
	get2 : function( url, data, callback, key ){ ajax("GET", url, data, callback, key); return this; },
	post2 : function( url, data, callback, key ){ ajax("POST", url, data, callback, key); return this; },
	getJSON2 : function( url, data, callback, key ){ ajax("GET.JSON", url, data, callback, key); return this; },
	postJSON2 : function( url, data, callback, key ){ ajax("POST.JSON", url, data, callback, key); return this; }
});
})();