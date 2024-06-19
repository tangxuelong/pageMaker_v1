/**
 * 拖放组件，基于拖动组件
 */
(function(factory) {
	if (window.define && define.amd) {
		define(["jquery", "drag"], function($){
			factory($);
		});
	}else if(window.jQuery){
		factory(window.jQuery);
	}
})(function($) {
	$.fn.dragDrop = function(options) {
		if (!$.fn.bindDrag) {
			return this;
		}
		var ops = $.extend({}, options || {});
		ops.box = $(ops.box || this.parent());
		if (!ops.items) {
			ops.items = ops.box.find(">*");
		}
		if (!ops.hook) {
			ops.hook = this.find(">*").eq(0);
		}
		if (!{
				relative: 1,
				absolute: 1
			}[ops.box.css("position")]) {
			ops.box.css("position", "relative");
		}
		var doms, itemPosArray, range, me = this,
			calPos = function(updateTop) {
				if (updateTop) {
					$.each(itemPosArray, function(i, inf) {
						inf.top = inf.dom.offset().top
					});
					return;
				}
				itemPosArray = [];
				if (!doms || !doms.length) {
					return;
				}
				$.each(doms, function(i, item) {
					var it = $(item);
					if (it[0] === me[0]) {
						return;
					}
					itemPosArray.push({
						dom: it,
						top: it.offset().top,
						height: it.height()
					});
				});
				var boxOffset = ops.box.offset().top;
				range = {
					min: boxOffset,
					max: boxOffset + ops.box.height()
				};
			};
		//绑定拖动
		var oldStyle, helper, orgPos, orgMouse, newPos;
		$(ops.hook, this).bindDrag({
			beforeDrag: function(e) {
				doms = $.isFunction(ops.items) ? ops.items() : ops.items;
				calPos();
				orgPos = me.offset().top;
				orgMouse = e.pageY;
				if (ops.beforeDrag) {
					ops.beforeDrag();
				}
			},
			dragStart: function(e) {
				var w = me.width();
				oldStyle = me.attr("style");
				me.width(w).css({
					zIndex: 1999,
					position: "absolute",
					opacity: 0.9,
					top: orgPos.top - range.min
				});
				helper = $("<div class='dragHelper'></div>");
				me.after(helper);
				helper.css({
					border: "1px dotted #333",
					height: me.outerHeight()
				});
				if (ops.dragStart) {
					ops.dragStart();
				}
			},
			onDrag: function(e) {
				var top = Math.min(Math.max(orgPos + e.pageY - orgMouse, range.min), range.max) - range.min;
				me.css({
					top: top
				});
				var readyPos = -2,
					refDom;
				//查找新位置
				$.each(itemPosArray, function(i, inf) {
					var t = top + range.min,
						//临界点放在顶部 0.2*height 处
						rt = inf.top + 15;
					if (i == 0 && t < rt) { //在第一个之前
						readyPos = -1;
						refDom = inf.dom;
					}
					if (t > rt) {
						readyPos = i;
						refDom = inf.dom;
					}
				});
				if (helper[0].posIndex != readyPos && readyPos >= -1) {
					helper[0].posIndex = readyPos;
					if (readyPos < 0) {
						refDom.before(helper);
					} else {
						refDom.after(helper);
					}
					calPos(true);
				}
			},
			dragEnd: function() {
				me.animate({
					top: helper.offset().top - range.min
				}, 200, function() {
					helper.after(me);
					helper.remove();
					me.removeAttr("style");
					if (oldStyle) {
						me.attr("style", oldStyle);
					}
					if (ops.dragEnd) {
						ops.dragEnd();
					}
				});
			}
		});
		return this;
	};
});
