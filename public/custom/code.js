define([
  "jquery", "com/codemirror", "com/panel", "format", "LS"
], function ($, CodeMirror, Panel, format, LS) {
  'use strict';
  return {
    init: function(wrap) {
      $(wrap).empty().html('<textarea name="fulljs"></textarea>');
      // 索引textarea
      var textarea = $("[name=fulljs]", wrap);
      // 初始化编辑器
      this.jsEditor = CodeMirror.fromTextArea(textarea[0], {
        lineNumbers: true,
        mode: "javascript",
        theme: "mbo"
      });
      // 恢复之前保存的数据
      var cacheData = LS.get("cusCode");
      if (cacheData) {
        this.setCode(cacheData);
      }
      // 动态保存代码
      this.jsEditor.on("changes", function(cm) {
        LS.set("cusCode", cm.getValue());
      });
    },
    setHeight: function(h) {
      this.jsEditor.setSize("auto", h);
    },
    setTmpl: function (tmpl) {
      if (!tmpl) {
        return;
      }
      this.tmpl = tmpl;
      if (!this.jsEditor.getValue()) {
        this.setCode(tmpl);
      }
    },
    setCode: function(code) {
      code && this.jsEditor.setValue(code);
    },
    reset: function() {
      LS.remove("cusCode");
      this.setCode(this.tmpl);
    },
    get: function() {
      var baseCode = this.jsEditor.getValue();
      // 替换占位符
      var holderData = {
        itemName: "error",
        itemTextName: "Error!"
      };
      return format(baseCode, holderData);
    }
  }
});
