/**
 * liveCheck实时校验组件
 */
(function(factory) {
	if (window.define && define.amd) {
		define(["jquery"], function($) {
			factory(window, $);
		});
	} else if (window.jQuery) {
		factory(window, window.jQuery);
	}
})(function(window, $) {
	/*
	 * 公共方法
	 */
	var getDelayFn = function(replaceReg, Fn) {
			var fn = function(e) {
				var me = this;
				window.setTimeout(function() {
					//创建新的正则表达式，过滤非法字符
					//一定是全局进行替换，就是用户没有提供也得设置全局替换
					var rreg = replaceReg,
						reg = new RegExp(rreg.source, ["g", rreg.ignoreCase ? "i" : "", rreg.multiline ? "m" : ""].join("")),
						v = me.value,
						v2 = v.replace(reg, "");
					if (v != v2)
						me.value = v2;
					//调用回调
					Fn.call(me, e);
				}, 10);
			};
			return fn;
		},
		getKeypressFn = function(replaceReg, Fn) {
			var fn = function(e) {
				var code = e.charCode || e.keyCode;
				if (code == 0 // Function key (Firefox only) 
					|| e.ctrlKey || e.altKey // Ctrl or Alt held down   如果返回false，则firefox下不会触发paste事件
					|| code < 32 // ASCII control character
					|| (code > 34 && code < 41) // home / end / dirction
					|| (e.charCode == 0 && code == 46)) // delete
					return true;
				//不是合法输入，则返回
				//使用search方法不会影响全局搜索模式的lastIndex属性
				if (String.fromCharCode(code).search(replaceReg) >= 0)
					return false;
				//延迟检查内容，放过用户输入
				var me = this;
				window.setTimeout(function() {
					Fn.call(me, e);
				}, 10);
			};
			return fn;
		},
		getNumberEvent = function(Fn) {
			var fn = function() {
				var v = $.trim(this.value),
					n = (v ? parseInt(v, 10)+"" : "0").replace(/\D/g, "") || "0";
				//如果值需要调整，则调整
				if (n != v && v) {
					this.value = n;
				}
				Fn && Fn.apply(this, arguments);
			};
			return fn;
		};
	/*
	 * 扩展jQuery接口
	 */
	$.fn.extend({
		/*
		 * 禁用输入法
		 */
		disableIME: function() {
			return this.css("ime-mode", "disabled");
		},
		/***************************************************
		 * 绑定正则表达式检测
		 * 为了节约代码，此处仅仅包含常用且代码量很少的集中情况
		 ***************************************************/
		bindAutoCheck: function(type) {
			switch (type) {
				case 0: //纯数字，不含小数，不检查首字母是否为0
					this.bindLiveCheck(/\D/g).disableIME();
					break;
				case 1: //纯数字，含一位小数
				case 2: //纯数字，含两位小数
					this.bindLiveCheck(/[^\d\.]/g, function(e) {
						var v = this.value,
							w = $.trim(v).replace(/^0+([1-9])/, "$1").replace(/^\./, "0.").replace([/\.(\d?).*$/, /\.(\d{0,2}).*$/][type - 1], ".$1");
						if (v != w)
							this.value = w;
					}).disableIME();
					break;
				case 3: //英文数字下划线
					this.bindLiveCheck(/\W/g).disableIME();
					break;
				case 4: //电子邮件
					this.bindLiveCheck(/[^A-Z0-9a-z.@_%+-]/g).disableIME()
						.blur(function(e) {
							/^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/.test(this.value) || $(this).flash(function() {
								this.value = ""
							});
						});
					break;
				case 5: //手机号码
					this.bindLiveCheck(/\D/g).disableIME()
						.blur(function(isOK, e) {
							/^[1][(?:3|8)][0-9]{9}/.test(this.value) || $(this).flash(function() {
								this.value = ""
							});
						});
					break;
			}
			return this;
		},
		/**************************************
		 * 输入框实时验证方法
		 * 网易电子商务部前端组  马超、姜运宝
		 * 参数
		 * replaceReg	必选，正则对象，非法字符集，用于实时替换
		 * fn			可选，实时处理方法
		 ***************************************/
		bindLiveCheck: function(replaceReg, fn) {
			var Fn = fn || $.noop,
				delayFn = getDelayFn(replaceReg, Fn);
			return this.bind({
				keypress: getKeypressFn(replaceReg, Fn),
				keyup: delayFn,
				drop: delayFn,
				paste: delayFn,
				input: delayFn
			});
		},
		//父元素批量代理监听
		bindLiveCheck2: function(selector, replaceReg, fn) {
			var Fn = fn || $.noop,
				delayFn = getDelayFn(replaceReg, Fn);
			//事件代理
			return this.delegate(selector, "keypress", getKeypressFn(replaceReg, Fn))
				.delegate(selector, "keyup", delayFn)
				.delegate(selector, "drop", delayFn)
				.delegate(selector, "paste", delayFn);
		},
		//仅仅可以输入有意义的数字(大于0且不以0开头)
		bindNumberLiveCheck: function(fn) {
			this.bindLiveCheck(/\D/g, getNumberEvent(fn)).disableIME();
			return this;
		},
		//仅仅可以输入有意义的数字(大于0且不以0开头)
		bindNumberLiveCheck2: function(selector, fn) {
			this.bindLiveCheck2(selector, /\D/g, getNumberEvent(fn));
			this.find(selector).disableIME();
			return this;
		}
	});
});
