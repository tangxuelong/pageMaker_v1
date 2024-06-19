/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 */
function Swipe(g,h){"use strict";var j=function(){};var k=function(a){setTimeout(a||j,0)};var l={addEventListener:!!window.addEventListener,touch:('ontouchstart'in window)||window.DocumentTouch&&document instanceof DocumentTouch,transitions:(function(a){var b=['transitionProperty','WebkitTransition','MozTransition','OTransition','msTransition'];for(var i in b)if(a.style[b[i]]!==undefined)return true;return false})(document.createElement('swipe'))};if(!g)return;var m=g.children[0];var n,slidePos,width,length;h=h||{};var o=parseInt(h.startSlide,10)||0;var p=h.speed||300;h.continuous=h.continuous!==undefined?h.continuous:true;function setup(){n=m.children;length=n.length;if(n.length<2)h.continuous=false;if(l.transitions&&h.continuous&&n.length<3){m.appendChild(n[0].cloneNode(true));m.appendChild(m.children[1].cloneNode(true));n=m.children}slidePos=new Array(n.length);width=g.getBoundingClientRect().width||g.offsetWidth;m.style.width=(n.length*width)+'px';var a=n.length;while(a--){var b=n[a];b.style.width=width+'px';b.setAttribute('data-index',a);if(l.transitions){b.style.left=(a*-width)+'px';move(a,o>a?-width:(o<a?width:0),0)}}if(h.continuous&&l.transitions){move(circle(o-1),-width,0);move(circle(o+1),width,0)}if(!l.transitions)m.style.left=(o*-width)+'px';g.style.visibility='visible'}function prev(){if(h.continuous)slide(o-1);else if(o)slide(o-1)}function next(){if(h.continuous)slide(o+1);else if(o<n.length-1)slide(o+1)}function circle(a){return(n.length+(a%n.length))%n.length}function slide(a,b){if(o==a)return;if(l.transitions){var c=Math.abs(o-a)/(o-a);if(h.continuous){var d=c;c=-slidePos[circle(a)]/width;if(c!==d)a=-c*n.length+a}var e=Math.abs(o-a)-1;while(e--)move(circle((a>o?a:o)-e-1),width*c,0);a=circle(a);move(o,width*c,b||p);move(a,0,b||p);if(h.continuous)move(circle(a-c),-(width*c),0)}else{a=circle(a);animate(o*-width,a*-width,b||p)}o=a;k(h.callback&&h.callback(o,n[o]))}function move(a,b,c){translate(a,b,c);slidePos[a]=b}function translate(a,b,c){var d=n[a];var e=d&&d.style;if(!e)return;e.webkitTransitionDuration=e.MozTransitionDuration=e.msTransitionDuration=e.OTransitionDuration=e.transitionDuration=c+'ms';e.webkitTransform='translate('+b+'px,0)'+'translateZ(0)';e.msTransform=e.MozTransform=e.OTransform='translateX('+b+'px)'}function animate(b,c,d){if(!d){m.style.left=c+'px';return}var e=+new Date();var f=setInterval(function(){var a=+new Date()-e;if(a>d){m.style.left=c+'px';if(q)begin();h.transitionEnd&&h.transitionEnd.call(event,o,n[o]);clearInterval(f);return}m.style.left=(((c-b)*(Math.floor((a/d)*100)/100))+b)+'px'},4)}var q=h.auto||0;var r;function begin(){r=setTimeout(next,q)}function stop(){q=0;clearTimeout(r)}var s={};var t={};var u;var v={handleEvent:function(a){switch(a.type){case'touchstart':this.start(a);break;case'touchmove':this.move(a);break;case'touchend':k(this.end(a));break;case'webkitTransitionEnd':case'msTransitionEnd':case'oTransitionEnd':case'otransitionend':case'transitionend':k(this.transitionEnd(a));break;case'resize':k(setup);break}if(h.stopPropagation)a.stopPropagation()},start:function(a){var b=a.touches[0];s={x:b.pageX,y:b.pageY,time:+new Date()};u=undefined;t={};m.addEventListener('touchmove',this,false);m.addEventListener('touchend',this,false)},move:function(a){if(a.touches.length>1||a.scale&&a.scale!==1)return;if(h.disableScroll)a.preventDefault();var b=a.touches[0];t={x:b.pageX-s.x,y:b.pageY-s.y};if(typeof u=='undefined'){u=!!(u||Math.abs(t.x)<Math.abs(t.y))}if(!u){a.preventDefault();stop();if(h.continuous){translate(circle(o-1),t.x+slidePos[circle(o-1)],0);translate(o,t.x+slidePos[o],0);translate(circle(o+1),t.x+slidePos[circle(o+1)],0)}else{t.x=t.x/((!o&&t.x>0||o==n.length-1&&t.x<0)?(Math.abs(t.x)/width+1):1);translate(o-1,t.x+slidePos[o-1],0);translate(o,t.x+slidePos[o],0);translate(o+1,t.x+slidePos[o+1],0)}}},end:function(a){var b=+new Date()-s.time;var c=Number(b)<250&&Math.abs(t.x)>20||Math.abs(t.x)>width/2;var d=!o&&t.x>0||o==n.length-1&&t.x<0;if(h.continuous)d=false;var e=t.x<0;if(!u){if(c&&!d){if(e){if(h.continuous){move(circle(o-1),-width,0);move(circle(o+2),width,0)}else{move(o-1,-width,0)}move(o,slidePos[o]-width,p);move(circle(o+1),slidePos[circle(o+1)]-width,p);o=circle(o+1)}else{if(h.continuous){move(circle(o+1),width,0);move(circle(o-2),-width,0)}else{move(o+1,width,0)}move(o,slidePos[o]+width,p);move(circle(o-1),slidePos[circle(o-1)]+width,p);o=circle(o-1)}h.callback&&h.callback(o,n[o])}else{if(h.continuous){move(circle(o-1),-width,p);move(o,0,p);move(circle(o+1),width,p)}else{move(o-1,-width,p);move(o,0,p);move(o+1,width,p)}}}m.removeEventListener('touchmove',v,false);m.removeEventListener('touchend',v,false)},transitionEnd:function(a){if(parseInt(a.target.getAttribute('data-index'),10)==o){if(q)begin();h.transitionEnd&&h.transitionEnd.call(a,o,n[o])}}};setup();if(q)begin();if(l.addEventListener){if(l.touch)m.addEventListener('touchstart',v,false);if(l.transitions){m.addEventListener('webkitTransitionEnd',v,false);m.addEventListener('msTransitionEnd',v,false);m.addEventListener('oTransitionEnd',v,false);m.addEventListener('otransitionend',v,false);m.addEventListener('transitionend',v,false)}window.addEventListener('resize',v,false)}else{window.onresize=function(){setup()}}return{setup:function(){setup()},slide:function(a,b){stop();slide(a,b)},prev:function(){stop();prev()},next:function(){stop();next()},stop:function(){stop()},getPos:function(){return o},getNumSlides:function(){return length},kill:function(){stop();m.style.width='';m.style.left='';var a=n.length;while(a--){var b=n[a];b.style.width='';b.style.left='';if(l.transitions)translate(a,0,0)}if(l.addEventListener){m.removeEventListener('touchstart',v,false);m.removeEventListener('webkitTransitionEnd',v,false);m.removeEventListener('msTransitionEnd',v,false);m.removeEventListener('oTransitionEnd',v,false);m.removeEventListener('otransitionend',v,false);m.removeEventListener('transitionend',v,false);window.removeEventListener('resize',v,false)}else{window.onresize=null}}}}if(window.jQuery||window.Zepto){(function($){$.fn.Swipe=function(a){return this.each(function(){$(this).data('Swipe',new Swipe($(this)[0],a))})}})(window.jQuery||window.Zepto)};

/**
 * 初始化
 */
(function($) {
	$(document).ready(function() {
		$(".swipe").each(function() {
			var wrap = $(this), dotActive = "active",
				itemActive = "onshow",
				dots = $(this).next(".swipeCtrl").find("i"),
				text = $(this).next(".swipeCtrl").find("b"),
				itemNum = $(this).find(".swipeItem").length,
				auto = +($(this).attr("rel") || 0),
				lastElem;
			var showHolderImage = function(index) {
				// 由于swipe定位的计算判断，会导致所有的slide一起被holderImage处理
				// 这里暂时就先不处理了，后续根据优化需求再改造 holderImage 并在此处增加控制逻辑
			};
			var swipe = new Swipe(this, {
				continuous : true,
				auto : auto * 1000,
				callback : function(index, elem){
					// 如果轮播元素只有两个，则组件回调有bug，index返回的有误
					index = index % itemNum;
					dots.removeClass(dotActive).eq(index).addClass(dotActive);
					// 处理图片占位
					showHolderImage(index);
					// 数字序列
					text.text(++index +"/"+ itemNum);
				},
				transitionEnd: function(index, elem){
					lastElem && lastElem.removeClass(itemActive);
					lastElem = $(elem).addClass(itemActive);
				}
			});
			dots.eq(0).addClass(dotActive);
			window.setTimeout(function(){
				lastElem = wrap.find(".swipeItem").eq(0).addClass(itemActive);
				showHolderImage(0);
			},0);
			text.text("1/"+ itemNum);
			if("ontouchstart" in document.body){
				return;
			}
			//兼容PC访问的优化处理
			dots.css("cursor","pointer").click(function(){
				swipe.slide(+$(this).attr("rel"));
			});
		});
		// 通知更新holderImage缓存
		window.updateHolderImage && window.updateHolderImage();
	});
})(window.Zepto || window.jQuery);
