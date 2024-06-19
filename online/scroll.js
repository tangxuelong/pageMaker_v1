document.addEventListener('DOMContentLoaded', function () {
  if (window.isPreview) {
    return;
  }
  // 补丁
  var requestAnimationFrame = window.requestAnimationFrame || function (fn) {
    setTimeout(fn, 17);
  };
  // 运动核心函数
  var scrollCore = function (initValue, targetValue, fn, rate) {
    var currentValue = initValue;
    (function gogo() {
      currentValue = currentValue - (currentValue - targetValue) / (rate || 3);
      // 临界判断，终止动画
      if (Math.abs(currentValue - targetValue) <= 1) {
        fn(targetValue);
        return;
      }
      fn(currentValue);
      requestAnimationFrame(gogo);
    })();
  };
  // 文档scrollTop操作
  var docScrollTop = {
    get: function() {
      return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    },
    set: function(value) {
      document.documentElement.scrollTop = value;
      window.pageYOffset = value;
      document.body.scrollTop = value;
    }
  };
  // 上线滚动包装函数
  var scrollTop = function (targetPos) {
    scrollCore(docScrollTop.get(), targetPos, function (value) {
      docScrollTop.set(value);
    });
  };
  // 获取元素的offsetTop
  var getOffsetTop = function (e) {
    var offset = e.offsetTop;
    if (e.offsetParent != null) offset += getOffsetTop(e.offsetParent);
    return offset;
  };
  // 兼容预览模式下的iscroll的处理
  window.scrollHelper = {
    scrollTop: function (v) {
      scrollTop(v || 0);
    },
    bindScroll: function (fn) {
      window.addEventListener("scroll", fn, false);
    },
    getScrollY: function () {
      return docScrollTop.get();
    },
    scrollToItem: function (item, fix) {
      scrollTop(getOffsetTop(item) + (fix || 0));
    },
    // 移动助手
    scrollCore: scrollCore
  };
}, false);
