define([
  "jquery", "tools", "com/panel", "com/image"
], function ($, tools, Panel, holderImage) {
  /**
   * 图文资讯
   */
  return Panel.extend({
    icon: "newspaper",
    name: "news",
    NAME: "图文资讯",
    group: "ext",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "资讯链接",
      content: [{
        type: "url",
        name: "url",
        holder: "资讯点击跳转链接"
      }]
    }, {
      label: "*主标题",
      content: [{
        type: "input",
        name: "main",
        holder: "资讯主标题，强制换行使用 #"
      }]
    }, {
      label: "主标字号",
      content: [{
        type: "radio",
        name: "mainSize",
        value: "deffs",
        text: "默认",
        checked: true
      }, {
        type: "radio",
        name: "mainSize",
        value: "samefs",
        text: "与副标字号相同"
      }]
    }, {
      label: "*副标题",
      content: [{
        type: "input",
        name: "sub",
        holder: "资讯副标题，最大支持双行，溢出截断"
      }]
    }, {
      label: "左配图",
      content: [{
        type: "image",
        name: "img",
        holder: "左侧浮动配图"
      }]
    }, {
      label: "右配图",
      content: [{
        type: "image",
        name: "img2",
        holder: "右侧浮动配图"
      }]
    }, {
      label: "配图尺寸",
      content: [{
        type: "radio",
        name: "imgSize",
        value: "s1",
        text: "大（宽150px）",
        checked: true
      }, {
        type: "radio",
        name: "imgSize",
        value: "s2",
        text: "小（宽108px）"
      }]
    }, {
      label: "分割线",
      content: [{
        type: "radio",
        name: "line",
        value: "line1",
        text: "实线"
      }, {
        type: "radio",
        name: "line",
        value: "line2",
        checked: true,
        text: "虚线"
      }, {
        type: "radio",
        name: "line",
        value: "noline",
        text: "无"
      }]
    }, {
      label: "配色",
      content: [{
        type: "radio",
        name: "theme",
        value: "news01",
        checked: true,
        text: "黑灰"
      }]
    }, {
      label: "组件边距",
      content: [{
        type: "number",
        name: "padtop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 30,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        value: 24,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        value: 24,
        before: "右 "
      }]
    }],
    dependCss: ["news"],
    get: function () {
      var data = this.save();
      var css = tools.getCss({
        color: data.color
      }) + ";" + tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      });
      if (!data.main || !data.sub) {
        return "";
      }
      // 加载依赖
      if (data.img || data.img2) {
        this.dependCss = ["news"].concat(holderImage.css);
        this.dependJS = [].concat(holderImage.js);
      }
      // 返回html
      return Promise.all([
        holderImage.getImageData(data.img),
        holderImage.getImageData(data.img2)
      ]).then(function (imageArr) {
        var html = ['<a href="', (data.url || "javascript:;"), '" class="newsLink clearfix">',
          data.img ? '<span class="newsImg">' + imageArr[0].html + '</span>' : '',
          '<span class="newsCtn"><h2>', tools.safeHTML(data.main, true).replace(/#/g, "<br>"), '</h2>',
          '<p>', tools.safeHTML(data.sub, true), '</p></span>',
          data.img2 ? '<span class="newsImg">' + imageArr[1].html + '</span>' : '',
          '</a>'
        ].join("");
        return '<section style="' + css + '" class="' + ["newsBox", data.line, data.theme, data.imgSize, data.mainSize].join(" ") + '">' + html + "</section>";
      });
    }
  });
});
