/**
 * 蒙层控制类(可独立调用)
 *
 * 事件： onCreate/onClick/onDestroy
 * 初始化控制参数
 *      zindex      //层级高度
 *      type        //蒙层类型，-1全透明蒙层  1半透蒙层
 *      css         //蒙层额外样式
 *      animate     //动画类型，支持 1渐入渐出  0无动画，如果全透明，则强制无动画
 */
import $ from "jquery";
import { LogClass, Message, Event } from "base/class";

//蒙层类私有代码
var _Layout = {
	//半透明灰色蒙层的个数，最大允许一个，以防止多个半透蒙层叠加导致显示效果变差
	grayLayoutNum: 0,
	layoutNum: 0,

	//创建一个新的蒙层dom节点
	prepareDoms: function(zIndex, type, css) {
		//计算屏幕可用区域最大宽高
		var maxWH = this.getMaxWH(),
			//创建蒙层
			layout = $("<div class='iDialogLayout'></div>").appendTo(this.body[0]).css("zIndex", zIndex),
			//定位类型
			fixed = layout.css("position").toLowerCase() === "fixed",
			//是否蒙层全透明
			opacityZero = type !== 2 && (type !== 1 || this.grayLayoutNum > 0);
		//类型参数检测
		type = {
			1: 1,
			2: 2
		}[type] || -1;

		//调整半透/透明样式
		if (opacityZero) {
			layout.addClass("iOpacityZero");
		} else {
			this.grayLayoutNum++;
		}
		this.layoutNum++;

		//增加自定义样式
		if (css) {
			layout.addClass(css);
		}

		//宽高调整
		fixed || layout.height(maxWH.height);

		//返回
		return {
			layout: layout,
			opacityZero: opacityZero
		};
	},

	//计算可用区域最大高度和宽度
	getMaxWH: function() {
		var body = this.body = this.body || $(document.body),
			win = this.win = this.win || $(win);
		return {
			width: Math.max(body.outerWidth(), document.documentElement.clientWidth),
			height: Math.max(body.outerHeight(), win.height(), document.documentElement.clientHeight)
		};
	},

	//窗口变化，调整蒙层尺寸
	resize: function() {
		var maxWH = _Layout.getMaxWH();
		$(".iDialogLayout").width(maxWH.width).height(maxWH.height);
	},

	/*
	 * 动画特效管理
	 * act 1显示 2隐藏
	 * type 0无动画 1淡入淡出
	 */
	animate: function(dom, act, type, callback) {
		if (type == 1) {
			dom[act == 1 ? "hide" : "show"]()[act == 1 ? "fadeIn" : "fadeOut"](300, callback || $.noop);
		} else {
			(callback || $.noop)();
		}
	}
};

export default class Layout extends Event {
	constructor(ops) {
		//定义事件名
		super("onCreate onClick onDestroy");

		//继续
		var com = this,
			doms = _Layout.prepareDoms(ops.zindex || ops.zIndex, ops.type, ops.css);
		//保存数据
		this.options = ops;
		this.opacityZero = doms.opacityZero;
		this.cache = doms;
		//非全透明蒙层，动画处理
		if (ops.animate && !doms.opacityZero) {
			_Layout.animate(doms.layout, 1, ops.animate);
		}
		//绑定事件
		doms.layout.mousedown(function(e) {
			com.trigger("onClick", doms.layout, doms.opacityZero);
		});
		//事件通知
		window.setTimeout(function() {
			com.trigger('onCreate', doms);
		}, 0);
	}

	destroy() {
		var com = this,
			ops = com.options,
			layout = com.cache.layout,
			destroy = function() {
				com.options = com.cache = undefined;
				layout[0] && layout.remove();
				if (_Layout.layoutNum === 0) {
					_Layout.win.unbind('resize', _Layout.resize);
				}
				com.trigger("onDestroy");
			};
		//仅仅可以调用一次
		this.destroy = $.noop;
		//计数器更新
		if (!this.opacityZero) {
			_Layout.grayLayoutNum--;
		}
		_Layout.layoutNum--;
		//销毁蒙层
		if (ops.animate && !this.opacityZero && layout[0]) {
			_Layout.animate(layout, 2, ops.animate, destroy);
		} else {
			destroy();
		}
	}
};
