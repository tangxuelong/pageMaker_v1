/**
 * 返回顶部
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.scrollHelper) {
    return;
  }
  // 兼容预览模式下的iscroll的处理
  var helper = window.scrollHelper;
  var doms = document.querySelectorAll(".easyEntry.themeTop,.secTop");
  var timer = 0;
  var each = function (fn) {
    for (var i = 0, n = doms.length; i < n; i++) {
      fn(doms[i], i);
    }
  };
  var check = function (show) {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(function () {
      each(function (dom) {
        dom.style.display = show ? "block" : "none";
      });
      timer = 0;
    }, 30);
  };
  // 预览模式下一直显示
  var distence = window.isPreview ? -1 : 60;
  if (doms.length) {
    helper.bindScroll(function () {
      check(helper.getScrollY() >= distence);
    });
    check(helper.getScrollY() >= distence);
    each(function (dom) {
      if (dom.className.indexOf('secTop') >= 0) {
        return;
      }
      dom.addEventListener("click", function (e) {
        helper.scrollTop(0);
        e.preventDefault && e.preventDefault();
      }, false);
    });
  }
}, false);
