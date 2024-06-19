/**
 * 前端模块与组件开发基础框架
 *
 * author : MaChao
 *
 * log:
 *      2014-04-30 马超 创建第一版
 *      2014-05-04 马超 增加基础类: Message/Event/MsgEvent
 *      2014-05-08 马超 接受梁枫、曹建雄意见，增加nameSpace入库管理
 *      2014-07-04 马超 增加事件缓冲机制，修复部分错误
 *      2014-07-08 马超 编写测试用例，并修复部分错误
 *      2014-07-14 马超 增加事件错误抛出，以方便调试
 *      2014-07-25 马超 完成所有测试用例，功能基本定型
 *      2014-09-20 马超 由于存在不必要的重复性，删除MsgEvent对象
 */
(function(factory) {
	if (window.define && define.amd) {
		define(["jquery"], factory);
	} else {
		factory(window.jQuery);
	}
})(function($) {
	/**
	 * 基础Class
	 */
	(function(window) {
		var Class = window.Class = function(){};

		function noop() {}

		//增加调试函数
		Class.prototype.log = Class.prototype.warn = noop;
		if (window.console) {
			Class.prototype.log = function() {
				console.log && console.log.apply(console, arguments);
			};
			Class.prototype.warn = function() {
				console.warn && console.warn.apply(console, arguments);
			};
		}
		var warn = Class.prototype.warn;

		//增加callSuper占位，防止在非覆盖函数中调用callSuper，并给出警告
		Class.prototype.callSuper = function() {
			warn("父类没有同名方法，不能调用callSuper！");
		};

		//类继承（单线继承）
		Class.extend = function extend(nameSpace, props) {
			var prototype, checkResult, superPrototype = this.prototype;
			//可选参数
			if (!props) {
				props = nameSpace;
				nameSpace = "";
			}
			if (typeof props !== "object" || !props.hasOwnProperty) {
				warn("继承类的原型数据错误！");
				return;
			}
			//创建入库函数
			var regClass2Lib = checkNameSpace(nameSpace);
			if (!regClass2Lib)
				return;

			//创建子类原型
			prototype = new this();
			for (var name in props) {
				if (props.hasOwnProperty(name)) {
					if (typeof props[name] == "function" && typeof superPrototype[name] == "function") {
						//如果父类函数没有被包装，则存在潜在的 callSuper 死循环
						//特临时增加一个包装以解决可能的死循环问题，并给出警告
						var superFn = superPrototype[name];
						if (!superFn.__isAgent) {
							superFn = getAgentFn(getWarnFn(name + "方法被子类覆盖，但是父类没有同名函数，不能调用callSuper!"), superPrototype[name]);
						}
						prototype[name] = getAgentFn(superFn, props[name]);
					} else {
						prototype[name] = props[name];
					}
				}
			}

			function subClass() {}
			subClass.prototype = prototype;
			subClass.prototype.constructor = subClass;
			//保留父类的引用，供查询继承关系使用
			//subClass.__super = this;

			subClass.extend = extend;
			subClass.create = create;

			//引用到Class命名空间上
			regClass2Lib(subClass);

			//同时返回子类
			return subClass;
		};

		function create() {
			var instance = new this();
			if (instance.init) {
				instance.init.apply(instance, arguments);
			}
			return instance;
		}

		function checkNameSpace(nameSpace) {
			//没有命名空间，则不入库
			if (!nameSpace) {
				return noop;
			}
			//命名空间错误，则不能入库
			if (!/^(?:Base|Tools|Widgets|Game|Page)\./.test(nameSpace)) {
				return warn("Class命名空间错误，一级命名空间只能是:Base、Tools、Widgets、Game、Page");
			}
			var nameSpaceArr = nameSpace.split("."),
				n = nameSpaceArr.length,
				i = 0,
				path = Class,
				name;
			for (; i < n - 1; i++) {
				name = nameSpaceArr[i];
				path = path[name] = path[name] || {};
			}
			name = nameSpaceArr[n - 1];
			if (path[name]) {
				return warn("已经有同名Class存在，请更换名称或路径！");
			}
			return function(subClass) {
				path[name] = subClass;
			};
		}

		function getAgentFn(superFn, fn) {
			var agentFn = function() {
				var hasOwnCallSuper = this.hasOwnProperty("callSuper"),
					tmp = this.callSuper,
					ret;
				this.callSuper = superFn;
				//如果在 fn中调用了 callSuper 则相当于调用到了 superFn
				//如果 superFn 并没有被覆盖（未被包装），而且里面也调用了 callSuper（多数是误用）
				//那么就陷入了死循环
				ret = fn.apply(this, arguments);
				//复原callSuper
				if (!hasOwnCallSuper) {
					delete this.callSuper;
				} else {
					this.callSuper = tmp;
				}
				return ret;
			};
			//2014-07-05 马超 增加包装标志，用于解决callSuper死循环问题
			agentFn.__isAgent = true;
			return agentFn;
		}

		function getWarnFn(str) {
			return function() {
				warn(str);
			};
		}
	})(window);

	/**
	 * 框架基础类
	 */
	(function(Class) {
		var slice = Array.prototype.slice,
			toString = Object.prototype.toString,
			noop = function() {},
			MUID = 1,
			isFunction = function(fn) {
				return toString.call(fn) == "[object Function]";
			};

		/**
		 * 消息和事件的基础类，不入库，仅仅内部使用
		 */
		var EventCore = Class.extend({
			init: function() {
				//创建私有事件缓存以及标志
				this.eventCache = this.eventCache || {};
			},
			//动态添加自定义事件缓存
			//events 仅仅支持字符串类型数据，空格分割的函数名称，建议事件名都添加 on/before/after 等明显前缀
			createEvent: function(events, extendBaseObj) {
				if (typeof events !== "string") {
					return;
				}
				var com = this,
					cache = com.eventCache;
				$.each(events.split(" "), function(i, eventName) {
					cache[eventName] = cache[eventName] || [];
					extendBaseObj && (com[eventName] = function(fn) {
						if (isFunction(fn)) {
							com.bind(eventName, fn);
							return this;
						} else {
							return com.trigger.apply(com, [eventName].concat(slice.call(arguments, 0)));
						}
					});
				});
			},
			//触发事件
			//cacheTime [可选]时间缓冲设置，默认0，不缓冲，缓冲类型为后到优先类型，用于防止高速事件触发动作带来的性能问题
			trigger: function(cacheTime, eventName) {
				var cache,
					falseNum = 0,
					com = this,
					para = slice.call(arguments, 1);

				//如果设置了cacheTime，则是缓冲模式，事件将无返回值
				if (!isNaN(cacheTime) && cacheTime && +cacheTime > 0) {
					if (typeof eventName !== "string") return 1;
					cache = this.eventCache[eventName || ""];
					if (!cache) return 2;
					//没有注册事件则不处理
					if (!cache.length) return 0;
					//保存参数
					cache.paras = para;
					if (!cache.t) { //如果等待的事件，则开始定时处理
						cache.t = window.setTimeout(function() {
							//删除定时器标志
							delete cache.t;
							//真正触发事件
							com.trigger.apply(com, cache.paras);
						}, parseInt(cacheTime, 10) || 200);
					}
					return 0;
				}
				//处理参数错误
				if (typeof cacheTime === "number" && (isNaN(cacheTime) || cacheTime < 0)) {
					if (typeof(eventName) !== "string") return 1;
					cache = this.eventCache[eventName || ""];
					if (cache) {
						this.warn("事件" + eventName + "设置的缓冲保护时间不是合法数字");
					}
				} else {
					//检测参数
					if (typeof(cacheTime || eventName) !== "string") return 1;
					//如果没有设置cacheTime则立即激发事件，并处理回调
					cache = this.eventCache[cacheTime || eventName || ""];
				}
				//没有注册事件则不处理
				if (!cache) return 2;

				//获取事件缓存的副本，以允许事件修改缓存（卸载）
				$.each(cache.slice(0), function(i, evt) {
					try { //防止handler出现错误导致其余handler无法执行
						if (evt.apply(com, para) === false) {
							falseNum++;
						}
					} catch (e) {
						com.log(e);
						return;
					}
				});
				return falseNum ? false : 0;
			},
			bind: function(eventName, handler) {
				if (typeof eventName !== "string") return 1;
				var cache = this.eventCache[eventName];
				if (!cache) return 2;
				if (!isFunction(handler)) return 3;
				//添加标志
				handler.muid = handler.muid || MUID++;
				//插入缓存
				cache.push(handler);
				return 0;
			},
			unbind: function(eventName, handler) {
				//全卸载
				if (arguments.length === 0) {
					this.eventCache = {};
					return 0;
				}
				//部分卸载
				if (typeof eventName !== "string") return 1;
				var cache = this.eventCache[eventName || ""];
				if (!cache) return 2;
				if (handler === undefined) {
					cache.length = 0;
					return this;
				}
				if (!isFunction(handler)) return 3;
				for (var i = 0; i < cache.length; i++) {
					if (cache[i] === handler || (handler.muid && cache[i].muid === handler.muid)) {
						cache.splice(i, 1);
						i--;
					}
				}
				return 0;
			},
			bindOnce: function(eventName, handler) {
				if (typeof eventName !== "string") return 1;
				var cache = this.eventCache[eventName],
					com = this;
				if (!cache) return 2;
				if (!isFunction(handler)) return 3;
				var fn = function() {
					var ret = handler.apply(this, arguments);
					com.unbind(eventName, fn);
					return ret;
				};
				//添加同源标志
				fn.muid = handler.muid = (handler.muid || MUID++);
				return com.bind(eventName, fn);
			}
		});

		/**
		 * 消息通知组件
		 */
		Class.extend("Base.Message", {
			init: function() {
				this.__agent = this.__agent || EventCore.create();
			},
			bindMsg: function(messageType, handler, _owner, _one) {
				if (!messageType || !isFunction(handler)) {
					return this;
				}
				//动态创建事件缓存，不设置快捷入口
				this.__agent.createEvent(messageType);
				//创建owner中介函数
				var Fn = _owner ? function() {
					return handler.apply(_owner, arguments);
				} : function() {
					return handler.apply(window, arguments);
				};
				//设置muid方便卸载用
				Fn.muid = handler.muid;
				//按照不同的绑定方式处理
				this.__agent[_one ? "bindOnce" : "bind"](messageType, Fn);
				//同步muid
				handler.muid = Fn.muid;
				return this;
			},
			bindMsgOnce: function(messageType, handler, _owner) {
				return this.bindMsg(messageType, handler, _owner, 1);
			},
			unbindMsg: function(eventName) {
				//消息不允许一次性全部卸载
				if (!eventName) {
					return this;
				}
				this.__agent.unbind.apply(this.__agent, arguments);
				return this;
			},
			sendMsg: function(cacheTime) {
				//不处理handler的返回值
				this.__agent.trigger.apply(
					this.__agent,
					//如果需要禁用缓冲保护，则打开下面的注释
					//Array.prototype.slice.call(arguments, !isNaN(cacheTime) && cacheTime ? 1 : 0)
					arguments
				);
				return this;
			}
		});
		//全局消息接口
		(function($, $$) {
			var globalMsg = Class.Base.Message.global = Class.Base.Message.create();
			$.each(["bindMsg", "bindMsgOnce", "unbindMsg", "sendMsg"], function(i, method) {
				$$[method] = $[method] = function() {
					globalMsg[method].apply(globalMsg, arguments);
					return this;
				};
			});
		})($ || window.jQuery || window.Zepto, window.Zepto || window);

		/**
		 * 基础事件组件
		 */
		EventCore.extend("Base.Event", {
			init: function(events) {
				this.callSuper();
				this.createEvent(events, true);
				this.createEvent = noop;
			},
			trigger: function(eventName) {
				var ret = this.callSuper.apply(this, arguments);
				if (ret && !isNaN(ret)) {
					this.warn(["trigger事件名称必须是字符串", "未注册的事件(" + eventName + ")不能trigger"][ret - 1]);
				}
				if (ret === false) {
					return false;
				}
			},
			bind: function(eventName) {
				var err = this.callSuper.apply(this, arguments);
				if (err) {
					this.warn(["bind事件名称必须是字符串", "未注册的事件(" + eventName + ")不能bind", "bind(" + eventName + ")注册事件必须是函数"][err - 1]);
				}
				return this;
			},
			unbind: function(eventName) {
				//暂时不允许一次性全部卸载
				if (!eventName) {
					this.warn("暂不支持全部事件一次性卸载");
					return this;
				}
				this.callSuper.apply(this, arguments);
				return this;
			},
			bindOnce: function(eventName) {
				var err = this.callSuper.apply(this, arguments);
				if (err) {
					this.warn(["bindOnce事件名称必须是字符串", "未注册的事件(" + eventName + ")不能bindOnce", "bindOnce(" + eventName + ")注册事件必须是函数"][err - 1]);
				}
				return this;
			}
		});
	})(window.Class);

	return Class;
});
