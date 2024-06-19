(function ($) {
  var threshold = 10, // 像素容差
    hiddenX = "hiddenX", // 动画前隐藏
    maxAnimateTime = 1200, // 最大动画时长
    initOnly = /ip(hone|ad|od)/i.test(navigator.userAgent), // 仅仅初始化有效
    $window = $(window),
    belowthefold = function (element) {
      var fold = (window.innerHeight || $window.height()) + $window.scrollTop();
      return fold <= element.offset().top - threshold;
    },
    abovethetop = function (element) {
      var fold = $window.scrollTop();
      return fold >= element.offset().top + threshold + element.height();
    },
    inviewport = function (element) {
      // 因为页面是缩放自适应，不会出现横向滚动条，所以左右就不检测
      return !belowthefold(element) && !abovethetop(element);
    },
    bindScroll = function (update) {
      // 刷新页面时，会先触发一次 scroll，滚动到上次停留的位置
      // 给一个延时，跳过这次 scroll
      setTimeout(function () {
        // ios下无法完美监听scroll事件，仅仅一次性处理完毕即可
        if (initOnly) {
          return update();
        }
        // 预览下模拟监听scroll事件
        if (window.isPreview && window.scrollHelper) {
          scrollHelper.bindScroll(update);
        } else {
          $(window).on('scroll resize', update);
        }
        update();
      }, window.isPreview ? 200 : 100);
      return initOnly || window.isPreview ? function () {} : function () {
        $(window).off('scroll resize', update);
      };
    },
    lazyAppear = function (elements, css) {
      var aniCss = css || "slideUp",
        N = elements.length,
        i = 0,
        offEvent = bindScroll(function () {
          if (i === N) return offEvent();
          elements.each(function (index, ele) {
            if (!ele.appeared) {
              var box = $(ele);
              if (initOnly || inviewport(box)) {
                i++;
                ele.appeared = true;
                box.removeClass(hiddenX);
                window.setTimeout(function () {
                  box.removeClass(aniCss);
                }, maxAnimateTime);
              }
            }
          });
        });
      elements.addClass(hiddenX + " " + aniCss);
    };

  // 必须等页面加载完毕才能开始处理
  $(function () {
    if (!window.globalAnimate || !window.globalAnimate.itemIn) {
      return;
    }
    // 预览时可以关闭动效
    if (window.isPreview && !globalAnimate.preview) {
      return;
    }
    initOnly = initOnly || globalAnimate.initOnly;
    // 在ISO下，仅仅处理首屏内容
    var sections = $("section");
    lazyAppear(initOnly ? sections.filter(function () {
      return inviewport($(this));
    }) : sections, globalAnimate.itemIn);
  });
})(window.Zepto || window.jQuery);
