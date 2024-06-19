// 配置模块
define(["jquery", "LS"], function ($, LS) {
  'use strict';
  return {
    get: function (key) {
      var defConf = {
        autoStatic: "1",
        colorPicker: "1",
        panelHide: true,
        itemTabList: true,
        autoRemind: true
      };
      var set = $.extend({}, defConf, JSON.parse(LS.get("setting") || "{}"));
      if (!key) {
        return set;
      }
      return set[key] || "";
    },
    save: function (conf, value) {
      var oldSet = this.get();
      var c = {};
      if (conf && typeof conf === "string" && value !== undefined) {
        c[conf] = value;
        conf = c;
      }
      if (conf) {
        var newSet = $.extend(this.get(), conf);
        LS.set("setting", JSON.stringify(newSet));
        // 对比配置
        var changed = false;
        for (var k in oldSet) {
          if (oldSet[k] !== newSet[k]) {
            $.sendMsg("pageMaker.setting." + k, newSet[k], oldSet[k]);
            changed = true;
          }
        }
        if (changed) {
          $.sendMsg("pageMaker.setting.all", newSet, oldSet);
        }
      }
    },
    when: function (key, fn) {
      if (!key) {
        return;
      }
      if (!fn && key) {
        fn = key;
        key = "all";
      }
      $.bindMsg("pageMaker.setting." + key, fn);
    }
  }
});
