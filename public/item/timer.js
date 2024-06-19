define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 倒计时组件
   */
  return Panel.extend({
    icon: "alarm",
    name: "timer",
    NAME: "倒计时",
    group: "ext",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*目标时间",
      content: [{
        type: "text",
        text: [
          "1、可配置多组时间，按照顺序从上到下顺序执行；",
          "2、模板占位符：{d} 天，{h} 小时，{m} 分，{s} 秒；",
          "3、模板占位符可以重叠表示双位输出，比如剩余5小时，{h} 输出为 5，而 {hh} 输出 05。",
          "<a href='#group-add'>+增加配置</a>"
        ].join("<br>")
      }, {
        type: "inputGroup",
        addon: "目标时间",
        name: "time",
        holder: "倒计时目标时间，格式 2016-6-15 00:00:00",
        groupCss: "group_first"
      }, {
        type: "inputGroup",
        addon: "默认模板",
        name: "tmpl1",
        value: "{dd} 天 {hh} : {mm} : {ss}",
        holder: "当前倒计时默认的输出模板",
        groupCss: "group_middle"
      }, {
        type: "inputGroup",
        addon: "小于一天",
        name: "tmpl2",
        value: "{hh} : {mm} : {ss}",
        holder: "剩余时间小于一天的模板",
        groupCss: "group_middle"
      }, {
        type: "inputGroup",
        addon: "小于一时",
        name: "tmpl3",
        value: "",
        holder: "剩余时间小于一小时的模板",
        groupCss: "group_middle"
      }, {
        type: "inputGroup",
        addon: "小于一分",
        name: "tmpl4",
        value: "",
        holder: "剩余时间小于一分钟的模板",
        groupCss: "group_last"
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加配置</a>"
      }]
    }, {
      label: "结束时文案",
      content: [{
        type: "input",
        name: "overText",
        holder: "全部倒计时结束后显示的文案，不配则隐藏"
      }]
    }, {
      label: "结束时跳转",
      content: [{
        type: "url",
        name: "overJump",
        holder: "全部倒计时结束后跳转到另外一个页面，不配不跳转"
      }]
    }, {
      label: "定位",
      content: [{
        type: "radio",
        name: "pos",
        value: 1,
        text: "正常",
        checked: true
      }, {
        type: "radio",
        name: "pos",
        value: 2,
        text: "固定到顶部"
      }]
    }, {
      label: "配色",
      content: [{
        text: "文字颜色",
        type: "color",
        name: "fontColor",
        value: "#d91d37"
      }, {
        text: "数字颜色",
        type: "color",
        name: "numColor",
        value: "#f9f8f0"
      }, {
        text: "数字背景",
        type: "color",
        name: "numBgColor",
        value: "#d91d37"
      }]
    }, {
      label: "背景",
      content: [{
        type: "background",
        colorName: "bgColor",
        colorValue: "#f9f8f0",
        imageName: "bgImage",
        holder: "背景图，宽度撑满不平铺"
      }]
    }, {
      label: "垂直微调",
      css: "layoutFor2",
      content: [{
        type: "radio",
        name: "offset",
        value: "mtop",
        text: "略靠上"
      }, {
        type: "radio",
        name: "offset",
        value: "mid",
        checked: true,
        text: "居中"
      }, {
        type: "radio",
        name: "offset",
        value: "mbtm",
        text: "略靠下"
      }, {
        type: "text",
        text: "<small>仅当固定到顶部 并且 设置了背景图时生效</small>"
      }]
    }, {
      label: "变化动效",
      content: (function () {
        var arr = [];
        $.each(["null",
          /* "bounce", */
          "rubberBand", "tada", "jello", "wobble",
          "headShake", "bounceIn", "fadeIn", "flipInX",
          "flipInY", "rotateOutDownLeft", "slideOutDown"
        ], function (i, key) {
          arr.push({
            type: "radio",
            name: "animate",
            value: key,
            checked: key === "null",
            text: key === "null" ? "无" : key
          })
        });
        return arr;
      })()
    }, {
      label: "动效应用",
      content: [{
        type: "checkbox",
        name: "aniFor",
        checked: true,
        text: "默认模板"
      }, {
        type: "checkbox",
        name: "aniFor",
        checked: true,
        text: "小于一天"
      }, {
        type: "checkbox",
        name: "aniFor",
        checked: true,
        text: "小于一时"
      }, {
        type: "checkbox",
        name: "aniFor",
        checked: true,
        text: "小于一分"
      }]
    }, {
      label: "图标",
      content: [{
        text: "无",
        type: "radio",
        name: "icon",
        value: "null"
      }, {
        text: "钟表1",
        type: "radio",
        name: "icon",
        value: "clock"
      }, {
        text: "钟表2",
        type: "radio",
        name: "icon",
        value: "clock2"
      }, {
        text: "闹钟",
        type: "radio",
        name: "icon",
        checked: true,
        value: "alarm"
      }, {
        text: "秒表",
        type: "radio",
        name: "icon",
        value: "stopwatch"
      }, {
        text: "沙漏",
        type: "radio",
        name: "icon",
        value: "glass"
      }, {
        text: "火",
        type: "radio",
        name: "icon",
        value: "fire"
      }]
    }, {
      label: "字号",
      content: [{
        type: "radio",
        name: "fs",
        text: "大",
        value: 3
      }, {
        type: "radio",
        name: "fs",
        text: "中",
        value: 2,
        checked: true
      }, {
        type: "radio",
        name: "fs",
        text: "小",
        value: 1
      }]
    }, {
      label: "组件内边距",
      content: [{
        type: "number",
        name: "padtop",
        value: 10,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 10,
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
      typeSelector: "[name*=pos]",
      prefixCss: "layoutFor"
    },
    dependCss: ["timer", "animate.attention"],
    dependJS: ["zepto", "timer"],
    afterAdd: function () {
      $("[name=time]", this.wrap).datetimepicker({
        forceParse: false,
        format: "yyyy-mm-dd hh:ii:00"
      });
    },
    initEvent: function () {
      this.afterAdd();
    },
    get: function () {
      var data = this.save();
      var tmpl1 = data.tmpl1;
      var tmpl2 = data.tmpl2;
      var tmpl3 = data.tmpl3;
      var tmpl4 = data.tmpl4;
      var time = data.time;
      // 仅仅一个配置的转化为数组
      if (!$.isArray(time)) {
        tmpl1 = [tmpl1];
        tmpl2 = [tmpl2];
        tmpl3 = [tmpl3];
        tmpl4 = [tmpl4];
        time = [time];
      }
      var conf = {
        timers: [],
        overText: data.overText,
        overJump: data.overJump,
        animate: data.animate,
        aniFor: data.aniFor,
        icon: data.icon
      };
      // 检查并过滤分组配置
      $.each(time, function (i, t) {
        var num = Date.parse(t.replace(/\-/g, "/"));
        if (num && tmpl1[i]) {
          conf.timers.push({
            t: num,
            p1: tmpl1[i],
            p2: tmpl2[i],
            p3: tmpl3[i],
            p4: tmpl4[i]
          });
        }
      });
      if (conf.timers.length === 0) {
        return "";
      }

      var css = tools.getCss({
        color: data.fontColor,
        "background-color": data.bgColor
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

      // 2016-12-29 动效flipInX 和 flipInY 会导致IOS下蒙层闪动
      // 处理方法：给外容器添加 overflow:hidden 即可
      if (data.animate.indexOf("flipIn") === 0) {
        css += ";overflow:hidden";
      }

      // 自定义颜色输出
      var customStyle = [
        '#' + this.did + '{' + css + '}',
        '#' + this.did + ' i{',
        data.numColor ? 'color:' + data.numColor + ';' : '',
        data.numBgColor ? 'background-color:' + data.numBgColor : '',
        '}'
      ].join("");

      // 样式
      var cls = ["timer", "fs" + data.fs];
      var isFixed = data.pos === "2";
      data.bgImage && cls.push("imgTimer");
      isFixed && cls.push("fixedTimer");
      if (isFixed && data.bgImage) {
        cls.push(data.offset);
      }

      // 输出html内容以及js配置信息
      return [
        '<style>' + customStyle + '</style>',
        '<script>window.timerCache.' + this.did + '=' + JSON.stringify(conf) + ';</', 'script>',
        '<section class="' + cls.join(" ") + '">',
        isFixed ? '<div class="fixInnerSec">' : '',
        '<div id="' + this.did + '">',
        '<div class="timerwrap">加载中...</div>',
        data.bgImage ? '<img src="' + data.bgImage + '"/>' : '',
        '</div>',
        isFixed ? '</div>' : '',
        '</section>'
      ].join("");
    }
  });
});
