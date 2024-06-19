define(["jquery", "Class", "com/panel"], function ($, Class, Panel) {
  // 控制面板对象
  var linkPanel = Panel.extend({
    name: "customLink",
    NAME: "自定义链接",
    init: function (id) {
      this.callSuper({
        wrap: $("#" + id)
      });
    },
    tmpl: [{
      label: "图标",
      css: "icons",
      content: (function () {
        var radios = [],
          min = parseInt("e600", 16),
          max = parseInt("e624", 16),
          i = min;
        for (; i <= max; i++) {
          radios.push({
            type: "radio",
            name: "icon",
            value: i,
            text: "<span class='iconSet'>&#" + i + "</span>"
          });
        }
        radios.push({
          type: "radio",
          name: "icon",
          value: 0,
          checked: true,
          text: "无"
        });
        return radios;
      })()
    }, {
      label: "文案",
      content: [{
        type: "input",
        name: "text",
        holder: "显示的文案"
      }]
    }, {
      label: "链接",
      content: [{
        type: "input",
        name: "link",
        holder: "自定义链接地址",
        help: "可以配置的快捷功能有：share 点击分享；back 返回前一页（如果没有前一页，设置将无效）；top  跳回页面顶部。"
      }]
    }, {
      label: "APP命令",
      content: [{
        type: "input",
        name: "cmd",
        holder: "客户端功能命令，仅当在内嵌客户端时生效",
        help: "客户端命令需要是url形式，比如 ntescaipiao://hall ，该启动命令仅仅在内嵌客户端时生效，链接配置和App命令不会同时生效。"
      }]
    }],
    initEvent: function () {
      var radios = this.wrap.find(".icons input:radio");
      radios.click(function () {
        radios.parent().removeClass("active");
        $(this).parent().addClass("active");
      }).filter(":checked").triggerHandler("click");

      // 创建事件助手
      var eventHelper = this.eventHelper = Class.Base.Event.create("onChange");
      // 绑定元素变化监听
      this.wrap.find(":radio").click(function () {
        eventHelper.trigger("onChange");
      });
      this.wrap.find(":text").bind("input", function () {
        eventHelper.trigger(500, "onChange"); // 设置500ms缓冲保护
      });
    },
    get: function () {
      var conf = this.save();
      delete conf.NAME;
      conf.css = "iconSet";
      return conf;
    }
  });

  var guid = 1;

  // 返回一个控制面板对象
  function getOnePanel() {
    var myId = "customLinkBox" + guid++,
      floatPanelBox = $('<div id="' + myId + '" class="customLinkBox hide3"></div>').appendTo(document.body),
      panel = linkPanel.create(myId);
    return {
      showFor: function (dom, initData, fn) {
        var pos = $(dom).offset(),
          h = $(dom).outerHeight() + 3,
          panelH = floatPanelBox.removeClass("atop").outerHeight(),
          top = pos.top + h;
        if (top + panelH > $(window).height()) {
          top = pos.top - panelH - 3;
          floatPanelBox.addClass("atop");
        }
        floatPanelBox.removeClass("hide3").css({
          left: pos.left,
          top: top
        });

        // 初始化数据
        initData && panel.load(initData);

        // 绑定事件处理
        panel.eventHelper.bind("onChange", function () {
          fn && fn(panel.get());
        });

        // 绑定关闭事件
        $(document).mousedown($.proxy(this.hide, this));
        floatPanelBox.mousedown(function (e) {
          e.stopPropagation();
        });
      },
      hide: function () {
        floatPanelBox.removeClass("atop").addClass("hide3").removeAttr("style");
        $(document).unbind("mousedown", this.hide);
        panel.eventHelper.unbind("onChange");
      }
    };
  }

  // jquery扩展
  $.fn.customLink = function (fn) {
    return this.each(function () {
      if (this.customLinkBind) {
        return;
      }
      this.customLinkBind = true;
      var myPanel, me = $(this);
      me.click(function () {
        if (!myPanel) {
          myPanel = getOnePanel(); // 初始化控制面板
        }
        myPanel.showFor(this, me.data("value"), function (data) {
          // 每次修改都会收到通知，需要存回data-value
          me.data("value", data);
          fn && fn.call(me[0], data);
        });
      });
      fn && fn.call(me[0], me.data("value"));
    });
  };

  // 返回工具api
  var api = {
    getText: function (data) { // 获取链接文本
      if (!data || data.icon === undefined) {
        return "";
      }
      var code = Number(data.icon),
        text = data.text;
      if (!code && !text) {
        return "";
      }
      return code ? '<span class="' + data.css + '">&#' + code + '</span>' + text : text;
    },
    get: function (data, extCss, extStyle) { // 获取完整的html代码
      var url = "",
        js = "",
        text = api.getText(data);
      if (!text) {
        return "";
      }
      switch (data.link.toLowerCase()) { // 检查内置的快捷命令
        case "share":
          url = "share://";
          break;
        case "back":
          js = "history.back()";
          break;
        case "top":
          js = "window.scrollTo(window.scrollX,0)";
          break;
        default:
          url = data.link;
      }
      // 返回html代码
      return ['<a',
        extCss ? ' class="' + extCss + '"' : '',
        // extStyle ? ' style="'+ extStyle +'"' : '',
        ' href="', url || "javascript:;", '"',
        js ? ' onclick="' + js + '"' : '',
        data.cmd ? ' cmd="' + data.cmd + '"' : '',
        '>', text, '</a>'
      ].join("");
    },
    getDepends: function () { // 分析依赖
      var arg = Array.prototype.slice.call(arguments, 0),
        css, js;
      $.each(arg, function (i, data) {
        if (!data) {
          return;
        }
        if (data.cmd || /^share/i.test(data.link)) { // 有cmd命令
          js = js || ["zepto", "appcore"];
        }
        if (data.icon) {
          css = css || ["customLink"];
        }
      });
      return {
        js: js,
        css: css
      };
    }
  };
  return api;
});
