(function () {
  var getUrlInfo = function (url) {
    var arr = url.replace(/#.*$/, "").split("?");
    return {
      para: arr.length > 1 ? arr[1] : null,
      path: arr[0],
      mpath: arr[0].replace(/^https*:/i, "")
    };
  };

  /**
   * 核心跳转函数
   */
  function jump(url, notJumpWhenPreivew) {
    if (!url || (window.isPreview && notJumpWhenPreivew)) {
      return;
    }
    // 如果是脚本，则执行
    if (/^javascript:/i.test(url)) {
      try {
        (new Function(url.slice(11)))();
      } catch (e) {}
      return;
    }
    // 如果当前页已经是要跳转的页面，则检查是否需要跳转
    var target = getUrlInfo(url);
    var current = getUrlInfo(document.URL);
    // 已经是当前页的时候，不再跳转
    if (target.mpath.toLowerCase() === current.mpath.toLowerCase()) {
      return;
    }
    // 如果目标URL没有参数，则将当前的参数带上
    if (!target.para && current.para) {
      url = url + "?" + current.para;
    }
    // 刷掉当前页面
    window.location.replace(url);
  }
  // 极简替换函数，仅供内部使用
  function fillUrl(url, key, value) {
    return (url || "").replace(/\{key\}/i, key).replace(/\{value\}/i, value);
  }
  // 不同操作系统跳转
  window.jumpForSys = function (ops) {
    if (!window.__OS) {
      return;
    }
    jump(ops[window.__OS], ops.pre);
  };
  // 用户登录跳转
  window.jumpForUser = function (ops) {
    var u = window.__USER;
    if (!u) {
      return;
    }
    // 没有痕迹的新用户
    if (u.ursId === null) {
      return jump(ops.newu, ops.pre);
    }
    // 有登录痕迹，则判断是否登录
    if (u.login) {
      return jump(ops.yes, ops.pre);
    }

    // 没有登录
    return jump(ops.no, ops.pre);
  };
  // 渠道信息跳转
  window.jumpForSrc = function (ops) {
    if (!window.URL.getPara || !Array.prototype.forEach) {
      return;
    }
    var ua = navigator.userAgent.replace(/ /g, "&").replace(/\//g, "=");
    var targetUrl;
    ops.fr.forEach(function (str, index) {
      if (targetUrl) {
        return;
      }
      // 识别多组渠道信息
      str.split(",").forEach(function (conf) {
        var data, key, value;
        if (conf.indexOf("=") > 0) {
          // 如果是URL参数
          data = conf.split("=");
          key = data[0];
          value = URL.getPara(key);
        } else if (conf.indexOf("/") > 0) {
          // 如果是分析UA
          data = conf.split("/");
          key = data[0];
          value = URL.getParaFromString(ua, key);
        }
        // 如果命中了设置，则将跳转的url地址保存以备后面跳转和处理
        if (data && data[1] === value) {
          targetUrl = targetUrl || fillUrl(ops.url[index], key, value);
        }
      });
    });
    // 处理url地址跳转
    jump(targetUrl, ops.pre);
  };
  // 内嵌访问跳转
  window.jumpForWebview = function (ops) {
    if (!window.__ENV) {
      return;
    }
    var url = window.inMyApp ? ops.app : ops[window.__ENV] || ops.x;
    jump(url, ops.pre);
  };
})();
