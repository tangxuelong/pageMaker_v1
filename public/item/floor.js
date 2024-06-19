define([
  "jquery", "tools", "com/panel", "color"
], function ($, tools, Panel, Color) {
  /**
   * 楼层导航
   */
  return Panel.extend({
    icon: "location",
    name: "floor",
    NAME: "楼层导航",
    group: "ext",
    init: function () {
      this.callSuper();
      this.did = "floor" + Math.random().toString(16).slice(-4);
    },
    tmpl: [{
      label: "功能说明",
      content: [{
        type: "text",
        text: "将楼层信息汇总到导航条显示，方便长页面定位跳转。预览时无浮动定位效果，无跟随效果。"
      }]
    }, {
      label: "类型：",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "创建导航条"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "标记楼层"
      }, {
        type: "radio",
        name: "type",
        value: 3,
        text: "终止符",
        info: "没有界面显示，仅仅作为结束标记"
      }]
    }, {
      label: "*楼层描述",
      css: "layoutFor2",
      content: [{
        type: "input",
        name: "text",
        holder: "四个字以内为宜"
      }]
    }, {
      label: "配色",
      css: "layoutFor1",
      content: [{
        type: "color",
        name: "bgcolor",
        value: "#434343",
        text: "背景色"
      }, {
        type: "color",
        name: "txtcolor",
        value: "#ffffff",
        text: "文字色"
      }, {
        type: "color",
        name: "actcolor",
        value: "#ffffff",
        text: "选中色"
      }]
    }, {
      label: "图标",
      css: "layoutFor1",
      content: ["e947", "e9d2", "ea54"].map(function (code, i) {
        return {
          type: "radio",
          name: "icon",
          value: code,
          checked: i === 0,
          text: "<span class='floorIcon'>&#" + parseInt(code, 16) + "</span>"
        }
      })
    }, {
      label: "字号",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "size",
        text: "大",
        value: 1
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
        value: 3
      }]
    }, {
      label: "内边距",
      css: "layoutFor1",
      content: [{
        type: "number",
        name: "padtop",
        value: 24,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 24,
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
    }, {
      label: "外边距",
      css: "layoutFor1",
      content: [{
        type: "number",
        name: "martop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "marbtm",
        value: 0,
        before: "下 "
      }, {
        type: "number",
        name: "marl",
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "marr",
        value: 0,
        before: "右 "
      }]
    }],
    dependCss: ["floor"],
    dependJS: ["zepto", "lib/zepto-ext", "lib/sticky-kit", "scroll", "floor"],
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    get: function () {
      var data = this.save();
      switch (data.type) {
        // 创建楼层
        case "1":
          var cls = ["floorBase", "fs" + [3, 2, 1][Number(data.size) - 1], "theme-" + data.icon];
          return ['<style>',
            "#", this.did, '{', tools.getPaddingStyle({
              top: data.martop,
              bottom: data.marbtm,
              left: data.marl,
              right: data.marr
            }, "padding"), "}",
            "#", this.did, ' div{background-color:', data.bgcolor, '}',
            '#', this.did, ' .active{color:', data.actcolor, '}',
            '#', this.did, ' p{', tools.getPaddingStyle({
              top: data.padtop,
              bottom: 0,
              left: data.padl,
              right: data.padr
            }), '}',
            '#', this.did, ' a{color:', data.txtcolor, ';', tools.getPaddingStyle({
              top: 0,
              bottom: data.padbtm,
              left: 20,
              right: 20
            }), '}',
            "#", this.did, ' .handler{box-shadow: 0 0 2px 0 ', Color.contrastColor(data.bgcolor), ';' + tools.getPaddingStyle({
              top: data.padtop,
              bottom: data.padbtm,
              left: 0,
              right: 0
            }) + ';background:', data.bgcolor, '}',
            '</style>',
            '<section id="' + this.did + '" class="', cls.join(" "), '">',
            '<div>',
            '<a href="#" class="floorIcon handler"><span>&#' + parseInt("e900", 16) + '</span></a>',
            '<p></p>',
            '</div>',
            '</section>'
          ].join("");
        case "2": // 标记楼层
          return '<a href="#" class="floorHook">' + tools.safeHTML(data.text) + '</a>';
        case "3": // 结束标记
          return '<a href="#" class="floorEnd"></a>';
      }
    }
  });
});
