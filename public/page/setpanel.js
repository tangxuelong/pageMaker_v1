// 设置面板
define([
  "jquery", "com/panel", "com/set", "item/code.lib", "custom/set", "com/gconf"
], function ($, Panel, SET, CodeLib, Custom, gConf) {
  var customOnline = '/custom/';
  return Panel.extend({
    name: "set",
    NAME: "设置",
    init: function (config) {
      this.callSuper(config);
    },
    tmpl: [{
      label: "拾色器",
      content: [{
        type: "radio",
        name: "colorPicker",
        value: 0,
        text: "系统自带"
      }, {
        type: "radio",
        name: "colorPicker",
        checked: true,
        value: 1,
        text: "基础版"
      }, {
        type: "radio",
        name: "colorPicker",
        value: 2,
        text: "高级版"
      }]
    }, {
      label: "折叠交互",
      content: [{
        type: "checkbox",
        name: "panelHide",
        value: 1,
        text: "面板自动折叠",
        checked: true
      }]
    }, {
      label: "全局动效",
      content: [{
        type: "radio",
        name: "autoAnimate",
        value: 0,
        text: "不自动追加",
        checked: true
      }, {
        type: "radio",
        name: "autoAnimate",
        value: 1,
        text: "发布前自动追加"
      }]
    }, gConf.func.customCodeLib ? {
      label: "自定义库",
      content: [{
        type: "text",
        text: "已经保存了<span id='cusLibNumber'>0</span>个自定义库（<a href='#showSubPanel:cusLibConf'>修改</a>）"
      }]
    } : null, gConf.func.customItem ? {
      label: "私有组件",
      content: [{
        type: "text",
        text: "已经保存了<span id='cusItemNumber'>0</span>个私有组件（<a href='#showSubPanel:cusItemConf'>修改</a> | <a target='_blank' href='" + customOnline + "'>在线创建</a>）"
      }]
    } : null],
    addSubPanel: function (key, domOrhtml, callbacks) {
      var subs = this.__subPanel = this.__subPanel || {};
      var main = this.__mainPannel || this.wrap.parent();
      main.after('<div id="' + key + '" class="setting-sub-pannel setting-hide-left"></div>');
      subs[key] = $("#" + key).html(domOrhtml);
      subs[key].__callbacks = callbacks || {};
    },
    showSubPanel: function (key) {
      var com = this;
      var sub = this.__subPanel[key];
      var main = this.__mainPannel;
      var old = this.__onShowSubPanel;
      if (!sub || this.__panelLock) {
        return;
      }
      this.__panelLock = true;

      // 跟子模板切换
      if (old) {
        old.addClass("animate");
        sub.addClass("animate");
        // 调用callback
        (old.__callbacks.hide || $.noop)();
        (sub.__callbacks.show || $.noop)();
        window.setTimeout(function () {
          old.addClass("setting-hide-left");
          sub.removeClass("setting-hide-left");
          window.setTimeout(function () {
            old.removeClass("animate");
            sub.removeClass("animate");
            com.__panelLock = false;
            com.__onShowSubPanel = sub;
          }, 600);
        }, 0);
        return;
      }

      // 跟主模板切换
      main.addClass("animate");
      sub.addClass("animate");
      // 调用callback
      (sub.__callbacks.show || $.noop)();
      window.setTimeout(function () {
        main.addClass("setting-hide-right");
        sub.removeClass("setting-hide-left");
        window.setTimeout(function () {
          main.removeClass("animate");
          sub.removeClass("animate");
          com.__panelLock = false;
          com.__onShowSubPanel = sub;
        }, 600);
      }, 0);
    },
    showMainPanel: function () {
      var com = this;
      var main = this.__mainPannel;
      var old = this.__onShowSubPanel;
      if (!old) {
        main.removeClass("setting-hide-right");
        return;
      }
      com.__panelLock = true;
      main.addClass("animate");
      old.addClass("animate");
      // 调用callback
      (old.__callbacks.hide || $.noop)();
      window.setTimeout(function () {
        main.removeClass("setting-hide-right");
        old.addClass("setting-hide-left");
        window.setTimeout(function () {
          main.removeClass("animate");
          old.removeClass("animate");
          com.__panelLock = false;
          com.__onShowSubPanel = null;
        }, 600);
      }, 0);
    },
    updateSubPanelData: function () {
      // 更新codeLib配置
      $("#cusLibNumber").text(CodeLib.getCusLib().length);
      // 更新私有组件配置
      var items = SET.get("items");
      $("#cusItemNumber").text(items ? items.split("\n").length : 0);
    },
    initEvent: function () {
      // 基础设置
      var com = this;
      var main = this.__mainPannel = this.wrap.parent();
      main.parent().width(main.width());

      // 映射点击
      this.wrap.find("a").click(function (e) {
        var method, paras;
        if (/#([^:]+):(.+)$/.test(this.hash)) {
          method = RegExp.$1;
          paras = RegExp.$2.split(",");
          if (com[method]) {
            com[method].apply(com, paras);
            e.preventDefault();
          }
        }
      });

      // 增加一个子面板:自定义库
      if (gConf.func.customCodeLib) {
        this.addSubPanel("cusLibConf", "<textarea class='subPanelTextarea' placeholder='自定义codeLib，格式：\n#id>show_text\njs:jsPath\ncss:cssPath\n例如:\n#Zepto>Zepto($)\njs://path/to/zepto.js' id='codeLibArea'></textarea>", {
          show: function () {
            $("#codeLibArea").val(SET.get("libs"))[0].focus();
          },
          save: function (panel) {
            SET.save({
              libs: CodeLib.stringify(CodeLib.parse($("#codeLibArea").val()))
            });
            com.updateSubPanelData();
          }
        });
      }

      // 增加一个子面板:私有组件
      if (gConf.func.customItem) {
        this.addSubPanel("cusItemConf", "<textarea class='subPanelTextarea' placeholder='私有组件，每行一条组件js文件，js文件需要按照固定格式编写。' id='cusItemArea'></textarea>", {
          show: function () {
            $("#cusItemArea").val(SET.get("items"))[0].focus();
          },
          save: function (panel) {
            SET.save({
              items: Custom.parse($("#cusItemArea").val())
            });
            com.updateSubPanelData();
          }
        });
      }
      // 保存一个修改前的副本
      window.setTimeout(function () {
        com.__old_setting = com.save();
      }, 1);
      this.updateSubPanelData();
    },
    get: function (btnId) {
      if (this.__onShowSubPanel) { // 有子面板
        var ok = !btnId ? 0 : (this.__onShowSubPanel.__callbacks.save || $.noop)(this.__onShowSubPanel);
        if (ok !== false) {
          this.showMainPanel();
        }
        return false;
      }
      var conf = this.save();
      var old = this.__old_setting;
      // 对比是否需要刷新页面
      $.each(["colorPicker"], function (i, key) {
        if (old[key] !== conf[key]) {
          conf.needReload = true;
        }
      });
      delete conf.NAME;
      return conf;
    }
  });
});
