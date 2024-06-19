define([
  "jquery", "tools", "com/panel", "com/animate", "com/image"
], function ($, tools, Panel, Animate, holderImage) {
  /**
   * 图片类
   */
  return Panel.extend({
    icon: "image",
    name: "pic",
    NAME: "图片",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*图片地址",
      content: [{
        type: "image",
        name: "image",
        holder: "输入完整图片地址，或上传图片"
      }]
    }, {
      label: "链接地址",
      content: [{
        type: "url",
        name: "link",
        holder: "图片链接地址，可选"
      }]
    }, {
      label: "配图文字",
      content: [{
        type: "input",
        name: "imgText",
        holder: "图片底部说明文字，可选"
      }]
    }, Animate.getConf(), {
      label: "填充色",
      content: [{
        type: "color",
        name: "bgcolor",
        value: "transparent"
      }]
    }, {
      label: "组件内边距",
      content: [{
        type: "number",
        name: "padtop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 0,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        value: 0,
        before: "右 "
      }]
    }, {
      label: "组件外边距",
      content: [{
        type: "number",
        name: "martop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "marbtm",
        value: 30,
        before: "下 "
      }, {
        type: "number",
        name: "marl",
        value: 24,
        before: "左 "
      }, {
        type: "number",
        name: "marr",
        value: 24,
        before: "右 "
      }]
    }],
    get: function () {
      var data = this.save();
      var css = Animate.getCss(data);
      var $this = this;
      if (!data.image) {
        return;
      }
      return holderImage.getImageData(data.image)
        .then(function (imageData) {
          // 获取数据
          var html = imageData.html;
          // 获取依赖
          $this.dependCss = ["pic", "animate.active"].concat(imageData.css);
          $this.dependJS = imageData.js;
          // 配图文字
          if (data.imgText) {
            html += "<span>" + (tools.safeHTML(data.imgText) || "&nbsp;") + "</span>";
          }
          // 需要包裹链接
          if (data.link) {
            css.push("aniLink");
            html = '<a class="' + css.join(" ") + '" href="' + tools.safeHTML(data.link) + '">' + html + '</a>';
          }
          // 组件边距以及背景色
          var style = tools.getPaddingStyle({
            top: data.padtop,
            bottom: data.padbtm,
            left: data.padl,
            right: data.padr
          }) + ";" + tools.getPaddingStyle({
            top: data.martop,
            bottom: data.marbtm,
            left: data.marl,
            right: data.marr
          }, "margin") + ";" + tools.getCss({
            "background-color": data.bgcolor
          });
          // 外容器
          html = '<section style="' + style + '"><div class="imgBox">' + html + '</div></section>';
          // 返回拼接好的html代码
          return html;
        });
    }
  });
});
