/*
 * 简易拖拉组件 $.fn.bindDrag
 * 不使用浏览器自带的拖拉事件，而是使用mousedown / mousemove / mouseup 事件
 * 一个组合参数，事件函数的调用者都指向Dom元素本身
 * {
 *  beforeDrag : fn, // 鼠标按下时触发，接收一个参数，event 对象，若fn返回flase则不拖动
 *  dragStart : fn, // 准备拖动前触发，接收一个参数，event 对象，若fn返回flase则不拖动
 *  onDrag : fn,    //拖动中不断触发，接收一个参数，event 对象
 *  dragEnd : fn,   //拖动结束时触发，接收一个参数，event 对象
 *  pix : 3         //启用拖动像素差，不得小于1，不得大于10
 * }
 */
(function ($) {
  function fixEvent(e) {
    if (e && e.originalEvent && e.originalEvent.targetTouches) {
      e.targetTouches = e.originalEvent.targetTouches;
    }
    if (e && e.targetTouches && e.targetTouches[0]) {
      e.pageX = e.pageX || e.targetTouches[0].pageX;
      e.pageY = e.pageY || e.targetTouches[0].pageY;
      e.clientX = e.pageX || e.targetTouches[0].clientX;
      e.clientY = e.pageY || e.targetTouches[0].clientY;
    }
  }
  var noop = function () {};
  $.fn.bindDrag = function (options) {
    var op = $.extend({
      beforeDrag: noop,
      dragStart: noop,
      onDrag: noop,
      dragEnd: noop,
      pix: 3
    }, options || {});
    var touchSupport = "ontouchstart" in document;
    var dragCache;
    var dragEvents = {
      mousedown: function (e) {
        fixEvent(e);
        // 用户停止
        if (op.beforeDrag.call(this, e) === false) {
          return;
        }
        // 缓存鼠标位置并标记
        dragCache = {
          mouse: [e.pageX, e.pageY],
          flag: 1
        };
        var _mousemove = $.proxy(dragEvents.mousemove, this);
        var _mouseup = $.proxy(dragEvents.mouseup, this);
        var $this = this;
        // 绑定document进行监听
        if (touchSupport) {
          // 延迟绑定，否则会阻止元素的click事件
          window.setTimeout(function () {
            document.___fn = _mouseup;
            $(document).bind("touchend", _mouseup).bind("touchcancel", _mouseup);
            document.addEventListener("touchmove", _mousemove, {
              passive: false
            });
            // 如果没有触发move，则需要主动取消事件
            dragCache._t = window.setTimeout(function () {
              dragEvents.mouseup.call($this, e);
            }, 350);
          }, 0);
        } else {
          // 全屏监听
          this.setCapture ? this.setCapture() : window.captureEvents && window.captureEvents(window.Event.MOUSEMOVE | window.Event.MOUSEUP);
          $(this).one("losecapture", function () {
            _mouseup();
          });
          $(document).mousemove(_mousemove).mouseup(_mouseup);
          // 仅阻止默认行为，不阻止冒泡
          e.preventDefault();
        }
      },
      mousemove: function (e) {
        dragCache._t && window.clearTimeout(dragCache._t);
        fixEvent(e);
        var cache = dragCache;
        if (cache.flag < 1) {
          return;
        }
        if (cache.flag > 1) {
          op.onDrag.call(this, e);
        } else if (Math.abs(e.pageX - cache.mouse[0]) >= op.pix || Math.abs(e.pageY - cache.mouse[1]) >= op.pix) {
          cache.flag = 2;
          if (op.dragStart.call(this, e) === false) { // 用户停止
            cache.flag = 1;
            dragEvents.mouseup.call(this, e);
          } else if (!touchSupport) {
            // 非触屏版强制取消一次click
            $(this).one("click", function() {
              return false
            });
          }
        }
        e.preventDefault();
      },
      mouseup: function (e) {
        fixEvent(e);
        var cache = dragCache;
        if (cache.flag > 1) {
          op.dragEnd.call(this, e);
        }
        // 重置标签
        cache.flag = 0;
        // 取消事件监听
        if (touchSupport) {
          $(document).unbind("touchend", dragEvents.mouseup).unbind("touchcancel", dragEvents.mouseup);
          document.removeEventListener("touchmove", document.___fn);
          delete document.___fn;
        } else {
          this.releaseCapture ? this.releaseCapture() : window.releaseEvents && window.releaseEvents(window.Event.MOUSEMOVE | window.Event.MOUSEUP);
          $(this).unbind("losecapture");
          $(document).unbind("mousemove", dragEvents.mousemove).unbind("mouseup", dragEvents.mouseup);
          e.preventDefault();
        }
        return false;
      }
    };
    // 像素差范围 [1,9]
    op.pix = op.pix < 1 ? 1 : op.pix > 9 ? 9 : op.pix;
    // 绑定mousedown监听触发
    touchSupport && this.bind("touchstart", dragEvents.mousedown);
    return this.mousedown(dragEvents.mousedown);
  };
})(window.jQuery || window.Zepto);
