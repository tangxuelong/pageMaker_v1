/**
 * 动效图
 */
(function ($) {
  // 1 低网速  2 高网速  0 未知
  // 不是低网速的一律当成高网速处理
  var net = window.__NET !== 1 ? 2 : 1;
  // 蒙层图片预加载时间不超过3秒
  var maxWait = 3000;
  // 提供对外的操作API
  window.ANIPIC = function (id, config, previewForBadNet) {
    var box = document.getElementById(id);
    if (!box || !config || !config.mask || !config.ani) {
      return;
    }
    var badNet = function () {
      loadImg([config.bak], function () {
        showImg(box, [{
          img: config.bak,
          ani: "opa",
          sp: 0
        }])
      });
    };
    // 根据网速进行区别加载
    // 低网速直接加载备用图案
    var useBadCase = window.isPreview ? previewForBadNet : net === 1;
    if (useBadCase && config.bak) {
      badNet();
      return;
    }
    // 高网速下加载完整配图
    var confs = [];
    var n = config.mask.length;
    var i = 0;
    for (; i < n; i++) {
      confs.push({
        img: config.mask[i],
        ani: config.ani[i],
        sp: config.sp[i] || 200
      });
    }
    loadImg(config.mask, function () {
      showImg(box, confs);
    }, function () {
      // 图片加载超时，则启动备用图片方案
      badNet();
    });
  };
  // 加载图片
  function loadImg(imgs, callback, timeOutCb) {
    var n = imgs.length;
    var i = 0;
    var finish = 0;
    var img;
    var rnd = "img" + Math.random().toString(16).slice(2);
    // 图片加载超时
    var waitTimer = window.setTimeout(function () {
      timeOutCb && timeOutCb();
    }, maxWait);
    var cb = function () {
      finish++;
      if (finish === n) {
        window.clearTimeout(waitTimer);
        window[rnd].length = 0;
        window[rnd] = undefined;
        callback();
      }
    };
    window[rnd] = [];
    for (; i < n; i++) {
      img = new Image();
      img.onload = img.onerror = cb;
      window[rnd].push(img);
      img.src = imgs[i];
    }
  }
  // 显示蒙层
  function showImg(box, confArr) {
    // 同一个容器仅仅加载一次图片
    if (box.__loadedImg) {
      return;
    }
    box.__loadedImg = true;
    // 获取容器，插入蒙层图片
    var container = $(box).find(".anipic-inner").empty().append("<div>").find("div");
    var delay = 0;
    var appendImg = function (conf) {
      container.append('<img class="ani-pic-' + conf.ani + '" src="' + conf.img + '"/>');
    };
    // 遍历插入蒙层
    $.each(confArr, function (i, conf) {
      // 第一帧因为预加载图片就不再设置动画延迟
      // 如果设置不延迟，则立即加载
      delay += conf.sp;
      if (delay === 0) {
        appendImg(conf);
      } else {
        window.setTimeout(function () {
          appendImg(conf);
        }, delay);
      }
    });
  }
})(window.jQuery || window.Zepto);
