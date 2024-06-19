define([
  'jquery', "tools", "Class", "com/panel", "LS", "./core.act", "./gconf", "./core.tmpl",
  "format"
], function ($, tools, Class, Panel, LS, coreAct, gConf, PageTmpl) {
  'use strict';
  // 预览
  function preview(callback) {
    var META = Class.Page.Panel.get("pageMetaInfo");
    if (!META) {
      $.isFunction(callback) && callback();
      return;
    }
    // 用于构造预览数据的主对象
    var data = META.get();
    // 先保存一次结果
    LS.set(gConf.lsKey, coreAct.saveString());
    // 读取页面内容配置
    coreAct.readFromPage()
      .then(function (pageInfo) {
        // 处理js文件
        var dependJS = pageInfo.dependJS || [];
        var html = [];
        $.each(dependJS, function (i, js) {
          html.push('<script src="' + js + '"><' + '/script>');
        });
        data.jsFiles = html.join("");
        return pageInfo;
      }).then(function (pageInfo) {
        // 处理css文件
        var dependCss = pageInfo.dependCss || [];
        var html = [];
        // 输出html代码
        $.each(dependCss, function (i, css) {
          html.push('<link rel="stylesheet" href="' + css + '"/>');
        });
        // 检查项目私有样式(表)
        var privateCss = gConf.func.usePrivateCss ? gConf.func.privateCss : '';
        if (/^(?:https*:\/\/|\/\/)/i.test(privateCss)) {
          html.push('<link rel="stylesheet" href="' + privateCss + '"/>');
        } else if (privateCss) {
          html.push('<style mini>' + privateCss + '</style>');
        }
        // 写入样式字段
        data.cssFiles = html.join("");
        return pageInfo;
      }).then(function (pageInfo) {
        // 页面html内容
        data.pageContent = pageInfo.pageContent;
        // 更新内容
        var html = $.format(PageTmpl, data);
        update(html);
        $.isFunction(callback) && callback(html);
      }).catch(function (e) {
        $.isFunction(callback) && callback();
        console.log("preview error:", e);
      });
  }

  // 更新iframe预览
  let pageCache;

  function update(str, notDealErr) {
    if (!str || str === pageCache) {
      return;
    }
    pageCache = String(str || '');
    try {
      // 创建iframe
      var iframe = $("#previewIframe");
      if (!iframe[0]) {
        $(".iframe-wrap").html('<iframe src="about:blank" id="previewIframe" frameborder="0"></iframe>');
      }
      var win = $("#previewIframe")[0].contentWindow;
      // 写入预览标记位
      win.isPreview = true;
      win.document.write(pageCache);
      win.document.write("<style>body,html{overflow:hidden}</style>");
      win.document.write("<script src='/online/iscroll.js'></script>");
      win.document.write("<script src='/online/previewHelper.js'></script>");
      win.document.close();
    } catch (e) {
      console.log("update error:", e);
      if (notDealErr !== true) {
        $(".iframe-wrap").empty();
        update(str, true);
      }
    }
  }

  // 延迟预览函数
  var delayPreview300 = $.getProtectedFn(preview, "@preview", 300);
  var delayPreview100 = $.getProtectedFn(preview, "@preview", 100);
  // 面板消息
  Panel.msg
    .bindMsg("panel.create", delayPreview100)
    .bindMsg("panel.change", delayPreview100)
    .bindMsg("panel.remove", delayPreview100);

  // 对外暴露的接口
  return {
    watch(wrap) {
      if (!wrap) {
        return;
      }
      $(wrap)
        .delegate("input:text", "input", delayPreview300)
        .delegate("input:text", "keyup", delayPreview300)
        .delegate("textarea", "input", delayPreview300)
        .delegate("textarea", "keyup", delayPreview300)
        .delegate("input:radio,input:checkbox", "click", delayPreview100);
    },
    preview: preview,
    update: update,
    updateFromCache() {
      var lsData = LS.get(gConf.lsKey);
      if (lsData) {
        try {
          coreAct.load(JSON.parse(lsData), true);
        } catch (e) {
          console.log("导入数据出错！", e);
          coreAct.clear();
        }
      } else {
        coreAct.clear();
      }
    },
    getPageHTML(getLatestCache) {
      if (getLatestCache) {
        return new Promise(function (resolve) {
          preview(resolve);
        });
      }
      // 提供给发布接口调用的获取html代码的方法
      return pageCache;
    }
  }
});
