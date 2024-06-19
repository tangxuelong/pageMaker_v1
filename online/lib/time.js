(function ($) {
  if (!$) {
    return;
  }
  // 定义主要接口
  var now = function () {
    var _now = Number(new Date());
    if (now.serverTime) {
      return new Date(now.serverTime + _now - now.localTime);
    } else {
      return new Date();
    }
  };
  // 增加修正标志
  now.fixed = false;

  // 增加ready通知
  var readyCache = [];
  now.ready = function (fn) {
    if (!$.isFunction(fn)) {
      return;
    }
    if (now.fixed) {
      fn();
    } else {
      readyCache.push(fn);
    }
  };

  function checkTimerData() {
    now.fixed = true;
    $.each(readyCache, function (i, fn) {
      fn();
    });
  }

  // 请求当前页面地址的head内容
  var url = document.URL;
  if (!/^http/i.test(url)) {
    url = window.top.document.URL;
  }
  var start = Number(new Date());
  $.ajax({
    type: "HEAD",
    url: url.replace(/\?.+$/, ""),
    complete: function (xhr, retStatus) {
      var end = Number(new Date());
      if (retStatus === "success") {
        var serverTime = xhr.getResponseHeader("date");
        if (serverTime) {
          // 考虑链路传输的时间
          now.localTime = Number(new Date());
          now.serverTime = Number(new Date(serverTime)) + (end - start) / 2;
          // 检查数据
          checkTimerData();
          return;
        }
      }
      // 获取时间错误
      checkTimerData(null);
    }
  });

  $.now = now;
})(window.Zepto || window.jQuery);
