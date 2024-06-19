//POSTMESSAGE
(function(a){window.PM=window.JSON?a(JSON):{send:function(){},bind:function(){}}})(function(h){var j="postMessage"in window?{send:function(a,b,c){a.postMessage(h.stringify(b),c)},bind:function(a){var b=function(e){return a.call(this,h.parse(e.data||""))};if(window.addEventListener){window.addEventListener("message",b,false)}else{window.attachEvent("onmessage",b)}}}:(function(){var d=[],prefix="PM|",timeFrq=20;var f=[];var g=function(){if(f.timer){window.clearTimeout(f.timer);delete f.timer}if(!f.length){return}var a=+new Date();var b=f.lastCheck||0;if(a<b+1.5*timeFrq){f.timer=window.setTimeout(g,b+1.5*timeFrq-a);return}f.lastCheck=a;var c=f.shift();c.win.name=c.msg;g()};window.setInterval(function(){var a=unescape(window.name||"");if(a.indexOf(prefix)!==0){return}window.name="";var b;try{b=h.parse(a.slice(prefix.length))}catch(e){return}if(!b||!b.data||!b.origin){return}if(b.origin!=="*"&&location.href.toLowerCase().indexOf(b.origin.toLowerCase())!==0){return}var n=d.length,i=0;for(;i<n;i++){try{d[i].call(window,b.data)}catch(e){}}},timeFrq);return{send:function(a,b,c){f.push({win:a,msg:escape(prefix+h.stringify({data:b,origin:c}))});g()},bind:function(a){d.push(a)}}})();window.PM={send:function(a,b,c,d){if(!a||!b||c===undefined){return}if(typeof a==="string"){if(!(a=document.getElementById(a))){return}}try{if(a.self!==a){a=a.contentWindow}}catch(e){}j.send(a,{type:b,data:c},d||"*")},bind:function(b,c){if(!b||Object.prototype.toString.call(c)!=="[object Function]"){return}j.bind(function(a){if(a.type!==b){return}c.call(this,a.data)})}};return window.PM});
//BASE MESSAGE AGENT
var pwin=window.parent;
if(window!==pwin){
	//开放给PM的代理函数
	window.getPageHeight = function() {
		var body = document.body, ele = document.documentElement;
		return Math.max(body.scrollHeight, body.offsetHeight, ele.scrollHeight, ele.offsetHeight);
	};
	window.getPageHeight.forPM = true;
	//响应查询请求
	PM.bind("pageMaker", function(data){
		if(!data || !data.method){
			return;
		}
		var method = data.method +"", ret;
		if(method&&window[method]&&window[method].forPM){
			try{ret=window[method](data.para)}catch(e){ret=undefined}
			PM.send(pwin, "pageMaker", {
				method: method,
				result: ret
			});
		}
	});
	//增加高度变化通知
	var pageH = 0;
	window.setInterval(function(){
		if(!document.body)return;
		var pH = getPageHeight();
		if(pH !== pageH){
			pageH = pH;
			PM.send(pwin, "pageMaker", {
				method: "getPageHeight",
				result: pH
			});
		}
	}, 500);
}