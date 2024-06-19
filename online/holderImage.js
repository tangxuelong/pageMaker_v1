(function ($) {
  var threshold = 10; // 像素容差
  var $window = $(window);
  var inviewport = function (element) {
    var offset = element.offset();
    var farBottom = (window.innerHeight || $window.height()) + $window.scrollTop();
    var nearTop = $window.scrollTop();
    var elementH = element.height();
    var elementW = element.width();
    // 上下进入视野
    return farBottom > offset.top - threshold &&
      nearTop < offset.top + threshold + elementH &&
      // 左右进入视野
      offset.left - threshold < $window.width() &&
      offset.left + elementW + threshold > 0;
  };
  var bindScroll = function (update) {
    // 刷新页面时，会先触发一次 scroll，滚动到上次停留的位置
    // 给一个延时，跳过这次 scroll
    setTimeout(function () {
      // 预览下模拟监听scroll事件
      if (window.isPreview && window.scrollHelper) {
        window.scrollHelper.bindScroll(update);
      } else {
        $window.on('scroll resize', update);
      }
      update();
    }, window.isPreview ? 100 : 0);
    return window.isPreview ? function () {} : function () {
      $window.off('scroll resize', update);
    };
  };
  // 内存中加载图片
  var preloadImage = function (url, callback) {
    var img = new Image();
    var t = window.setTimeout(function() {
      img = null;
      callback(url);
    }, 2000);
    img.onload = img.onerror = function (e) {
      t && window.clearTimeout(t);
      img && callback(url);
      img = null;
    };
    img.src = url;
  };
  // 显示一个holderImage
  var dealOneImage = function (ele) {
    var element = $(ele);
    if (!element.hasClass("holderImage")) {
      return 1;
    }
    if (inviewport(element)) {
      // 更换原图
      preloadImage(element.data("src"), function (url) {
        element.attr("src", url);
        element.removeClass("holderImage");
      });
      return 1;
    }
    return 0;
  };

  // 给一个全局入口，用于脚本调用，处理无滚动时进入视野的图片，比如图片轮播
  // window.holderImages = function (elements) {
  //   elements && $(elements).each(function (i, element) {
  //     dealOneImage(element);
  //   });
  // };
  // window.holderSubImages = function (wrap) {
  //   $(".holderImage", wrap || document).each(function (i, element) {
  //     dealOneImage(element);
  //   });
  // }

  // 必须等页面加载完毕才能开始处理
  document.addEventListener('DOMContentLoaded', function () {
    var elements = $(".holderImage");
    var N = elements.length;
    var offEvent = bindScroll(function () {
      var notNeedDeal = 0;
      elements.each(function (index, element) {
        notNeedDeal += dealOneImage(element);
      });
      // 都不需要处理的时候，卸除监听事件
      if (notNeedDeal === N) {
        offEvent();
      }
    });
    // 由于swipe组件会复制图片节点，所以需要更新elements元素
    window.updateHolderImage = function() {
      elements = $(".holderImage");
      N = elements.length;
    };
  }, false);
})(window.Zepto || window.jQuery);
