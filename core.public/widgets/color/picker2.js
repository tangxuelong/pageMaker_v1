/*
 * 颜色选择器
 * */
define(["jquery", "color", "drag"], function ($) {
	var defaultColor = [
		'#ffffff', '#434343', '#5d5d5d', '#28d067', '#4095d6', '#ffb400', '#cec1b1', //触屏版制作工具内置的颜色值
		'#d06b64', '#f83a22', '#fa573c', '#ff7537', '#ffad46', '#42d692', '#16a765',
		'#7bd148', '#b3dc6c', '#fbe983', '#fad165', '#92e1c0', '#9fe1e7', '#9fc6e7',
		'#4986e7', '#9a9cff', '#b99aff', '#c2c2c2', '#cabdbf', '#cca6ac', '#f691b2',
		'#cd74e6', '#a47ae2', 'transparent', ''
	];
	var guid = 1;
	var getHTML = function (currentValue) {
		var id = "colorPickerBox" + guid++,
			colors = !currentValue || defaultColor.indexOf(currentValue) >= 0 ? defaultColor : [currentValue].concat(defaultColor);
		//插入dom
		var html = ["<div id='", id, "' class='colorPickerBox'>"];
		$.each(colors, function (i, color) {
			var css = ["colorItem"],
				title = color;

			if (color === currentValue) {
				css.push("active");
			}
			if (color === "#ffffff") {
				css.push("transColor");
				title = "白色";
			}
			if (color === "transparent") {
				css.push("transColor");
				title = "透明";
			}
			if (color === "") {
				css.push("defColor");
				title = "默认";
			}
			html.push("<span class='" + css.join(" ") + "' data-color='" + color + "' style='background:" + color + "' title='" + title + "'></span>");
		});
		//2016-08-22 增加高级rgba编辑功能
		html.push(['<div class="rgbaColorMaker">',
			'<div class="previewColorBox"><div class="previewColorItem"></div></div>',
			'<div class="colorMakerBox">',
			(function (ts) {
				var html = [];
				$.each(ts, function (i, t) {
					html.push('<div class="colorMakerBarBoxWrap ' + t + '">');
					html.push('<div class="colorMakerInputWrap"><input maxlength=3 name="' + t + '" value="0"/></div>');
					html.push('<div class="colorMakerBarWrap"><div data-type="' + t + '" class="colorMakerBar"><span></span></div></div>');
					html.push('</div>');
				});
				return html.join("")
			})(["R", "G", "B", "A"]),
			'</div>',
			'</div>',
			//查看选择的颜色值
			'<div class="colorResultBox">',
			'<div class="colorResult"><input name="result" readonly="readonly" value=""/></div>',
			'<div class="colorChooseWrap"><a class="colorChooseBtn" href="#">选择</a></div>',
			'</div>'
		].join(""));
		html.push("</div>");

		//插入页面
		$(document.body).append(html.join(""));
		return $("#" + id);
	};
	var findIndex = function (dom) {
		var Z = 0,
			findZ = function (o) {
				var p = o.offsetParent(),
					z = p[0] ? ((p.css("zIndex") || "") + "").replace(/\D/g, "") : "";
				if (z) Z = Math.max(Z, +(z || 1));
				if (!p[0] || p[0] == document.body || p[0].tagName === "HTML") return;
				findZ(p);
			};
		findZ($(dom));
		//没有定位参考的，不处理层级高度
		//有定位参考的，则比最大zIndex增加2（但有时也未必能满足要求，比如附近的元素层级较高）
		return Z <= 0 ? undefined : (Z + 2);
	};
	var RGBToHex = function (t) {
		var n = [t.R.toString(16), t.G.toString(16), t.B.toString(16)];
		$.each(n, function (e, t) {
			t.length === 1 && (n[e] = "0" + t)
		});
		return n.join("")
	};
	var HexToRGB = function (e, needAlpha) {
		e = parseInt(e.indexOf("#") === 0 ? (function (str) {
			if (str.length === 6) {
				return str;
			} else { //补足六位
				var narr = (str + "000").split("");
				return narr[0] + narr[0] + narr[1] + narr[1] + narr[2] + narr[2];
			}
		})(e.substring(1)) : e, 16);
		return {
			R: e >> 16,
			G: (e & 65280) >> 8,
			B: e & 255,
			A: needAlpha ? 1 : undefined
		};
	};
	var colorToRGBA = function (colorStr, alphaBet) {
		var ret;
		if (!colorStr || colorStr === "transparent") {
			return {
				R: 0,
				G: 0,
				B: 0,
				A: 0
			};
		}
		if (colorStr.indexOf("#") === 0) {
			ret = HexToRGB(colorStr, true);
		} else if (/^rgba\((\d+),(\d+),(\d+),([\d\.]+)\)$/i.test(colorStr)) {
			ret = {
				R: +RegExp.$1,
				G: +RegExp.$2,
				B: +RegExp.$3,
				A: +RegExp.$4
			};
		} else {
			ret = HexToRGB("#" + colorStr, true);
		}
		if (alphaBet && ret) {
			ret.A *= alphaBet;
		}
		return ret;
	};
	var initColorPicker = function (input) {
		var myPicker = getHTML(input[0].value).delegate(".colorItem", "click", function () {
			var color = $(this).data("color");
			input.val(color).trigger("input");
			myPicker.find(".active").removeClass("active");
			$(this).addClass("active");
			if (!color) {
				destroyMyPicker();
				return;
			}
			sync.setColorCode(color);
		}).mousedown(function (e) {
			e.stopPropagation();
		});

		//关闭函数
		var destroyMyPicker = function () {
			$(document).unbind("mousedown", destroyMyPicker);
			myPicker.remove();
			myPicker.length = 0;
		};

		//绑定document点击关闭
		$(document).one("mousedown", destroyMyPicker);

		//高级编辑模块dom缓存
		var rgba = {},
			bar = {},
			handler = {};
		$.each(["R", "G", "B", "A"], function (i, t) {
			rgba[t] = myPicker.find("[name=" + t + "]");
			bar[t] = myPicker.find(".colorMakerBar[data-type=" + t + "]");
			handler[t] = bar[t].find("span");
		});
		var chooseBtn = myPicker.find(".colorChooseBtn");
		var colorCode = myPicker.find("[name=result]");
		var previewItem = myPicker.find(".previewColorItem");
		//同步函数
		var sync = {
			checkVal: function (v, type) {
				var nv = v.replace(/\D/g, "") || "0";
				//透明度按照 100 计算，全部搞成正整数
				return Math.min(Math.max(0, +nv), type === "A" ? 100 : 255);
			},
			readInput: function (e) {
				if (sync.lock) {
					return;
				}
				if (e && e.target && e.target.tagName === "INPUT") {
					var nn = sync.checkVal(e.target.value, $(e.target).attr("name"));
					if (e.target.value !== nn + "" && e.target.value) {
						e.target.value = nn;
					}
				}
				$.each(rgba, function (key, inputDom) {
					sync[key] = sync.checkVal(inputDom[0].value, key);
				});
				sync.update();
			},
			update: function (updateInput) {
				sync.setResult();
				sync.setHandler();
				sync.setPreview();
				if (updateInput) {
					sync.lock = true;
					$.each(rgba, function (key, inputDom) {
						inputDom[0].value = sync[key];
					});
					delete sync.lock;
				}
			},
			setColorCode: function (colorStr) {
				var color = colorToRGBA(colorStr, 100);
				for (var key in color) {
					sync[key] = color[key];
				}
				sync.update(true);
			},
			getColorCode: function () {
				return sync.A === 0 ? "transparent" : sync.A === 100 ? "#" + RGBToHex(sync) : ("rgba(" + [sync.R, sync.G, sync.B, sync.A / 100].join(",") + ")");
			},
			setResult: function () {
				colorCode.val(sync.getColorCode());
			},
			setHandler: function () {
				$.each(handler, function (key, dom) {
					var max = key === "A" ? 100 : 255;
					dom.css("left", 100 * sync[key] / max + "%");
				});
			},
			setPreview: function () {
				previewItem.css("background-color", sync.getColorCode());
			}
		};
		//设置初始化的颜色值
		sync.setColorCode(input[0].value);

		//初始化
		myPicker.delegate(".colorMakerInputWrap input", "input", sync.readInput);

		//拖动绑定
		(function () {
			$.each(bar, function (key, $bar) {
				var max = key === "A" ? 100 : 255;
				var posLeft;
				var barWidth = $bar.width();
				var read = function (e) {
					var offsetX = Math.min(barWidth, Math.max(0, e.offsetX));
					sync[key] = Math.round(offsetX * max / barWidth);
					sync.update(true);
				};
				$.fn.bindDrag && $bar.bindDrag({
					beforeDrag: function () {
						posLeft = $bar.offset().left;
					},
					onDrag: function (e) {
						read({
							offsetX: e.pageX - posLeft
						});
					}
				});
				$bar.mousedown(read);
			});
		})();

		//选择颜色
		myPicker.find(".colorChooseBtn").click(function (e) {
			input.val(sync.getColorCode()).trigger("input");
			destroyMyPicker();
			return false;
		});
		return myPicker;
	};
	$.fn.colorPicker = function () {
		return this.each(function () {
			if (this.colorPickerBind) {
				return;
			}
			this.colorPickerBind = true;
			var myPicker, timer, input = $(this);
			$(this).focus(function () {
					timer && window.clearTimeout(timer);
					myPicker = myPicker && myPicker.is(":visible") ? myPicker : initColorPicker(input);
					//定位显示
					var pos = $(this).offset(),
						zIndex = findIndex(this) + 10;
					myPicker.css({
						zIndex: zIndex,
						left: pos.left,
						top: pos.top + $(this).outerHeight() + 3
					});
				})
				.mousedown(function (e) {
					e.stopPropagation();
				})
				.bind("input", function () {
					var color = $.getColor(this.value);
					this.style.backgroundColor = color;
					this.style.color = $.contrastColor(color);
				}).trigger("input");
		});
	};

	return {}
});
