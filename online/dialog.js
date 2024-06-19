/**
 * 对话框组件包装接口
 */
(function ($) {
  if (!$.dialog) {
    return;
  }
  // 增加一个配置注册接口
  var dialogCache = {};
  var dialogOrder = [];
  window.addOneDialog = function (id, config) {
    if (id && config) {
      dialogCache[id] = config;
      dialogOrder.push(id);
    }
  };

  // 设置配置缓存入口
  var cache = {};
  var preloadImgs = function (wrap, fn) {
    var imgs = $(wrap).find("img");
    var n = imgs.length;
    var i = 0;
    var check = function () {
      i++;
      if (n === i) {
        window.setTimeout(fn, 50);
      }
    };
    if (!n) {
      return fn();
    }
    imgs.each(function () {
      var url = $(this).attr("src");
      if (cache[url]) {
        return check();
      }
      var key = "img" + Math.random().toString(16).slice(2);
      var img = window[key] = new Image();
      img.onerror = img.onload = function () {
        cache[url] = true;
        window[key] = null;
        return check();
      };
      img.src = url;
    });
  };

  // 增加的新api
  $.showDialog = function (dialogId, retry) {
    var config = dialogCache[dialogId];
    var btns;
    var wrap = document.getElementById("dialog-" + dialogId);
    if (!config || !wrap) {
      if (!retry && window.isPreview) {
        console.log("对话框(" + dialogId + ")未找到！", retry ? "again" : "");
        window.setTimeout(function () {
          $.showDialog(dialogId, true);
        }, 200);
      }
      return false;
    }

    preloadImgs(wrap, function () {
      switch (config.type) {
        case "1": // 普通弹窗
        case "2": // 确认弹窗
          btns = [config.cfm[0]];
          if (config.type === "2") {
            btns.push(config.csl[0]);
          }
          $.dialog({
            type: "insert",
            css: "fs" + config.fs,
            content: "#dialog-" + dialogId,
            title: config.title || null,
            animate: config.ani,
            button: btns,
            check: function (id) {
              var url = id ? config.cfm[1] : config.csl[1];
              if (!url) {
                return;
              }
              if (window.inMyApp) {
                window.setTimeout(function () {
                  window.location.href = url;
                }, 220);
              } else {
                window.location.href = url;
              }
            },
            init: function () {
              if (config.cfm[2]) {
                $(".iDialogBtn[rel='1']", this).attr("cmd", config.cfm[2]);
              }
              if (config.csl && config.csl[2]) {
                $(".iDialogBtn[rel='0']", this).attr("cmd", config.csl[2]);
              }
              // 检查最大高度
              var win = $(window);
              var padLR = win.width() - $(this).width();
              var padTB = win.height() - $(this).height();
              var body = $(".iDialogBody", this);
              if (padTB < padLR) { // 如果高度超限制
                body.height(body.height() - padLR + padTB).css("overflow", "auto");
              }
            }
          });
          break;
        case "3": // 广告
          $.dialog({
            type: "agent",
            css: "iDialogAgent",
            content: "#dialog-" + dialogId,
            animate: config.ani,
            init: function (dialog) {
              $("#dialog-" + dialogId).find("a").unbind().click(function () {
                dialog.close();
              });
              // 设置背景透明
              if (config.trans) {
                dialog.cache.layoutDom.addClass("iOpacityZero");
              }
            },
            timeout: config.t
          });
          break;
        case "4": // toast
          $.dialog({
            type: "insert",
            content: "#dialog-" + dialogId,
            title: null,
            css: "iDialogInfo",
            animate: 1,
            timeout: config.t,
            button: []
          });
          break;
      }
    });
  };

  // 页面加载完毕后查找所有的对话框元素
  $(function () {
    var LS = window.localStorage || {
      getItem: function () {},
      setItem: function () {}
    };

    // 处理自动弹出逻辑
    // 每天仅仅自动弹出一个弹窗
    (function () {
      var popLog = (LS.getItem("pm_dlg_pop_log") || "").split("#");
      var now = new Date();
      var today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join("-");
      var popList = [];
      var justShowOnce = [];

      // 不是今天弹出的，则准备检查自动弹窗设置
      if (popLog[0] !== today || window.isPreview) {
        // 取出弹窗循环列表
        $.each(dialogOrder, function (index, id) {
          var config = dialogCache[id];
          // 特殊处理预览
          if (window.isPreview) {
            config.pre && popList.push(id);
            return;
          }
          // 没有显示过的并且需要自动显示的，则插入队列
          // 设置了循环弹出的，继续插入队列
          if ((config.auto && !LS.getItem(id)) || config.loop) {
            popList.push(id);
            config.auto && justShowOnce.push(id);
          }
        });

        // 找到弹出队列后，开始分析弹出目标窗口
        if (!popList.length || !popList.indexOf) {
          return;
        }
        var lastPop = popLog[1] || null;
        var showIndex = (popList.indexOf(lastPop) + 1) % popList.length;
        var showId = popList[showIndex];
        // 弹出窗口
        $.showDialog(showId);
        // 写入标记
        if (!window.isPreview) {
          // 如果设置了仅仅弹出一次，则标记，下次不再弹
          justShowOnce.indexOf(showId) > -1 && LS.setItem(showId, "y");
          LS.setItem("pm_dlg_pop_log", today + "#" + showId);
        }
      }
    })();

    // 处理点击代理
    $(document.body).delegate('[href^="dialog://"],[data-href^="dialog://"]', 'click', function (e) {
      var me = $(this);
      var id = (me.attr("data-href") || me.attr("href")).split("dialog://")[1] || "";
      id && $.showDialog(id);
      e && e.preventDefault();
    });
    // 转移节点内容，防止部分浏览器认为访问了一个未知的网络协议
    $('[href^="dialog://"]').each(function () {
      var me = $(this);
      me.attr("data-href", me.attr("href"));
      me.attr("href", "javascript:;");
    });
  });
})(window.Zepto || window.jQuery);
