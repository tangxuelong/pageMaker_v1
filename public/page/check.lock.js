define([
  'jquery', "LS", 'dialog'
], function ($, LS) {
  'use strict';
  // 检查页面锁，同一个浏览器仅仅能打开一个页面
  return function (fn) {
    return new Promise(function (resolve, reject) {
      if (!LS.get("_pageMaker_lock")) {
        return resolve();
      }
      $.dialog({
        title: null,
        css: "iDialogAlert",
        content: [
          "同一个浏览器只能同时编辑一个页面！",
          "您可以：",
          "1. 关闭已经打开的页面",
          "2. 换一个浏览器",
          "3. 确认程序判断有误，点击《强制使用》按钮"
        ].join("<br>"),
        button: ["强制使用", "*刷新页面"]
      }, function (btnId) {
        if (btnId) {
          resolve();
        } else {
          window.location.reload(true);
        }
      });
    }).then(function () {
      LS.set("_pageMaker_lock", Number(new Date()));
      $(window).bind("beforeunload", function () {
        LS.remove("_pageMaker_lock");
      });
    });
  }
});
