define([
  'jquery', 'LS', "com/core", "com/gconf"
], function ($, LS, Core, gConf) {
  'use strict';
  return function () {
    // 检查内容缓存是否过期
    var pubPath = LS.get("lastPublish") || "";
    // 需要是一个完整的url路径
    if (!/^https*:\/\//.test(pubPath)) {
      return;
    }
    // 去掉文件名，只保留路径即可
    pubPath = pubPath.replace(/\/[^/]+$/, "/");
    // 获取最新配置
    $.ajax("/api/load/config?path=" + encodeURIComponent(pubPath)).then(function (json) {
      if (json.err) {
        console.warn("Error JSON Data:", json.data);
        return;
      }
      var data;
      try {
        data = JSON.parse(json.data);
      } catch (e) {
        console.warn("JSON内容格式化错误:", json.data);
      }
      // 如果更新获取到的数据正确，则跟缓存数据对比
      if ($.isArray(data) && json.data !== LS.get(gConf.lsKey)) {
        $.dialog({
          title: "本地缓存已过期",
          content: "注意！！当前浏览器中缓存的页面数据已经过期。<br>继续使用可能会造成页面误覆盖！",
          button: ["*立即更新", "清空缓存"]
        }).onBtnClick(function (btnId) {
          if (btnId) { // 立即更新
            window.setTimeout(function () {
              Core.load(data);
            }, 300);
          } else { // 清空缓存
            LS.remove("editFld");
            LS.remove("lastPublish");
            Core.clear();
          }
        })
      }
    });
  }
});
