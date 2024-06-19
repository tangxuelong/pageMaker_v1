define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 正文。数字滚动（numroll.js）组件继承了本组件。
   */
  return Panel.extend({
    icon: "paragraph-left",
    name: "p",
    NAME: "正文",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*正文内容",
      content: [{
        type: "textarea",
        name: "text",
        holder: "输入正文内容",
        demo: "这里是正文，原则上支持任何html代码，不过你要小心，不要从别处直接复制html过来，否则可能会造成一些不可预期的潜在风险。这里可以<b>标红</b><i>标黄</i><strong>加粗</strong><a href=\"share:\/\/\">分享链接</a>。在行尾添加 \\ 字符后，可以消除一个换行导致的分段，可使两行间距变小一些。"
      }]
    }, {
      label: "正文颜色",
      content: [{
        type: "color",
        name: "color",
        value: "#5d5d5d"
      }]
    }, {
      label: "布局",
      content: [{
        type: "radio",
        name: "pos",
        text: "居左",
        value: "left",
        checked: true
      }, {
        type: "radio",
        name: "pos",
        text: "居中",
        value: "center"
      }, {
        type: "radio",
        name: "pos",
        text: "居右",
        value: "right"
      }]
    }, {
      label: "字号",
      content: [{
        type: "radio",
        name: "size",
        text: "超大",
        value: 4
      }, {
        type: "radio",
        name: "size",
        text: "大",
        value: 3
      }, {
        type: "radio",
        name: "size",
        text: "中",
        value: 2,
        checked: true
      }, {
        type: "radio",
        name: "size",
        text: "小",
        value: 1
      }]
    }, {
      label: "初始折叠",
      content: [{
        type: "radio",
        name: "collapse",
        text: "无",
        checked: true,
        value: 0
      }, {
        type: "radio",
        name: "collapse",
        text: "显示 4 行",
        value: 4
      }, {
        type: "radio",
        name: "collapse",
        text: "显示 8 行",
        value: 8
      }, {
        type: "radio",
        name: "collapse",
        text: "显示 12 行",
        value: 12
      }]
    }, {
      label: "其他设置",
      content: [{
        type: "checkbox",
        name: "brNewLine",
        text: "回车换行",
        checked: true
      }, {
        type: "checkbox",
        name: "indent",
        text: "换行缩进",
        checked: true
      }, {
        type: "checkbox",
        name: "bigLH",
        text: "大行距",
        checked: true
      }, {
        type: "checkbox",
        name: "bigP",
        text: "大段距"
      }, {
        type: "checkbox",
        name: "noline",
        text: "链接无下划线"
      }, {
        type: "checkbox",
        name: "radius",
        text: "圆角边框"
      }]
    }, {
      label: "正文背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "transparent",
        imageName: "bgimage",
        holder: "背景图，宽度撑满且纵向平铺"
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
    dependCss: ["title", "p"],
    get: function (hookFn) {
      var data = this.save();
      var useCollapse = data.collapse !== "0";
      var css = tools.getCss({
        color: data.color,
        "background-color": data.bgcolor,
        "background-image": data.bgimage ? "url(" + data.bgimage + ")" : ""
      }) + ";" + tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      }) + ";" + tools.getPaddingStyle({
        top: data.martop,
        bottom: data.marbtm,
        left: data.marl,
        right: data.marr
      }, "margin") + ";" + (function(collapse, lineHeight) {
        if (!collapse) {
          return;
        }
        return 'max-height:' + (collapse * lineHeight + 0.9) + 'em'
      })(Number(data.collapse), data.bigLH ? 1.833 : 1.5);
      if (!data.text) {
        return "";
      }
      var cls = ["p", "fs" + data.size, data.pos];
      var html = data.brNewLine ? data.text.replace(/\\\n/g, "<br>").replace(/\n/g, "</p><p>") : data.text;
      data.indent && cls.push("indent");
      data.bigLH && cls.push("bigLH");
      data.bigP && cls.push("bigP");
      data.noline && cls.push("noline");
      data.radius && cls.push("radius");

      // 依赖的样式表
      this.dependCss = ["title", "p"];
      if (useCollapse) {
        this.dependCss.push("collapse");
      }
      // 依赖的js
      this.dependJS = [];
      // 检测是否需要折叠
      if (useCollapse) {
        cls.push("collapseSec");
        this.dependJS.push("zepto");
        this.dependJS.push("collapse");
      }
      // 检测是否包含 share:// 链接
      if (html.indexOf("share://") > 0) {
        this.dependJS.push("share");
      }
      // 如果有hookFn，则按照HookFn进行输出
      if ($.isFunction(hookFn)) {
        return hookFn(css, cls, html);
      }
      return ['<section style="' + css + '" class="', cls.join(" "), '">',
        $.safeHTML("<p>" + html + "</p>", true),
        "</section>"
      ].join("");
    }
  });
});
