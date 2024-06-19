define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 全局动效组件
   */
  return Panel.extend({
    icon: "fire",
    name: "animate",
    NAME: "全局动效",
    group: "base",
    init: function () {
      this.callSuper({
        id: "globalAnimate"
      });
    },
    tmpl: [{
      label: "组件说明",
      content: [{
        type: "text",
        text: "本组件属于全局设置，如果不需要全局动效，删除本组件即可。注意：<br>1、本组件在部分低端手机或webview中表现不够流畅。<br>2、在IOS下仅仅保留初始化入场动画。"
      }]
    }, {
      label: "入场动画",
      content: [{
        type: "radio",
        name: "itemIn",
        value: "slideUp",
        checked: true,
        text: "下方滑入"
      }, {
        type: "radio",
        name: "itemIn",
        value: "slideRight",
        text: "左侧滑入"
      }, {
        type: "radio",
        name: "itemIn",
        value: "rotateIn",
        text: "交叉旋转",
        info: "依赖于内容配置区的排列顺序，不可见的组件仍然占位"
      }]
    }, {
      label: "其他",
      content: [{
        type: "checkbox",
        name: "preview",
        checked: true,
        text: "预览时显示动效"
      }, {
        type: "checkbox",
        name: "initOnly",
        text: "仅初始化生效"
      }]
    }],
    dependCss: ["animate.in"],
    dependJS: ["zepto", "lazyAppear"],
    get: function () {
      var data = this.save();
      delete data.NAME;
      return '<script>window.globalAnimate=' + JSON.stringify(data) + '</script>';
    }
  });
});
