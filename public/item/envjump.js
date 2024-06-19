define([
  "jquery", "tools", "com/panel", "com/channel"
], function ($, tools, Panel, Channel) {
  /**
   * 自适应跳转组件
   */
  return Panel.extend({
    icon: "magic-wand",
    name: "envjump",
    NAME: "环境检测",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "说明",
      content: [{
        type: "text",
        text: "本组件可以识别不同的环境或状态，然后跳转到不同的页面。"
      }]
    }, {
      label: "检测类型",
      content: [{
        type: "radio",
        name: "type",
        value: 1,
        checked: true,
        text: "操作系统"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "登录判断"
      }, {
        type: "radio",
        name: "type",
        value: 3,
        text: "渠道分发"
      }, {
        type: "radio",
        name: "type",
        value: 4,
        text: "客户端内嵌"
      }]
    }, {
      label: "安卓",
      css: "layoutFor1",
      content: [{
        type: "url",
        name: "adr",
        holder: "安卓环境下，跳转链接"
      }]
    }, {
      label: "IOS",
      css: "layoutFor1",
      content: [{
        type: "url",
        name: "ios",
        holder: "IOS环境下，跳转链接"
      }]
    }, {
      label: "PC",
      css: "layoutFor1",
      content: [{
        type: "url",
        name: "pc",
        holder: "PC环境下，跳转链接"
      }]
    }, {
      label: "其他",
      css: "layoutFor1",
      content: [{
        type: "url",
        name: "other",
        holder: "其他环境（winPhone等），跳转链接地址"
      }]
    }, {
      label: "新用户",
      css: "layoutFor2",
      content: [{
        type: "url",
        name: "newuser",
        holder: "没有URS登录记录的新用户 de 跳转链接"
      }]
    }, {
      label: "未登录",
      css: "layoutFor2",
      content: [{
        type: "url",
        name: "notlogin",
        holder: "有登录记录，但未登录的用户 de 跳转链接"
      }]
    }, {
      label: "登录",
      css: "layoutFor2",
      content: [{
        type: "url",
        name: "login",
        holder: "前端检测已登录用户 de 跳转链接，可能检测失误"
      }]
    }, {
      label: "说明",
      css: "layoutFor3",
      content: [{
        type: "text",
        text: "组件会根据格式自动分析URL或者UA中的渠道信息，key=value是URL渠道格式，key/value是UA渠道格式。"
      }]
    }, {
      label: "渠道配置",
      css: "layoutFor3",
      content: [{
        type: "text",
        text: "<a href='#group-add'>+增加渠道</a>　" + Channel.docLink
      }, {
        type: "inputGroup",
        addon: "渠道",
        name: "from",
        holder: "渠道分发标志，比如from=123或channel/appstore，以逗号分组",
        groupCss: "group_first"
      }, {
        type: "urlGroup",
        addon: "链接",
        name: "link",
        holder: "跳转的地址，支持{value}占位符",
        groupCss: "group_last"
      }, {
        type: "text",
        text: "<a href='#group-add'>+增加渠道</a>　" + Channel.docLink
      }]
    }, {
      label: "内嵌访问",
      css: "layoutFor4",
      content: [{
        type: "url",
        name: "ownapp",
        holder: "项目APP内嵌访问时 de 跳转链接"
      }]
    }, {
      label: "微信内嵌",
      css: "layoutFor4",
      content: [{
        type: "url",
        name: "weixin",
        holder: "微信内嵌访问时 de 跳转链接"
      }]
    }, {
      label: "易信内嵌",
      css: "layoutFor4",
      content: [{
        type: "url",
        name: "yixin",
        holder: "易信内嵌访问时 de 跳转链接"
      }]
    }, {
      label: "其他",
      css: "layoutFor4",
      content: [{
        type: "url",
        name: "otherenv",
        holder: "非上述环境中 de 跳转链接"
      }]
    }, {
      label: "预览",
      content: [{
        type: "checkbox",
        name: "nojump",
        checked: true,
        text: "预览时不跳转"
      }]
    }],
    typeSwitch: {
      typeSelector: "[name*=type]",
      prefixCss: "layoutFor"
    },
    get: function () {
      var data = this.save();
      var jsFunc = "nodef";
      var jsPara = {};
      // 按照类型输出
      switch (data.type) {
        case "1":
          // 系统检测
          this.dependJS = ["lib/os", "envjump"];
          if (!data.adr && !data.ios && !data.pc && !data.other) {
            return this.error("请配置至少一项跳转地址");
          }
          jsFunc = "jumpForSys";
          jsPara = {
            ios: data.ios,
            android: data.adr,
            pc: data.pc,
            other: data.other
          };
          break;
        case "2":
          // 用户检测
          this.dependJS = ["lib/user", "envjump"];
          if (!data.newuser && !data.notlogin && !data.login) {
            return this.error("请配置至少一项跳转地址");
          }
          jsFunc = "jumpForUser";
          jsPara = {
            newu: data.newuser,
            no: data.notlogin,
            yes: data.login
          };
          break;
        case "3":
          // 渠道检测
          this.dependJS = ["lib/url", "envjump"];
          if (!data.from || !data.link) {
            return this.error("请配置至少一个渠道跳转信息");
          }
          if (!$.isArray(data.from)) {
            data.from = [data.from];
            data.link = [data.link];
          }

          // 同样渠道信息配置冲突提示
          var allFromInfo = Channel.getInfo(data.from.join(","));
          if (allFromInfo.errData) {
            return this.error('以下渠道码配置错误：' + allFromInfo.errData.join("、"));
          }
          if (allFromInfo.sameData) {
            return this.error('以下渠道码配置重复：' + allFromInfo.sameData.join("、"));
          }

          // 统一格式化输出
          data.from = $.map(data.from, function (conf, index) {
            return Channel.getInfo(conf).list.join(",")
          });

          // 定义函数名和参数
          jsFunc = "jumpForSrc";
          jsPara = {
            fr: data.from,
            url: data.link
          };
          break;
        case "4":
          this.dependJS = ["app", "lib/env", "envjump"];
          if (!data.ownapp && !data.weixin && !data.yixin && !data.otherenv) {
            return this.error("请配置至少一项跳转地址");
          }
          jsFunc = "jumpForWebview";
          jsPara = {
            app: data.ownapp,
            weixin: data.weixin,
            yixin: data.yixin,
            x: data.otherenv
          };
          break;
      }
      jsPara.pre = data.nojump;
      return '<script>window.' + jsFunc + '&&' + jsFunc + '(' + JSON.stringify(jsPara) + ')</' + 'script>'
    }
  });
});
