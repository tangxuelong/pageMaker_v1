(function ($) { // 可以使用 lib/time 来替换服务器时间校准的逻辑
  if (!$) {
    return;
  }
  var timerCache = window.timerCache = window.timerCache || {};

  // 开始处理定时器数据
  var now = function () {
    var _now = Number(new Date());
    return now.serverTime + _now - now.localTime;
  };
  var url = document.URL;
  if (!/^http/i.test(url)) {
    url = window.top.document.URL;
  }

  // 请求服务器获取当前时间
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

  function findValidTimer(key) {
    var index = -1;
    var conf = timerCache[key] || {};
    $.each(conf.timers || [], function (i, tconf) {
      // 检查是否需要等待其他模块触发倒计时
      if (i === 0 && tconf.t === 0) {
        index = -2;
        return false;
      }
      if (now() < tconf.t) { // 命中了配置的时间
        index = i;
        return false;
      }
    });
    return index;
  }

  function checkTimerData() {
    $.each(timerCache, function (key, conf) {
      var wrap = $("#" + key + " .timerwrap");
      if (wrap[0]) {
        var index = findValidTimer(key);
        conf.wrap = wrap;
        if (index >= 0) {
          startOneTimer(key, conf, index);
        } else if (index === -1) {
          stopOneTimer(key, conf);
        } else {
          // 等待其他模块修改倒计时数后触发
        }
      } else {
        window.console && console.log("can not find data for:", key, conf);
        delete timerCache[key];
      }
    });
  }

  function fillZ(a) {
    return ("0" + a).slice(-2)
  }

  var timerGuid = 1;
  var timerRunList = {};

  function runCoreTimers() {
    $.each(timerRunList, function (guid, data) {
      var lastTime = data.time.t - now();
      if (lastTime <= 0) {
        data.callback();
        return;
      }

      // 计算剩余时间
      var oneMinu = 60 * 1000;
      var oneHour = 60 * oneMinu;
      var oneDay = 24 * oneHour;
      var timeData = {
        d: parseInt(lastTime / oneDay),
        h: parseInt(lastTime % oneDay / oneHour),
        m: parseInt(lastTime % oneHour / oneMinu),
        s: Math.ceil(lastTime % oneMinu / 1000)
      };

      // 检查跟上次计算的是否一致
      if (data._last && data._last.s === timeData.s) {
        return;
      }
      // data._last = data._last || {}

      // 设置每个元素的动画
      var animate = !data._last ? {} : {
        d: data._last.d !== timeData.d,
        h: data._last.h !== timeData.h,
        m: data._last.m !== timeData.m,
        s: true
      };

      // 保存缓存
      data._last = timeData;

      // 根据剩余时间选择模板
      var tmplIndex = timeData.d > 0 ? 1 : timeData.h > 0 ? 2 : timeData.m > 0 ? 3 : 4;
      var tmpl = data.time["p" + tmplIndex] || (tmplIndex = 1, data.time.p1);

      // 检查针对该模板是否开启了动效应用
      if (!data.aniFor[tmplIndex - 1]) {
        animate = {};
      }

      // 准备双位格式化数据，并替换模板
      $.each(timeData, function (key, v) {
        var prefix = animate[key] && data.animate ? '<i class="animated ' + data.animate + '">' : '<i>';
        // 本组件的单括号占位符号
        // 兼容之前其他组件写的双括号占位符
        tmpl = tmpl.replace("{{" + key + key + "}}", prefix + fillZ(v) + "</i>")
          .replace("{{" + key + "}}", prefix + v + "</i>");
        tmpl = tmpl.replace("{" + key + key + "}", prefix + fillZ(v) + "</i>")
          .replace("{" + key + "}", prefix + v + "</i>");
      });

      // 添加icon
      if (data.icon && data.icon !== "null") {
        tmpl = '<span class="iconTimer timer-' + data.icon + '"></span>' + tmpl;
      }

      // 更新
      data.wrap.html(tmpl);
    });
  }

  function startOneTimer(key, conf, index) {
    if (!runCoreTimers.runer) {
      runCoreTimers.runer = window.setInterval(runCoreTimers, 200);
    }
    if (conf.started) {
      return;
    }
    conf.started = true;

    var myGuid = "timer" + timerGuid++;
    timerRunList[myGuid] = {
      wrap: conf.wrap,
      icon: conf.icon,
      time: conf.timers[index],
      animate: conf.animate === "null" ? null : conf.animate,
      aniFor: conf.aniFor,
      callback: function () {
        delete timerRunList[myGuid];
        var next = findValidTimer(key);
        if (next < 0) {
          stopOneTimer(key, conf);
        } else {
          startOneTimer(key, conf, next);
        }
      }
    };
    runCoreTimers();
  }

  function stopOneTimer(key, conf) {
    conf.started = true;
    if (conf.overText) {
      conf.wrap.html(conf.overText);
    } else {
      conf.wrap.closest("section").hide();
    }
    if (conf.overJump) {
      if (/^javascript:(.+)$/i.test(conf.overJump)) {
        try {
          eval(RegExp.$1);
        } catch (e) {}
      } else {
        window.location.href = conf.overJump;
        return;
      }
    }
  }

  // 暴露接口给其他模块使用
  // 非公开接口
  $.setTimerData = function (key, data) {
    var conf = key ? timerCache[key] : (function () {
      for (var k in timerCache) {
        return timerCache[k];
      }
    })();
    if (!conf || !conf.timers) {
      return;
    }
    var dataLen = data.length;
    var firstConf = conf.timers[0];
    var cf;
    for (var i = 0; i < dataLen; i++) {
      cf = conf.timers[i];
      if (cf) {
        cf.t = Number(new Date(data[i]));
      } else {
        conf.timers[i] = $.extend({}, firstConf, {
          t: Number(new Date(data[i]))
        });
      }
    }
    // 保持相同的长度
    conf.timers.length = dataLen;

    // 开始run~~~
    var index = findValidTimer(key);
    if (index >= 0) {
      startOneTimer(key, conf, index);
    } else {
      stopOneTimer(key, conf);
    }
  };
})(window.Zepto || window.jQuery);
