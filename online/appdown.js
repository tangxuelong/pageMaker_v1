/**
 * app下载链接监控
 */
(function ($) {
  var downloadCache = window.downloadCache = window.downloadCache || {};
  var ua = navigator.userAgent.toLowerCase();
  var os = /(?:iphone|ipad|ipod)/.test(ua) ? "ios" : /(?:android|adr )/.test(ua) ? "android" : "other";
  var wx = ua.indexOf("micromessenger") > 0;
  var findDownloadInfo = function (key) {
    var conf = downloadCache[key];
    var ret = {};
    var uaLikeUrl = ua.replace(/ /g, "&").replace(/\//g, "=");
    // 极简替换函数，仅供内部使用
    function fillUrl(url, key, value) {
      return (url || "").replace(/\{key\}/i, key).replace(/\{value\}/i, value);
    }
    // 检测渠道信息
    // 2017年04月01日 增加UA渠道信息识别和处理
    $.each(conf.from, function (i, obj) {
      var fromInfo, hitObj, key, value;
      // 将多组的from配置进行拆分
      $.each(obj.from.split(","), function (i, from) {
        // from信息命中
        if (/^[^=]+=[^=]+$/.test(from)) {
          fromInfo = from.split("=");
          key = fromInfo[0];
          value = URL.getPara(key);
        } else {
          // 否则当做UA渠道信息
          fromInfo = from.split("/");
          key = fromInfo[0];
          value = URL.getParaFromString(uaLikeUrl, key);
        }
        // 匹配到了，则停止检测
        if (value === fromInfo[1]) {
          hitObj = true;
          ret.apk = fillUrl(obj.apk, key, value);
          ret.ios = fillUrl(obj.ios, key, value);
          ret.bao = fillUrl(obj.bao, key, value);
          ret.cmd = fillUrl(obj.cmd, key, value);
          return false;
        }
      });
      if (hitObj) {
        return false;
      }
    });
    ret.apk = ret.apk || conf.apk;
    ret.ios = ret.ios || conf.ios;
    ret.bao = ret.bao || conf.bao;
    ret.cmd = ret.cmd || conf.cmd;
    ret.tip = conf.tip;
    ret.ignorebao = Boolean(conf.ignorebao);
    ret.lownet = Boolean(conf.lownet);
    return ret;
  };
  var showDownloadTip = function (tipImg) {
    var html = ['<div id="get-app-tip">'];
    if (tipImg) {
      html.push('<div><img src="' + tipImg + '" alt="请在浏览器中查看"/></div>');
    } else {
      html.push('<div><span>请<b>在浏览器中打开</b>查看</span></div>');
    }
    html.push('</div>');
    hideDownloadTip();
    $(document.body).prepend(html.join(''));
    $("#get-app-tip").click(hideDownloadTip);
  };
  var hideDownloadTip = function () {
    $("#get-app-tip").remove();
  };
  var detectAutoDownload = function () {
    $.each(downloadCache, function (key, conf) {
      var autoInfo = conf.auto.split("=");
      if (autoInfo.length > 1 && URL.getPara(autoInfo[0]) === autoInfo[1]) {
        $.download(key);
        return false;
      }
    });
  };

  // 脚本入口
  $.download = function (key) {
    if (!key || !downloadCache[key]) {
      return;
    }
    var downInfo = findDownloadInfo(key);
    var ret;
    // 非ios且低网速下进行app下载确认
    if (os !== "ios" && window.__NET === 1 && downInfo.lownet) {
      if (!window.confirm("下载将消耗一定流量，点击确认继续。")) {
        return;
      }
    }
    if (wx) {
      // 在微信内下载，优先应用宝
      // 在IOS微信内，应用宝可以自动跳转到app store
      // 在安卓微信内，应用宝引导用户下载应用宝，有点霸道
      var jump2bao = os === "ios" || !downInfo.ignorebao;
      if (downInfo.bao && jump2bao) {
        // 通过事件通知来插入跳转前的逻辑
        ret = $(document.body).triggerHandler("pageMaker.download", [key, function () {
          window.location.href = downInfo.bao;
        }]);
        if (ret !== false) {
          window.location.href = downInfo.bao;
        }
      } else {
        // 否则弹层提示在浏览器
        showDownloadTip(downInfo.tip);
      }
      return;
    }
    var coreAct = function () {
      // 开始下载
      detectAndDownload(
        // 启动命令
        downInfo.cmd,
        // 否则按系统跳转，默认是安卓包
        os === "ios" ? downInfo.ios : downInfo.apk
      );
    };
    // 通过事件通知来插入跳转前的逻辑
    ret = $(document.body).triggerHandler("pageMaker.download", [key, coreAct]);
    if (ret !== false) {
      coreAct();
    }
  };

  function sendCmd(cmd) {
    // 默认iframe方式发送命令
    var iframe = document.getElementById("__cmdFrame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "__cmdFrame";
      document.body.appendChild(iframe);
      iframe.style.display = "none";
    }
    iframe.src = cmd;
  }

  function detectAndDownload(cmd, url) {
    if (cmd && os === "android") {
      var t1 = Number(new Date());
      sendCmd(cmd);
      window.setTimeout(function () {
        if (Number(new Date()) - t1 < 1000) {
          window.location.href = url;
        }
      }, 500);
    } else {
      window.location.href = url;
    }
  }

  $(function () {
    // 检测是需要更改wx标识
    wx = wx || (window.isPreview && window.likeWX);

    // 增加meta信息以供Safari识别提示App下载或启动
    $.each(downloadCache, function (key, conf) {
      var downInfo = findDownloadInfo(key);
      if (conf.safari && downInfo.ios && /id(\d+)/i.test(downInfo.ios)) {
        $(document.head).append('<meta name="apple-itunes-app" content="app-id=' + RegExp.$1 + '" />');
        return false;
      }
    });

    // 检测url参数是否要求自动下载
    // 兼容章鱼系统发送统计消息
    if (window.trackerCallbacks) {
      window.trackerCallbacks.push(detectAutoDownload);
    } else {
      detectAutoDownload();
    }

    // 绑定页面监听
    $(document.body).delegate('[href^="download://"],[data-href^="download://"]', 'click', function (e) {
      var me = $(this);
      var id = (me.attr("data-href") || me.attr("href")).split("download://")[1] || "";
      id && $.download(id);
      e && e.preventDefault();
    });
    // 许多手机浏览器都对自定义协议支持不好，这里统一处理转移到 data-href 上去
    $('[href^="download://"]').each(function () {
      var me = $(this);
      me.attr("data-href", me.attr("href"));
      me.attr("href", "javascript:;");
    });
  });
})(window.Zepto || window.jQuery);
