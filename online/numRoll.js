// 数字滚动组件
// 2017年05月16日 马超 增加
(function ($) {
  var easeOut = function (t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  };
  // 这个函数抄自360彩票
  function tweenScroll(o) {
    o = $.extend({
      t: 20, // 多少个20ms也就是多少个1000/fps
      r: 5, // 最少循环几次
      y1: 0, // 原始的位置
      y2: 0, // 最终的位置
      h: 18, // 单个元素的高度
      m: 10, // 一个ul有几个元素
      v: 5, // 当前的值
      ele: null,
      cb: null, // 结束回调函数
      inter: null // 定时器
    }, o)
    var n;
    var j = 0;
    var c = o.ele.find('li');
    for (; j < o.r; j++) {
      o.ele.append(c.clone());
    }
    o.y2 = -(o.r * o.m * o.h + o.v * o.h);
    o.li = c.eq(0);
    var _t = 0;
    var _b = 0;
    var _c = o.y2;
    var _d = o.t;
    o.inter = function () {
      setTimeout(function () {
        if (_t < _d) {
          n = Math.round(easeOut(_t++, _b, _c, _d));
          o.li.css({
            marginTop: n
          });
          o.inter();
        } else {
          o.cb && o.cb(o.ele, o.v);
        }
      }, 20);
    }

    // 略微延迟一下再开始
    window.setTimeout(function () {
      o.inter();
    }, 300);
  }

  // 对外接口
  window.numRoll = function (wrapId, order, speed) {
    // 不能立即找到目标元素的，则直接忽略不处理
    var wrap = document.getElementById(wrapId);
    if (!wrap) {
      return;
    }
    // 获取数字容器
    var nums = $(".rollnum", wrap);
    var totalItem = nums.length;
    if (!totalItem) {
      return;
    }

    // 计算基速度参数
    var baseSpeed = {
      1: [100, 60],
      2: [80, 50],
      3: [50, 20]
    }[speed] || [80, 50];

    // 改造html代码，插入滚动元素
    var holder = (function () {
      var ret = [];
      for (var i = 0; i < 10; i++) {
        ret.push('<li>' + (i % 10) + '</li>');
      }
      return ret.join("");
    })();

    // 开始遍历处理
    nums.each(function (i) {
      var me = $(this);
      var N = Number(me.text());
      var H = me.height();
      var W = me.width();

      // 修改dom结构
      var UL = me.html("<ul>" + holder + "</ul>").find("ul").css({
        width: W,
        height: H,
        lineHeight: H + "px"
      });

      // 设置动效
      tweenScroll({
        ele: UL,
        v: N,
        h: H,
        t: (function (order, index) {
          switch (order) {
            case 1: // 随机
              return baseSpeed[0] + baseSpeed[1] * Math.random() * totalItem;
            case 3: // 从右到左
              return baseSpeed[0] + baseSpeed[1] * (totalItem - index);
            case 2: // 从左到右
            default: // 默认从左到右
              return baseSpeed[0] + baseSpeed[1] * index;
          }
        })(Number(order), i),
        // 动效结束后，恢复原有dom节点
        cb: function () {
          me.text(N);
        }
      });
    });
  };
})(window.Zepto || window.jQuery);
