define([
  "jquery", "tools", "com/panel", "com/animate"
], function ($, tools, Panel, Animate) {
  /**
   * 底部浮动广告层，多数情况下用于提示下载APP
   */
  return Panel.extend({
    icon: "bookmark",
    name: "btmFloat",
    NAME: "底部浮层",
    group: "base",
    init: function () {
      this.callSuper();
      this.id = "fixbtm" + String.random();
    },
    tmpl: [{
      label: "*浮层图片",
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
        holder: "点击跳转的地址，跟APP命令需要至少二选一"
      }]
    }, {
      label: "APP命令",
      content: [{
        type: "cmd",
        name: "cmd",
        holder: "客户端功能命令，在项目客户端环境中不再触发跳转链接",
        help: "客户端命令需要是url形式，比如 ntescaipiao://hall ，该启动命令会在任何环境中触发，并在项目App内嵌环境中不再触发跳转链接。"
      }]
    }, Animate.getConf({
      aniDown: true
    }), {
      label: "关闭区域",
      content: [{
        type: "radio",
        name: "close",
        value: 0,
        checked: true,
        text: "不显示"
      }, {
        type: "radio",
        name: "close",
        value: 1,
        text: "左侧12%"
      }, {
        type: "radio",
        name: "close",
        value: 2,
        text: "右侧12%"
      }, {
        type: "radio",
        name: "close",
        value: 3,
        text: "自定义"
      }]
    }, {
      label: "关闭按钮配置",
      content: [{
        type: "number",
        name: "closeLeft",
        value: "0",
        before: "距离左侧距离(百分比) "
      }, {
        type: "number",
        name: "closeWidth",
        value: "12",
        before: "关闭按钮大小(百分比) "
      }]
    }, {
      label: "浮层显示",
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
      label: "其他设置",
      content: [{
        type: "checkbox",
        name: "nobd",
        text: "不显示边线"
      }, {
        type: "checkbox",
        name: "noholder",
        text: "不预留空位"
      }, {
        type: "checkbox",
        name: "autoHide",
        text: "自动显隐",
        info: '当页面滚动出第一屏后显示，否则隐藏'
      }, {
        type: "checkbox",
        name: "forIphone",
        checked: true,
        text: "适配iphoneX"
      }]
    }],
    dependCss: ["btmFloat", "animate.active"],
    get: function () {
      var data = this.save();
      var cls = Animate.getCss(data);
      var closeButtonStyle;
      if (!data.image || (!data.link && !data.cmd)) {
        return "";
      }
      // 自动补足分享链接
      if (data.link.indexOf("share") === 0) {
        data.link = "share://";
      }
      if (data.close === "3") {
        closeButtonStyle = 'style="left:' + data.closeLeft + '%;width:' + data.closeWidth + '%;"';
      }
      data.link = data.link || "javascript:;";
      // 检查依赖
      this.dependJS = ["btmFloat"];
      if (data.link === "share://" || data.cmd === "share") {
        this.dependJS.push("share");
      }
      if (data.cmd || data.display !== "all") {
        this.dependJS.push("app");
      }
      if (data.autoHide) {
        this.dependJS.push("top");
      }
      if (data.forIphone) {
        this.dependJS.push("phone");
      }
      // 返回html代码
      cls.push('fixInnerSec');
      var fullHTML = ['<section class="btmFloat dis_', data.display,
        data.nobd ? ' noborder' : '',
        data.noholder ? ' noholder' : '',
        data.autoHide ? ' secTop' : '',
        '"><div class="' + cls.join(" ") + '"><a',
        data.cmd ? ' cmd="' + data.cmd + '" ' : ' ',
        'href="', $.safeHTML(data.link), '"><img src="', $.safeHTML(data.image), '"/>',
        data.forIphone ? '<div class="fixIphoneX" style="background-image:url(' + $.safeHTML(data.image) + ')"></div>' : '',
        '</a>',
        data.close === "0" ? "" : ('<a href="javascript:;" class="closeLink pos' + data.close + '"' + closeButtonStyle + '></a>'),
        '</div></section>'
      ].join("");

      // 由于btmFloat是fixed定位，在魅族手机上直接显示会有bug，经测试，用脚本重写即可
      // 经过多次确认，原来是因为魅族的“阻止弹出式窗口”功能隐藏了fixed元素导致
      // return ['<script id="', this.id, '" type="text/tmpl">', fullHTML, '</script>',
      // '<script>document.write(document.getElementById("', this.id, '").innerHTML)</script>'
      // ].join("");

      return fullHTML;
    }
  });
});
