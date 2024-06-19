define([
  "jquery", "tools", "com/panel", "com/animate"
], function ($, tools, Panel, Animate) {
  /**
   * 按钮
   */
  return Panel.extend({
    icon: "cube",
    name: "button",
    NAME: "按钮",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "按钮类型",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "内置样式"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "自定义图片"
      }]
    }, {
      label: "*按钮文字",
      css: "layoutFor1",
      content: [{
        type: "input",
        name: "text",
        holder: "按钮上显示的文字"
      }]
    }, {
      label: "*按钮图片",
      css: "layoutFor2",
      content: [{
        type: "image",
        name: "btnImage",
        holder: "按钮图片地址"
      }]
    }, {
      label: "跳转链接",
      content: [{
        type: "input",
        name: "link",
        holder: "按钮点击跳转的地址",
        help: "输入普通链接，则点击后直接打开链接，如果输入 share:// 则会启动分享功能，或者在APP命令中输入 share 也可以启动分享。"
      }]
    }, {
      label: "APP命令",
      content: [{
        type: "cmd",
        name: "cmd",
        holder: "客户端功能命令，在项目客户端环境中不再触发跳转链接",
        help: "客户端命令需要是url形式，比如 ntescaipiao://hall ，该启动命令会在任何环境中触发，并在项目App内嵌环境中不再触发跳转链接。"
      }]
    }, {
      label: "配色",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "css",
        value: "redBtn",
        checked: true,
        text: "红色"
      }, {
        type: "radio",
        name: "css",
        value: "blueBtn",
        text: "蓝色"
      }, {
        type: "radio",
        name: "css",
        value: "greenBtn",
        text: "绿色"
      }, {
        type: "radio",
        name: "css",
        value: "yellowBtn",
        text: "黄色"
      }, {
        type: "radio",
        name: "css",
        value: "orangeBtn",
        text: "橙色"
      }]
    }, {
      label: "显示",
      content: [{
        type: "radio",
        name: "display",
        value: "all",
        checked: true,
        text: "一直显示"
      }, {
        type: "radio",
        name: "display",
        value: "showInApp",
        text: "项目App内嵌时显示"
      }, {
        type: "radio",
        name: "display",
        value: "hideInApp",
        text: "项目App内嵌时隐藏"
      }]
    }, Animate.getConf({
      aniDown: true
    }), {
      label: "其他",
      content: [{
        type: "checkbox",
        name: "radius",
        text: "大圆角"
      }]
    }, {
      label: "组件边距",
      content: [{
        type: "number",
        name: "padtop",
        min: 0,
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        min: 0,
        value: 30,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        min: 0,
        value: 24,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        min: 0,
        value: 24,
        before: "右 "
      }]
    }],
    dependCss: ["button", "animate.active"],
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    get: function () {
      var html = "";
      var data = this.save();
      var css = Animate.getCss(data);
      if (data.link || data.cmd) {
        // 自动补足分享链接
        if (data.link.indexOf("share") === 0) {
          data.link = "share://";
        }
        data.link = data.link || "javascript:;";

        // 根据类型输出html代码
        switch (data.type) {
          case "1":
            if (!data.text) {
              return "";
            }
            css.push("bigBtn");
            css.push(data.css);
            if (data.radius) {
              css.push("bigRadius");
            }
            html = '<a class="' + css.join(" ") + '"' + (data.cmd ? ' cmd="' + data.cmd + '"' : '') + ' href="' + $.safeHTML(data.link) + '">' + $.safeHTML(data.text) + "</a>";
            break;
          case "2":
            if (!data.btnImage) {
              return "";
            }
            css.push("imgBtn");
            html = '<a class="' + css.join(" ") + '"' + (data.cmd ? ' cmd="' + data.cmd + '"' : '') + ' href="' + $.safeHTML(data.link) + '"><img src="' + $.safeHTML(data.btnImage) + '"/></a>';
            break;
        }
        data.boxcss = tools.getPaddingStyle({
          top: data.padtop,
          bottom: data.padbtm,
          left: data.padl,
          right: data.padr
        });
        this.dependJS = [];
        if (data.link === "share://" || data.cmd === "share") {
          this.dependJS.push("share");
        }
        if (data.cmd || data.display !== "all") {
          this.dependJS.push("app");
        }
        html = "<section class='dis_" + data.display + "' style='" + data.boxcss + "'>" + html + "</section>";
      }
      return html;
    }
  });
});
