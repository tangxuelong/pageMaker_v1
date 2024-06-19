define([
  "jquery", "tools", "com/panel", "com/channel"
], function ($, tools, Panel, Channel) {
  /**
   * 客户端App下载链接
   */
  return Panel.extend({
    icon: "download2",
    name: "app",
    NAME: "APP下载",
    group: "ext",
    init: function () {
      this.did = "dl" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "使用说明",
      content: [{
        type: "text",
        text: "该组件可以生成一个用于下载的url（格式 download://xxxx）配置到同页面的其他组件中即可生效。"
      }]
    }, {
      label: "*安卓最新包",
      content: [{
        type: "url",
        name: "apk",
        holder: "输入最新 apk 下载地址"
      }]
    }, {
      label: "*苹果最新包",
      content: [{
        type: "url",
        name: "appstroe",
        holder: "输入 AppStore 下载地址"
      }]
    }, {
      label: "应用宝",
      content: [{
        type: "url",
        name: "appbao",
        holder: "输入腾讯应用宝App下载地址以优化微信内下载"
      }]
    }, {
      label: "安卓启动命令",
      content: [{
        type: "cmd",
        name: "appcmd",
        holder: "输入APP启动命令以尝试启动APP，比如 netease://hall，仅安卓生效"
      }]
    }, {
      label: "微信弹层",
      content: [{
        type: "image",
        name: "wxtip",
        holder: "微信下载时提示在浏览器中打开"
      }]
    }, {
      label: "渠道信息",
      content: [{
        type: "text",
        text: "<a href='#group-add'>+增加渠道</a>　" + Channel.docLink
      }, {
        type: "inputGroup",
        addon: "渠道码",
        name: "from",
        holder: "渠道分发标志，比如from=123或channel/appstore，以逗号分组",
        groupCss: "group_first"
      }, {
        type: "urlGroup",
        addon: "安卓包",
        name: "adrApp",
        holder: "针对该渠道的最新 apk 下载地址，支持{value}占位符",
        groupCss: "group_middle"
      }, {
        type: "urlGroup",
        addon: "苹果包",
        name: "iosApp",
        holder: "针对该渠道的最新 AppStore 下载地址",
        groupCss: "group_middle"
      }, {
        type: "urlGroup",
        addon: "应用宝",
        name: "baoApp",
        holder: "应用宝App下载地址，支持{value}占位符",
        groupCss: "group_middle"
      }, {
        type: "cmdGroup",
        addon: "启动码",
        name: "cmd",
        holder: "安卓APP启动命令，比如 netease://hall",
        groupCss: "group_last"
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加渠道</a>　" + Channel.docLink
      }]
    }, {
      label: "自动下载",
      content: [{
        type: "input",
        name: "auto",
        holder: "url中自动下载标记，默认是 auto=start"
      }]
    }, {
      label: "其他",
      content: [{
        type: "checkbox",
        name: "likeWX",
        checked: true,
        text: "预览时模拟微信"
      }, {
        type: "checkbox",
        name: "safari",
        text: "启用Safari的通用App下载提示",
        checked: true,
        info: "Safari自带的功能，可检测App是否安装。其他浏览器或内嵌环境不具有此功能"
      }, {
        type: "checkbox",
        name: "ignorebao",
        text: "安卓下忽略应用宝设置",
        info: "当您配置的应用宝地址不能在安卓环境满足预期，请勾选此项"
      }, {
        type: "checkbox",
        checked: true,
        name: "lownet",
        text: "低网速下载确认",
        info: "当检测出用户在低网速下访问并下载时，进行确认。IOS中无效。"
      }]
    }, {
      label: "触发方式",
      content: [{
        type: "text",
        text: "设置链接：<code class='linkDemo'></code> 或脚本调用：<code class='jsDemo'></code>"
      }]
    }],
    dependCss: ["appdown"],
    dependJS: ["zepto", "lib/url", "lib/net", "appdown"],
    initEvent: function () {
      $(".linkDemo", this.wrap).text("download://" + this.did);
      $(".jsDemo", this.wrap).text('$.download("' + this.did + '")');
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
    get: function () {
      // 获取配置数据
      var data = this.save();
      if (!data.apk || !data.appstroe) {
        return this.error("请配置完整的安卓和IOS下载地址。");
      }

      // 强制转化为数组
      $.each(["from", "adrApp", "iosApp", "baoApp"], function (i, key) {
        if (typeof data[key] === "string") {
          data[key] = [data[key]];
        }
      });

      // 过滤有效的配置
      var n = data.from.length;
      var i = 0;
      var conf;
      var fromData = [];
      var froms = [];
      for (; i < n; i++) {
        conf = {
          from: data.from[i],
          // 排除跟通用设置一样的配置，以节约输出
          apk: data.adrApp[i] === data.apk ? "" : data.adrApp[i],
          ios: data.iosApp[i] === data.appstroe ? "" : data.iosApp[i],
          bao: data.baoApp[i] === data.appbao ? "" : data.baoApp[i],
          cmd: data.cmd[i] === data.appcmd ? "" : data.cmd[i]
        };
        // 过滤有效设置
        if (conf.from && (conf.apk || conf.ios || conf.bao || conf.cmd)) {
          fromData.push(conf);
          froms.push(conf.from);
        }
      }

      // 检查from配置
      var allFromInfo = Channel.getInfo(froms.join(","));
      if (allFromInfo.errData) {
        return this.error('以下渠道码配置错误：' + allFromInfo.errData.join("、"));
      }
      if (allFromInfo.sameData) {
        return this.error('以下渠道码配置重复：' + allFromInfo.sameData.join("、"));
      }

      // 统一格式化输出
      $.map(fromData, function (conf, index) {
        conf.from = Channel.getInfo(conf.from).list.join(",");
        return conf;
      });

      // 输出js配置
      var output = {
        safari: data.safari,
        apk: data.apk,
        ios: data.appstroe,
        bao: data.appbao,
        cmd: data.appcmd,
        tip: data.wxtip,
        ignorebao: data.ignorebao,
        auto: data.auto || "auto=start",
        from: fromData,
        lownet: data.lownet
      };
      return '<script>' + (data.likeWX ? 'window.likeWX=true;' : '') + 'window.downloadCache.' + data.did + '=' + JSON.stringify(output) + ';</' + 'script>'
    }
  });
});
