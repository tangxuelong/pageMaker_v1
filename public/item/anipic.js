define([
  "jquery", "tools", "com/panel", "com/animate"
], function ($, tools, Panel, Animate) {
  /**
   * 图片类
   */
  return Panel.extend({
    icon: "image",
    name: "anipic",
    NAME: "动效图",
    group: "ext",
    init: function () {
      this.did = "anipic" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "说明",
      content: [{
        type: "text",
        text: "动效图是升级版《图片》组件，支持配置具有初始化动效的单张图片，不支持轮播。"
      }]
    }, {
      label: "*背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "transparent",
        imageName: "layoutimg",
        holder: "分层图片的衬底背景图或背景色，优先加载"
      }]
    }, {
      label: "*蒙层图",
      content: [{
        type: "text",
        text: "配置至少一个方可生效，最多五个 <a href='#group-add'>+增加蒙图</a>"
      }, {
        type: "imageGroup",
        addon: "图片",
        name: "maskimg",
        holder: "蒙层图片地址，一般为 png24 格式半透图片",
        groupCss: "group_first"
      }, {
        type: "inputGroup",
        addon: "备注",
        name: "imginf",
        holder: "蒙层图片备注说明文字，不输出页面",
        groupCss: "group_middle"
      }, {
        type: "radioGroup",
        groupCss: "group_last",
        name: "maskani",
        addon: "动效",
        radios: [{
          value: "leftin",
          checked: true,
          text: "左入"
        }, {
          value: "rightin",
          text: "右入"
        }, {
          value: "upin",
          text: "上入"
        }, {
          value: "downin",
          text: "下入"
        }, {
          value: "leftgi",
          text: "左渐入"
        }, {
          value: "rightgi",
          text: "右渐入"
        }, {
          value: "upgi",
          text: "上渐入"
        }, {
          value: "downgi",
          text: "下渐入"
        }, {
          value: "opa",
          text: "渐显"
        }]
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加蒙图</a>"
      }]
    }, {
      label: "备用图",
      content: [{
        type: "image",
        name: "backupimg",
        holder: "低网速模式下备用完整图片"
      }]
    }, {
      label: "跳转链接",
      content: [{
        type: "input",
        name: "link",
        holder: "点击跳转的地址，可选"
      }]
    }, {
      label: "APP命令",
      content: [{
        type: "cmd",
        name: "cmd",
        holder: "客户端功能命令，可选"
      }]
    }, Animate.getConf(), {
      label: "预览",
      content: [{
        type: "checkbox",
        name: "badnet",
        text: "模拟低网速(显示备用图)"
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
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "marr",
        value: 0,
        before: "右 "
      }]
    }],
    groupConf: {
      max: 5,
      alert: "一个分组内，蒙图不能超过5个！"
    },
    dependCss: ["anipic", "animate.active"],
    dependJS: ["zepto", "lib/net", "anipic"],
    get: function () {
      var html = "";
      var data = this.save();
      var css = Animate.getCss(data);
      // 检查配置
      var maskimg = $.isArray(data.maskimg) ? data.maskimg : [data.maskimg];
      var maskani = $.isArray(data.maskani) ? data.maskani : [data.maskani];
      // 默认的全透明背景，忽略处理
      if (!data.layoutimg && data.bgcolor === "transparent") {
        data.bgcolor = "";
      }
      // 背景、蒙图是必须的
      if ((data.layoutimg || data.bgcolor) && data.maskimg) {
        // 组件边距以及背景色
        var outerStyle = tools.getPaddingStyle({
          top: data.martop,
          bottom: data.marbtm,
          left: data.marl,
          right: data.marr
        }, "margin") + ";" + tools.getCss({
          "background-color": data.bgcolor
        });
        var innerStyle = tools.getPaddingStyle({
          top: data.padtop,
          bottom: data.padbtm,
          left: data.padl,
          right: data.padr
        });
        // 基本图片结构
        html = [
          // 衬底图片
          // 检查是否设置了背景图，没有设置则用其他可用的图片占位
          '<div class="anipic-layout"><image ',
          data.layoutimg ? '' : 'style="visibility:hidden" ',
          'src="', tools.safeHTML(data.layoutimg || data.backupimg || maskimg[0]), '"/>',
          '</div>',
          // 蒙层容器
          '<div class="anipic-inner" style="', innerStyle, '"></div>'
        ].join("");

        // 需要包裹链接
        if (data.link || data.cmd) {
          this.dependJS = ["zepto", "lib/net", "anipic"];
          // 自动补足分享链接
          if (data.link.indexOf("share") === 0) {
            data.link = "share://";
          }
          if (data.link === "share://" || data.cmd === "share") {
            this.dependJS.push('share');
          }
          if (data.cmd) {
            this.dependJS.push('app');
          }
          css.push("aniLink");
          html = '<a class="' + css.join(" ") + '"' + (data.cmd ? ' cmd="' + data.cmd + '"' : '') + ' href="' + tools.safeHTML(data.link || 'javascript:;') + '">' + html + '</a>';
        }

        // 增加外容器包装
        html = ['<section class="anipic" id="' + this.did + '" style="', outerStyle, '">', html, '</section>',
          // 蒙层配置
          '<script>window.ANIPIC&&window.ANIPIC("', this.did, '",', JSON.stringify({
            mask: maskimg,
            ani: maskani,
            sp: [],
            bak: data.backupimg
          }), ',', data.badnet, ');</', 'script>'
        ].join("");
      }
      return html;
    }
  });
});
