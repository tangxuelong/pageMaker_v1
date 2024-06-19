(function ($) {
  if (!$) {
    return;
  }
  // 从下往上滚动
  function yscroll(domId, option) {
    var box = $(document.getElementById(domId));
    var scrollList = box.find('ul');
    var op = option || {};
    var itemNum = box.find('li').length;
    var itemHeight = box.find('li').height();

    // 如果没有高度，则放弃处理
    if (itemHeight <= 0) {
      console.error("老司机！滚动字幕配置搞错了~");
      return;
    }

    // 计算速度和间隔
    op.speed = ({
      "3": 600,
      "2": 900,
      "1": 1200
    }[op.speed] || 900);
    op.interval = ({
      "3": 1200,
      "2": 900,
      "1": 600
    }[op.wait] || 900) * 2;

    // 复制第一个用于平滑过渡
    scrollList.append(box.find('li').eq(0).clone());

    // 设置容器的高度
    box.find(".textRollList").height(itemHeight);

    // 开始定时滚动
    setInterval(function () {
      var top = parseInt(scrollList.css('top').replace(/[a-zA-Z]/g, "") || 0);
      if (top <= -itemNum * itemHeight || top === 0) {
        scrollList.css({
          'top': 0
        });
        top = 0;
      }
      scrollList.animate({
        'top': (top - itemHeight) + "px"
      }, op.speed);
    }, op.interval + op.speed);
  }

  // 从右往左滚动
  function xscroll(domId, option) {
    var box = $(document.getElementById(domId));
    var scrollList = box.find('ul');
    var op = option || {};
    var listWidth = scrollList.width();

    // 复制以保证可以显示至少一屏用于无缝滚动
    var copyNum = Math.ceil(box.width() / listWidth);
    var clone = scrollList.html();
    for (var i = 0; i < copyNum; i++) {
      scrollList.append(clone);
    }

    // 无缝滚动，按照页面的宽度计算基础速率参考值
    var oneStep = document.body.offsetWidth / 100;
    var speed = ({
      "3": 12,
      "2": 8,
      "1": 4
    }[op.speed] || 8) * oneStep;
    var costTime = 300 * listWidth / speed;

    // 开始循环滚动
    (function continueRoll() {
      var left = parseInt(scrollList.css('left').replace(/[a-zA-Z]/g, "") || 0);
      if (left <= -listWidth || left === 0) {
        scrollList.css({
          'left': '0'
        });
        left = 0;
      }
      scrollList.animate({
        'left': -listWidth + "px"
      }, costTime, "linear", continueRoll);
    })();
  }


  // 对外的包装接口
  window.textRoll = function (dir, domId, option) {
    if (dir === "y") {
      yscroll(domId, option);
    } else {
      xscroll(domId, option);
    }
  };
})(window.Zepto || window.jQuery);
