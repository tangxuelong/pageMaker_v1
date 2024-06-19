define([
  "jquery", "tools", "com/panel", "com/animate"
], function ($, tools, Panel, Animate) {
  /**
   * 返回顶部
   */
  return Panel.extend({
    icon: "arrow-up",
    name: "entry",
    NAME: "便捷入口",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "功能",
      content: [{
        type: "radio",
        name: "func",
        value: 1,
        checked: true,
        text: "返回顶部",
        info: "预览状态下图标不消失"
      }, {
        type: "radio",
        name: "func",
        value: 2,
        text: "悬浮球"
      }, {
        type: "radio",
        name: "func",
        value: 3,
        text: "悬浮图"
      }]
    }, {
      label: "外观",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "topIconCode",
        value: parseInt('ea32', 16),
        checked: true,
        text: "粗箭头"
      }, {
        type: "radio",
        name: "topIconCode",
        value: parseInt('ea3a', 16),
        text: "细箭头"
      }]
    }, {
      label: "预置图标",
      css: "layoutFor2",
      content: ["e902", "e935", "e997", "e906", "e994", "eaa0", "ea82"].map(function (code, i) {
        return {
          type: "radio",
          name: "linkIconCode",
          checked: i === 0,
          value: parseInt(code, 16),
          text: "<span class='easyEntry'>&#" + parseInt(code, 16) + "</span> "
        }
      })
    }, {
      label: "悬浮图片",
      css: "layoutFor3",
      content: [{
        type: "image",
        name: "flimg",
        size: 200,
        holder: "图片将被缩小到 200 像素宽以内"
      }]
    }, {
      label: "跳转链接",
      css: "layoutFor2 layoutFor3",
      content: [{
        type: "url",
        name: "link",
        holder: "点击后跳转的地址"
      }]
    }, {
      label: "APP命令",
      css: "layoutFor2 layoutFor3",
      content: [{
        type: "cmd",
        name: "cmd",
        holder: "客户端功能命令，在项目客户端环境中不再触发跳转链接",
        help: "客户端命令需要是url形式，比如 ntescaipiao://hall ，该启动命令会在任何环境中触发，并在项目App内嵌环境中不再触发跳转链接。"
      }]
    }, {
      label: "配色",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "radio",
        name: "colorTheme",
        value: 1,
        checked: true,
        text: "黑底灰标"
      }, {
        type: "radio",
        name: "colorTheme",
        value: 2,
        text: "灰底黑标"
      }, {
        type: "radio",
        name: "colorTheme",
        value: 3,
        text: "红底白标"
      }]
    }, {
      label: "外框形状",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "radio",
        name: "sharp",
        value: 1,
        text: "圆角方块"
      }, {
        type: "radio",
        name: "sharp",
        checked: true,
        value: 2,
        text: "圆形"
      }]
    }, {
      label: "初始定位",
      content: [{
        type: "radio",
        name: "pos",
        value: 1,
        text: "左下角"
      }, {
        type: "radio",
        name: "pos",
        checked: true,
        value: 2,
        text: "右下角"
      }]
    }, {
      label: "尺寸",
      content: [{
        type: "radio",
        name: "size",
        value: "big",
        text: "大"
      }, {
        type: "radio",
        name: "size",
        value: "normal",
        checked: true,
        text: "中"
      }, {
        type: "radio",
        name: "size",
        value: "small",
        text: "小"
      }]
    }, Animate.getConf({
      aniOpac: true
    }), {
      label: "占位边距",
      content: [{
        type: "radio",
        name: "padding",
        value: "big",
        text: "大"
      }, {
        type: "radio",
        name: "padding",
        value: "small",
        checked: true,
        text: "小"
      }, {
        type: "radio",
        name: "padding",
        value: "none",
        text: "无"
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
        value: 0,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        min: 0,
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        min: 0,
        value: 0,
        before: "右 "
      }]
    }],
    dependCss: ["entry", "animate.active"],
    typeSwitch: {
      typeSelector: "[name*=func]",
      prefixCss: "layoutFor"
    },
    get: function () {
      var data = this.save();
      var css = tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      }, "margin");
      var aniCls = Animate.getCss(data);
      var link = "javascript:void();";
      var extra = "";
      var html;
      var clsArr = ["easyEntry", "pos" + data.pos, "pad-" + data.padding, data.size, aniCls.join(" ")];
      // 手机检测模块必加载，以优化位置设定
      this.dependJS = ["zepto", "phone", "lib/drag", "drag"];
      switch (data.func) {
        case "1": // 返回顶部
          this.dependJS = ["zepto", "phone", "scroll", "top"];
          link = "#top";
          html = "&#" + data.topIconCode;
          clsArr.push("themeTop");
          clsArr.push("sharp" + data.sharp);
          clsArr.push("color" + data.colorTheme);
          break;
        case "2": // 悬浮球
          link = data.link || link;
          html = "&#" + data.linkIconCode;
          if (data.cmd) {
            this.dependJS.push("app");
            extra = ' cmd="' + data.cmd + '"';
            if (data.cmd.indexOf("share") >= 0) {
              this.dependJS.push("share");
            }
          }
          extra += " data-drag-type='side'";
          clsArr.push("dragable");
          clsArr.push("sharp" + data.sharp);
          clsArr.push("color" + data.colorTheme);
          break;
        case "3": // 悬浮图
          if (!data.flimg) {
            return ""
          }
          link = data.link || link;
          data.sharp = null;
          data.colorTheme = null;
          html = '<img src="' + $.safeHTML(data.flimg) + '"/>';
          if (data.cmd) {
            this.dependJS.push("app");
            extra = ' cmd="' + data.cmd + '"';
            if (data.cmd.indexOf("share") >= 0) {
              this.dependJS.push("share");
            }
          }
          extra += " data-drag-type='side'";
          clsArr.push("dragable");
          clsArr.push("floatImgEntry");
          break;
      }
      return '<a href="' + $.safeHTML(link) + '"' + extra + ' style="' + css + '" class="' + clsArr.join(" ") + '"><div>' + html + '</div></a>';
    }
  });
});
