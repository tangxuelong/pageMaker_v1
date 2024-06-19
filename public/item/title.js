define([
  "jquery", "tools", "com/panel", "com/customLink"
], function ($, tools, Panel, customLink) {
  /**
   * 综合标题
   */
  return Panel.extend({
    icon: "header",
    name: "title",
    NAME: "标题",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "类型：",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "普通标题"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "链接标题"
      }]
    }, {
      label: "*标题文字",
      content: [{
        type: "input",
        name: "text",
        holder: "标题文字",
        demo: "标题<a href='#'>链接</a><b>红色</b><i>黄色</i><em>灰色</em><strong>加粗</strong>"
      }]
    }, {
      label: "*链接",
      css: "layoutFor2",
      content: [{
        type: "input",
        name: "link",
        holder: "标题点击跳转的地址"
      }]
    }, {
      label: "标题颜色",
      content: [{
        type: "color",
        name: "color",
        value: "#434343"
      }]
    }, {
      label: "字号",
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
      label: "布局",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "pos",
        text: "居左",
        value: "left"
      }, {
        type: "radio",
        name: "pos",
        text: "居中",
        value: "center",
        checked: true
      }, {
        type: "radio",
        name: "pos",
        text: "居右",
        value: "right"
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
    }, {
      label: "左侧功能",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "leftFn",
        value: 0,
        checked: true,
        text: "无"
      }, {
        type: "radio",
        name: "leftFn",
        value: 1,
        text: "自定义链接<b class='preB'></b>"
      }]
    }, {
      label: "右侧功能",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "rightFn",
        value: 0,
        checked: true,
        text: "无"
      }, {
        type: "radio",
        name: "rightFn",
        value: 1,
        text: "自定义链接<b class='preB'></b>"
      }]
    }, {
      label: "标题背景",
      css: "layoutFor1",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "",
        imageName: "bgimage",
        holder: "背景图，高度撑满不平铺，跟随布局设置"
      }]
    }, {
      label: "标题背景",
      css: "layoutFor2",
      content: [{
        type: "background",
        colorName: "bgcolor2",
        colorValue: "#ffffff",
        imageName: "bgimage2",
        holder: "背景图，高度撑满不平铺"
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
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    initEvent: function () {
      var wrap = this.wrap;
      var me = this;
      var preview = function (data) {
        me.makeCusLinkPreview(this, data);
      };
      var r = this.leftFnRadio = wrap.find("[name*=leftFn][value=1]");
      var l = this.rightFnRadio = wrap.find("[name*=rightFn][value=1]");
      // 延迟绑定组件，防止默认的自动点击展开面板
      window.setTimeout(function () {
        r.customLink(preview);
        l.customLink(preview);
      }, 0);
    },
    makeCusLinkPreview: function (link, data) {
      this.iamChange();
      $(link).parent().find("b").html(customLink.getText(data));
    },
    // 因为新增了data("value")存储，所以需要重写load和save方法
    load: function (conf) {
      this.callSuper(conf);
      conf.leftFnData && this.leftFnRadio.data("value", conf.leftFnData);
      conf.rightFnData && this.rightFnRadio.data("value", conf.rightFnData);
    },
    save: function () {
      var conf = this.callSuper();
      conf.leftFnData = this.leftFnRadio.data("value");
      conf.rightFnData = this.rightFnRadio.data("value");
      return conf;
    },
    get: function () {
      var data = this.save();
      var type = Number(data.type);
      var bg = {
        color: data[["bgcolor", "bgcolor2"][type - 1]],
        img: data[["bgimage", "bgimage2"][type - 1]]
      };
      var css = tools.getCss({
        color: data.color,
        "background-color": bg.color,
        "background-image": bg.img ? "url(" + bg.img + ")" : ""
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
      }, "margin");
      var fs = ["fs6 strong", "fs3 strong", "fs2"][Number(data.size) - 1];

      // App内是否显示
      if (data.display !== "all") {
        this.dependJS = ["app"];
      }

      // 根据类型输出不同的代码
      if (data.type === "2") {
        if (!data.text || !data.link) {
          return "";
        }
        this.dependCss = ["title2", "customLink"];
        fs = ["fs6 strong", "fs3", "fs2"][Number(data.size) - 1];

        // 箭头样式
        var iconHtml = '<i class="gArrow iconSet">&#' + parseInt("e607", 16) + '</i>';
        return [
          '<section><a class="dis_', data.display, '" href="' + $.safeHTML(data.link, true) + '">',
          '<h1 style="', css, '" class="h5TitleLink ', fs, '">',
          '<div>', $.safeHTML(data.text, true), iconHtml, '</div>',
          '</h1>',
          '</a></section>'
        ].join("");
      }
      // 左右快捷链接
      var leftFnData = data.leftFn === "1" ? data.leftFnData : 0;
      var rightFnData = data.rightFn === "1" ? data.rightFnData : 0;
      var leftLink = customLink.get(leftFnData, "cusLink hLeft", "color:" + data.color);
      var rightLink = customLink.get(rightFnData, "cusLink hRight", "color:" + data.color);
      if (!data.text && !leftLink && !rightLink) {
        return "";
      }
      data.text = data.text || "　";
      // 检查css依赖和js依赖
      this.dependCss = ["title"];
      var depends = customLink.getDepends(leftFnData, rightFnData);
      if (depends.css) {
        this.dependCss = this.dependCss.concat(depends.css);
      }
      if (depends.js) {
        this.dependJS = (this.dependJS || []).concat(depends.js);
      }
      // 2015-04-22 新增两个自定义链接配置
      return ['<section><h1 style="', css,
        '" class="h5Title dis_', data.display, " ", fs, " ", data.pos, '"><div>',
        leftLink, $.safeHTML(data.text, true), rightLink,
        "</div></h1></section>"
      ].join("");
    }
  });
});
