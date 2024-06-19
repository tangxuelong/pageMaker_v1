define([
  "jquery", "tools", "com/panel", "com/animate"
], function ($, tools, Panel, Animate) {
  /**
   * 按钮组
   */
  return Panel.extend({
    icon: "cubes",
    name: "buttons",
    NAME: "按钮组",
    group: "ext",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*按钮配置",
      content: [{
        type: "text",
        text: "配置两个以上方可生效，最多四个 <a href='#group-add'>+增加按钮</a>"
      }, {
        type: "inputGroup",
        addon: "文字",
        name: "text",
        holder: "按钮上显示的文字",
        groupCss: "buttons_text group_first"
      }, {
        type: "urlGroup",
        addon: "链接",
        name: "link",
        holder: "按钮点击跳转的地址",
        groupCss: "buttons_url group_middle"
      }, {
        type: "cmdGroup",
        addon: "命令",
        name: "cmd",
        holder: "客户端功能命令，仅当在内嵌客户端时生效",
        groupCss: "buttons_cmd group_middle"
      }, {
        type: "radioGroup",
        groupCss: "buttons_css group_last",
        name: "css",
        addon: "配色",
        radios: [{
          value: "redBtn",
          checked: true,
          text: "红色"
        }, {
          value: "blueBtn",
          text: "蓝色"
        }, {
          value: "greenBtn",
          text: "绿色"
        }, {
          value: "yellowBtn",
          text: "黄色"
        }, {
          value: "orangeBtn",
          text: "橙色"
        }]
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
    }, Animate.getConf({
      aniDown: true
    }), {
      label: "其他",
      content: [{
        type: "checkbox",
        name: "radius",
        text: "大圆角"
      }]
    }, {
      label: "组件边距",
      content: [{
        type: "number",
        name: "padtop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 30,
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
    }],
    dependCss: ["button", "buttonGroup", "animate.active"],
    groupConf: {
      max: 4,
      alert: "一个分组内，按钮不能超过4个！"
    },
    get: function () {
      var data = this.save();
      var buttons = [];
      var n = $.isArray(data.text) ? data.text.length : 0;
      var btn;
      var dependJS = [];
      // 如果按钮配置少于两个，则直接返回
      if (n < 2) {
        return "";
      }
      var checkOneConf = function (text, link, cmd, css, display) {
        if (text && (link || cmd)) {
          // 自动补足分享链接
          if (link.indexOf("share") === 0) {
            link = "share://";
          }
          link = link || "javascript:;";
          if (data.link === "share://" || data.cmd === "share") {
            dependJS.push("share");
          }
          if (data.cmd || data.display !== "all") {
            dependJS.push("app");
          }
          return {
            text: text,
            link: link,
            cmd: cmd,
            css: css
          };
        }
      };
      // 挑出满足要求的配置
      for (var i = 0; i < n; i++) {
        btn = checkOneConf(data.text[i], data.link[i], data.cmd[i], data.css[i], data.display);
        btn && buttons.push(btn);
      }
      if (buttons.length < 2) {
        return "";
      }
      // 声明依赖
      this.dependJS = dependJS;
      // 其他配置
      data.boxcss = tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      });
      // 返回html代码
      return ['<section class="buttonGroup button', buttons.length,
        ' dis_', data.display,
        data.radius ? " bigRadius" : "",
        '" style="', data.boxcss, '">', (function () {
          var html = [];
          var css = Animate.getCss(data);
          css.push("bigBtn");
          $.each(buttons, function (i, data) {
            html.push('<a class="' + css.join(" ") + ' ' + data.css + '"' + (data.cmd ? ' cmd="' + data.cmd + '"' : '') + ' href="' + $.safeHTML(data.link) + '">' + $.safeHTML(data.text) + "</a>");
          });
          return html.join("");
        })(),
        "</section>"
      ].join("");
    }
  });
});
