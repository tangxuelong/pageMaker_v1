define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 二维码组件
   */
  return Panel.extend({
    icon: "qrcode",
    name: "qrcode",
    NAME: "二维码",
    group: "adv",
    init: function () {
      this.did = "qrcode" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "类型",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "自定义内容"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "PC访问引导",
        info: "通过PC访问页面时，提示扫码访问"
      }]
    }, {
      label: "颜色",
      content: [{
        type: "color",
        name: "dark",
        value: "#000000",
        text: "主色"
      }, {
        type: "color",
        name: "light",
        value: "#ffffff",
        text: "对比色"
      }]
    }, {
      label: "内容",
      content: [{
        type: "input",
        name: "content",
        holder: "自定义二维码的内容，不填默认是发布后的页面地址"
      }]
    }, {
      label: "提示",
      css: "layoutFor2",
      content: [{
        type: "input",
        name: "info",
        holder: "二维码下方显示的提示文案，比如“请用手机扫码访问”，不宜过长"
      }]
    }, {
      label: "位置",
      css: "layoutFor2",
      content: [{
        type: "radio",
        name: "pos",
        value: 1,
        checked: true,
        text: "居中(有蒙层)"
      }, {
        type: "radio",
        name: "pos",
        value: 2,
        text: "左侧(无蒙层)"
      }, {
        type: "radio",
        name: "pos",
        value: 3,
        text: "右侧(无蒙层)"
      }]
    }, {
      label: "预览",
      css: "layoutFor2",
      content: [{
        type: "checkbox",
        name: "pc",
        checked: true,
        text: "模拟PC访问"
      }]
    }, {
      label: "背景",
      css: "layoutFor1",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "transparent",
        imageName: "bgimage",
        holder: "背景图，宽度撑满且纵向平铺"
      }]
    }, {
      label: "组件内边距",
      css: "layoutFor1",
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
      css: "layoutFor1",
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
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    dependJS: ["zepto", "lib/qrcode", "qrcode"],
    get: function () {
      var data = this.save();
      switch (parseInt(data.type)) {
        case 1: // 自定义二维码内容
          this.dependCss = ["qrcode.wap"];
          return ['<section class="qrcode-wap" style="' +
            tools.getPaddingStyle({
              top: data.martop,
              bottom: data.marbtm,
              left: data.marl,
              right: data.marr
            }, "margin") + ";" +
            tools.getPaddingStyle({
              top: data.martop,
              bottom: data.marbtm,
              left: data.marl,
              right: data.marr
            }, "margin") + ";" + tools.getCss({
              "background-color": data.bgcolor,
              "background-image": "url(" + data.bgimage + ")"
            }) + '">',
            // 插入一个占位图片，保证最小为一个背景图高度
            data.bgimage ? '<img src="' + data.bgimage + '" class="qrcode-imgHolder"/>' : '',
            // 二维码图片容器
            '<div class="qrcode-wrapHolder" style="',
            tools.getPaddingStyle({
              top: data.padtop,
              bottom: data.padbtm,
              left: data.padl,
              right: data.padr
            }), '">',
            '<div class="qrcode-box" style="background-color:', data.light, ';">',
            '<img id="' + this.did + '" src="//pimg1.126.net/nfop/common/i.gif"/>',
            '<script>window.makeQrCode("', this.did, '",', JSON.stringify({
              text: data.content,
              dark: data.dark,
              light: data.light
            }), ');</script>',
            '</div>',
            '</div>',
            '</section>'
          ].join("");
        case 2: // PC访问提示
          this.dependCss = ["qrcode.pc"];
          return [
            '<section class="qrcode-pc qrcode-pc', data.pos, '">',
            '<div class="qrcode-box" style="background-color:', data.light, ';">',
            '<script>window.makeQrCode2(', JSON.stringify({
              text: data.content,
              dark: data.dark,
              light: data.light,
              size: data.pos === "1" ? 200 : 150,
              info: data.info
            }), ',', data.pc, ');</script>',
            '</div>',
            '</section>'
          ].join("");
      }
    }
  });
});
