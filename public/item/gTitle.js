define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 分组折叠标题
   */
  return Panel.extend({
    icon: "briefcase",
    name: "gTitle",
    NAME: "分组标题",
    group: "ext",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "功能说明",
      content: [{
        type: "text",
        text: "控制后面的元素的显示和隐藏，直到下一个分组标题或终止符为止"
      }]
    }, {
      label: "类型：",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "文字标题"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "图片标题"
      }, {
        type: "radio",
        name: "type",
        value: 3,
        text: "分组终止符",
        info: "没有界面显示，仅仅作为分组结束标记"
      }]
    }, {
      label: "*标题文字",
      css: "layoutFor1",
      content: [{
        type: "input",
        name: "text",
        holder: "标题，居左",
        demo: "标题<a href='#'>链接</a><b>红色</b><i>黄色</i><em>灰色</em><strong>加粗</strong>"
      }]
    }, {
      label: "标题颜色",
      css: "layoutFor1",
      content: [{
        type: "color",
        name: "color",
        value: "#434343"
      }]
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
      label: "标题背景",
      css: "layoutFor1",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "",
        imageName: "bgimage",
        holder: "背景图，高度撑满不平铺"
      }]
    }, {
      label: "展开状态",
      css: "layoutFor2",
      content: [{
        type: "image",
        name: "oImage",
        holder: "请输入或上传展开状态下的图片"
      }]
    }, {
      label: "折叠状态",
      css: "layoutFor2",
      content: [{
        type: "image",
        name: "cImage",
        holder: "请输入或上传折叠状态下的图片"
      }]
    }, {
      label: "初始化",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "radio",
        name: "init",
        value: 1,
        checked: true,
        text: "展开"
      }, {
        type: "radio",
        name: "init",
        value: 2,
        text: "折叠"
      }]
    }, {
      label: "组件内边距",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "number",
        name: "padtop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 20,
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
      css: "layoutFor1 layoutFor2",
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
    dependCss: ["gtitle"],
    dependJS: ["zepto", "scroll", "gtitle"],
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    get: function () {
      var data = this.save();
      var css = tools.getPaddingStyle({
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
        color: data.color,
        "background-color": data.bgcolor,
        "background-image": data.bgimage ? "url(" + data.bgimage + ")" : ""
      });
      var fs = "fs" + [6, 3, 2][Number(data.size) - 1];
      var initSt = data.init === "2" ? ' grel="y"' : '';
      switch (data.type) {
        case "1": // 普通分组标题
          if (!data.text) {
            return "";
          }
          this.dependCss = ["gtitle", "customLink"];
          // 箭头样式
          return ['<section', initSt, ' style="', css, '" class="gTitle ' + fs + '"><div>',
            $.safeHTML(data.text, true),
            '<i class="gArrow iconSet">&#', parseInt("e608", 16), '</i>',
            "</div></section>"
          ].join("");
        case "2": // 图片分组标题
          if (!data.cImage && !data.oImage) {
            return "";
          }
          data.oImage = data.oImage || data.cImage;
          data.cImage = data.cImage || data.oImage;
          // 输出
          return ['<section', initSt, ' class="gTitle gImage">',
            '<image src="', data.oImage, '" class="oImage"/>',
            '<image src="', data.cImage, '" class="cImage"/>',
            '</section>'
          ].join("");
        case "3": // 占位符
          this.dependJS = [];
          return '<h3 class="gEnd"></h3>';
      }
    }
  });
});
