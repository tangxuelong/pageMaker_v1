define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 分割线
   */
  return Panel.extend({
    icon: "pagebreak",
    name: "line",
    NAME: "分割线",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "横线颜色",
      content: [{
        type: "color",
        name: "color",
        value: "#cec1b1"
      }]
    }, {
      label: "横线类型",
      content: [{
        type: "radio",
        name: "type",
        value: 0,
        checked: true,
        text: "实线"
      }, {
        type: "radio",
        name: "type",
        value: 1,
        text: "虚线"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "点"
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
    dependCss: ["line"],
    get: function () {
      var data = this.save();
      var css = tools.getCss({
        "border-color": data.color
      }) + ";" + tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      }, "margin");
      return '<section style="' + css + '" class="line s' + data.type + '"></section>'
    }
  });
});
