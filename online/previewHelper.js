/**
 * 预览助手
 * 部分组件预览状态下如果需要显示效果，需要进行特殊处理
 * 原因：预览状态下使用iscroll来模拟滑动，在实际代码中是没有的
 */
// 跟top页面同名变量，方便脚本检测
// 返顶操作预览助手/入场动效助手
(function () {
  // 线上覆盖代码请查看 scroll.js
  window.scrollHelper = {
    scrollTop: function (v) {
      if (v === undefined) {
        return myScroll ? myScroll.y : 0;
      } else {
        myScroll && myScroll.scrollTo(0, v, 100);
      }
    },
    bindScroll: function (fn) {
      if (myScroll) {
        fn && myScroll.on("scroll", fn);
      } else {
        window.setTimeout(function () {
          window.scrollHelper.bindScroll(fn);
        }, 10);
      }
    },
    // 为了不让返顶元素消失，强制返回一个固定值
    getScrollY: function () {
      return myScroll ? -1 * myScroll.y : document.body.scrollTop;
    },
    scrollToItem: function (item, fix) {
      item && window.setTimeout(function () { // 需要延后执行，等refresh执行完毕后再滚动
        myScroll && myScroll.scrollToElement(item, 200, 0, fix || 0);
      }, 0);
    }
  };
  var $ = window.parent.jQuery;
  var box = document.getElementById("_");
  var winH = $(window).height();
  var myScroll;
  var top = window.parent;
  $(document.body).addClass("preview");
  $(box).height(winH).css('overflow', 'hidden');
  $(function () {
    window.setTimeout(function () {
      myScroll = new IScroll(box, {
        mouseWheel: true,
        scrollbars: false,
        probeType: 3,
        bounce: false,
        eventPassthrough: "horizontal",
        preventDefaultException: {
          tagName: /^(?:INPUT|TEXTAREA|BUTTON|SELECT|A|I)$/,
          className: /(^|\s)btn(\s|$)/
        }
      });
      // 尝试修复fixed定位和transform的问题
      $(box).find(">div>*").each(function () {
        if ($(this).css("position") === "fixed") {
          $(document.body).append(this);
        }
      });
      // 如果页面高度发生变化（比如分组标题）
      window.whenPageChange = function () {
        myScroll.refresh();
      };
      myScroll.on("scrollEnd", function () {
        top.window._preview_myLastY = this.y;
        if (this.maxScrollY === this.y) { // 如果是滚动到最后，则
          top.window._preview_myLastY = "pageEnd";
        }
      });

      // 规避小屏幕滚动跳动问题
      var winH = top.window.innerHeight || top.window.document.documentElement.clientHeight;
      if (winH < 665) {
        return;
      }

      // 恢复滚动定位
      var lastY = top.window._preview_myLastY;
      if (lastY) {
        if (lastY === "pageEnd") {
          myScroll.scrollTo(0, myScroll.maxScrollY);
        } else {
          myScroll.scrollTo(0, top.window._preview_myLastY);
        }
      }
    }, 100);
  });
})();
