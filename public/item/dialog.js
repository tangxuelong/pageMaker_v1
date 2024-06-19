define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 对话框模块
   */
  return Panel.extend({
    icon: "bubbles4",
    name: "dialog",
    NAME: "对话框",
    group: "ext",
    init: function () {
      this.did = "d" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "功能说明",
      css: "layoutFor1",
      content: [{
        type: "text",
        text: "普通弹框，支持一段文字或一张图片，以及一个确认按钮。"
      }]
    }, {
      label: "功能说明",
      css: "layoutFor2",
      content: [{
        type: "text",
        text: "确认弹框，支持一段文字或一张图片，以及确认按钮和取消按钮。"
      }]
    }, {
      label: "功能说明",
      css: "layoutFor3",
      content: [{
        type: "text",
        text: "广告弹框，不使用默认弹窗样式，支持一张图和一个链接，并自动关闭。"
      }]
    }, {
      label: "功能说明",
      css: "layoutFor4",
      content: [{
        type: "text",
        text: "提示框，默认一句话，无按钮，并自动关闭。"
      }]
    }, {
      label: "类型",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "普通弹窗"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "确认弹框"
      }, {
        type: "radio",
        name: "type",
        value: 3,
        text: "广告弹框"
      }, {
        type: "radio",
        name: "type",
        value: 4,
        text: "Toast"
      }]
    }, { // ----------------- 弹窗标题 ----------------
      label: "弹窗标题",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "input",
        name: "title",
        holder: "请输入弹窗的标题，可选"
      }]
    }, { // ----------------- 普通弹窗 ----------------
      label: "弹窗文字",
      css: "layoutFor1 layoutFor2 layoutFor4",
      content: [{
        type: "textarea",
        name: "dialogText",
        holder: "请输入弹窗的文字"
      }]
    }, {
      label: "弹窗图片",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "image",
        name: "dialogImage",
        holder: "弹窗显示的图片，设置图片后，上面的文字设置将无效"
      }]
    }, { // ----------------- 确认弹窗 ----------------
      label: "确认按钮",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "input",
        name: "cfmBtnCfg",
        holder: "请按照格式配置按钮：文字|链接|客户端命令",
        help: "配置格式是：按钮文字|点击后跳转链接|客户端命令，以竖线分割"
      }]
    }, {
      label: "取消按钮",
      css: "layoutFor2",
      content: [{
        type: "input",
        name: "cslBtnCfg",
        holder: "请按照格式配置按钮：文字|链接|客户端命令",
        help: "配置格式是：按钮文字|点击后跳转链接|客户端命令，以竖线分割"
      }]
    }, { // ----------------- 广告弹窗 ----------------
      label: "广告图片",
      css: "layoutFor3",
      content: [{
        type: "image",
        name: "adPic",
        holder: "输入弹窗图片地址或上传图片"
      }]
    }, {
      label: "广告链接",
      css: "layoutFor3",
      content: [{
        type: "input",
        name: "adLink",
        holder: "广告链接地址|客户端命令",
        help: "配置格式是：广告链接地址|客户端命令，以竖线分割"
      }]
    }, {
      label: "图片尺寸",
      css: "layoutFor3",
      content: [{
        type: "radio",
        name: "adsize",
        text: "大",
        value: 3,
        checked: true
      }, {
        type: "radio",
        name: "adsize",
        text: "中",
        value: 2
      }, {
        type: "radio",
        name: "adsize",
        text: "小",
        value: 1
      }]
    }, {
      label: "字号",
      css: "layoutFor1 layoutFor2 layoutFor4",
      content: [{
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
      label: "文本设置",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "checkbox",
        name: "brNewLine",
        text: "回车换行",
        checked: true
      }, {
        type: "checkbox",
        name: "indent",
        text: "换行缩进"
      }, {
        type: "checkbox",
        name: "bigLH",
        text: "大行距",
      }, {
        type: "checkbox",
        name: "center",
        text: "居中",
        checked: true
      }, {
        type: "checkbox",
        name: "noline",
        text: "链接无下划线"
      }]
    }, { // -----通用设置-----
      label: "动画",
      css: "layoutFor1 layoutFor2 layoutFor3",
      content: [{
        type: "radio",
        name: "animate",
        value: 5,
        checked: true,
        text: "默认"
      }, {
        type: "radio",
        name: "animate",
        value: 1,
        text: "渐变"
      }, {
        type: "radio",
        name: "animate",
        value: 2,
        text: "窗帘"
      }, {
        type: "radio",
        name: "animate",
        value: 4,
        text: "转轴"
      }, {
        type: "radio",
        name: "animate",
        value: 0,
        text: "无动画"
      }]
    }, {
      label: "自动关闭",
      css: "layoutFor3 layoutFor4",
      content: [{
        type: "radio",
        name: "timeout",
        value: 2000,
        text: "2秒"
      }, {
        type: "radio",
        name: "timeout",
        value: 3000,
        checked: true,
        text: "3秒"
      }, {
        type: "radio",
        name: "timeout",
        value: 4000,
        text: "4秒"
      }, {
        type: "radio",
        name: "timeout",
        value: 5000,
        text: "5秒"
      }, {
        type: "radio",
        name: "timeout",
        value: 6000,
        text: "6秒"
      }, {
        type: "radio",
        name: "timeout",
        value: 8000,
        text: "8秒"
      }]
    }, {
      label: "自动弹出",
      content: [{
        type: "checkbox",
        name: "autoShow",
        text: "自动弹出一次"
      }, {
        type: "checkbox",
        name: "loopShow",
        text: "循环自动弹出",
        alert: "多个弹窗循环，每天最多弹出一个。勾选『自动弹出一次』后不会再次进入循环。"
      }, {
        type: "checkbox",
        name: "previewShow",
        checked: true,
        text: "预览时自动弹出"
      }]
    }, {
      label: "其他设置",
      content: [{
        type: "checkbox",
        name: "trans",
        text: "蒙层透明",
        alert: "仅广告弹窗有效"
      }]
    }, {
      label: "触发方式",
      content: [{
        type: "text",
        text: "设置链接：<code class='linkDemo'></code> 或脚本调用：<code class='jsDemo'></code>"
      }]
    }],
    dependCss: ["title", "p", "dialog"],
    dependJS: ["zepto", "lib/class", "lib/dialog", "dialog"],
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    initEvent: function () {
      $(".linkDemo", this.wrap).text("dialog://" + this.did);
      $(".jsDemo", this.wrap).text('$.showDialog("' + this.did + '")');
    },
    // 存取自定义的did属性
    load: function (data) {
      this.callSuper(data);
      this.did = data.did || this.did;
      this.initEvent();
    },
    save: function () {
      var data = this.callSuper();
      data.did = this.did;
      return data;
    },
    // 检查按钮链接配置
    getBtnConf: function (conf, defBtn) {
      var data = conf.split("|");
      var text = data[0] || defBtn || "确认";
      var link = data[1];
      var cmd = data[2];
      if (link && link.indexOf("share") === 0) {
        link = "share://"
      }
      return [text, link, cmd];
    },
    // 输出dom节点
    get: function () {
      var data = this.save();
      var content = data.brNewLine ? data.dialogText.replace(/\\\n/g, "<br>").replace(/\n/g, "</p><p>") : data.dialogText;
      var css = ["dialogBox p", "fs" + data.size];
      var dialogBox;
      var conf = {};

      // 计算样式
      data.indent && css.push("indent");
      data.bigLH && css.push("bigLH");
      data.noline && css.push("noline");
      data.center && css.push("center");

      // 计算html
      dialogBox = ['<div id="dialog-' + data.did + '" class="' + css.join(" ") + '"><p>'];
      switch (data.type) {
        case "1": // 普通弹窗
        case "2": // 确认弹窗
          if (!content && !data.dialogImage) {
            return;
          }
          dialogBox.push(data.dialogImage ? '<img src="' + data.dialogImage + '"/>' : content);

          // 按钮配置
          conf.cfm = this.getBtnConf(data.cfmBtnCfg);
          conf.csl = [];
          if (data.type === "2") {
            conf.csl = this.getBtnConf(data.cslBtnCfg, "取消");
          }
          // 分享模块依赖检查
          if (
            conf.cfm[1] === "share://" || conf.cfm[2] === "share" ||
            conf.csl[1] === "share://" || conf.csl[2] === "share"
          ) {
            this.dependJS = this.dependJS.concat("share");
          }
          // 检查cmd命令
          if (conf.cfm[2] || conf.csl[2]) {
            this.dependJS = this.dependJS.concat("app");
          }

          // 字号、动画配置
          conf.fs = data.size;
          conf.ani = data.animate;
          conf.t = parseInt(data.timeout);
          conf.title = data.title;
          break;
        case "3": // 广告
          if (!data.adPic) {
            return;
          }
          var adLink = (data.adLink || "javascript:;").split("|");
          // 检查链接
          if (adLink[0].indexOf("share") === 0) {
            adLink[0] = "share://";
          }
          // 检查依赖模块
          if (adLink[0] === "share://" || adLink[1] === "share") {
            this.dependJS = this.dependJS.concat("share");
          }
          if (adLink[1]) {
            this.dependJS = this.dependJS.concat("app");
          }

          // 重新构造html
          dialogBox = ['<div id="dialog-' + data.did + '" class="dialogBox picw' + data.adsize + '"><p>',
            '<a class="iDialogClose" href="javascript:;"><span>+</span></a>',
            '<a href="', adLink[0], '"', adLink[1] ? ' cmd="' + adLink[1] + '"' : "", '>',
            '<img src="', data.adPic, '"/>',
            '</a>'
          ];

          // 动画配置
          conf.ani = data.animate;
          conf.t = parseInt(data.timeout);
          break;
        case "4": // toast
          if (!content) {
            return;
          }
          conf.t = parseInt(data.timeout);
          dialogBox.push(content);
          break;
      }
      dialogBox.push('</p></div>');

      // 其他公共配置
      conf.type = data.type;
      conf.auto = data.autoShow;
      conf.pre = data.previewShow;
      conf.loop = data.loopShow;
      conf.trans = data.trans;
      return [
        dialogBox.join(""),
        '<script>window.addOneDialog&&window.addOneDialog("' + data.did + '",', JSON.stringify(conf), ');</', 'script>'
      ].join("");
    }
  });
});
