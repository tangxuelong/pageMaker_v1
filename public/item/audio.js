define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 音频
   */
  return Panel.extend({
    icon: "music",
    name: "audio",
    NAME: "音频",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*音频地址",
      content: [{
        type: "input",
        name: "src",
        dataType: "wav,mp3",
        holder: "音频在线地址，支持 wav/mp3 格式"
      }]
    }, {
      label: "显示类型",
      content: [{
        type: "radio",
        name: "type",
        value: 3,
        checked: true,
        text: "无图模式"
      }, {
        type: "radio",
        name: "type",
        value: 1,
        text: "背景模式"
      }, {
        type: "radio",
        name: "type",
        value: 4,
        text: "海报模式"
      }, {
        type: "radio",
        name: "type",
        value: 2,
        text: "浮动模式"
      }]
    }, {
      label: "*皮肤图片",
      css: "layoutFor1 layoutFor4",
      content: [{
        type: "image",
        name: "bgpic",
        holder: "设置播放器背景图片或海报图片"
      }]
    }, {
      label: "*音频标题",
      css: "layoutFor3 layoutFor4",
      content: [{
        type: "input",
        name: "title",
        holder: "音频主标题##第二行显示为副标"
      }]
    }, {
      label: "外观",
      css: "layoutFor2",
      content: [{
        type: "radio",
        name: "theme",
        value: 1,
        checked: true,
        text: "乐符"
      }, {
        type: "radio",
        name: "theme",
        value: 2,
        text: "铃铛"
      }, {
        type: "radio",
        name: "theme",
        value: 3,
        text: "耳机"
      }, {
        type: "radio",
        name: "theme",
        value: 4,
        text: "喇叭"
      }]
    }, {
      label: "颜色",
      css: "layoutFor2",
      content: [{
        type: "color",
        name: "color",
        value: "#333"
      }]
    }, {
      label: "定位",
      css: "layoutFor2",
      content: [{
        type: "radio",
        name: "pos",
        value: 1,
        text: "左上角"
      }, {
        type: "radio",
        name: "pos",
        value: 2,
        checked: true,
        text: "右上角"
      }, {
        type: "radio",
        name: "pos",
        value: 3,
        text: "左下角"
      }, {
        type: "radio",
        name: "pos",
        value: 4,
        text: "右下角"
      }]
    }, {
      label: "控制器尺寸",
      css: "layoutFor1 layoutFor2",
      content: [{
        type: "radio",
        name: "ctrlSize",
        value: "bigCtrl",
        text: "大"
      }, {
        type: "radio",
        name: "ctrlSize",
        value: "normalCtrl",
        checked: true,
        text: "中"
      }, {
        type: "radio",
        name: "ctrlSize",
        value: "smallCtrl",
        text: "小"
      }, {
        type: "radio",
        name: "ctrlSize",
        value: "miniCtrl",
        text: "mini"
      }]
    }, {
      label: "控制器位置",
      css: "layoutFor1",
      content: [{
        type: "radio",
        name: "ctrlPos",
        value: "left",
        text: "左"
      }, {
        type: "radio",
        name: "ctrlPos",
        value: "center",
        checked: true,
        text: "中"
      }, {
        type: "radio",
        name: "ctrlPos",
        value: "right",
        text: "右"
      }]
    }, {
      label: "配色方案",
      css: "layoutFor3",
      content: [{
        type: "radio",
        name: "skin",
        value: "gray",
        checked: true,
        text: "灰色"
      }]
    }, {
      label: "播放设置",
      content: [{
        type: "checkbox",
        name: "loop",
        checked: true,
        text: "循环播放"
      }, {
        type: "checkbox",
        name: "autoplay",
        text: "自动播放",
        alert: "部分设备或环境不支持"
      }, {
        type: "checkbox",
        name: "frontend",
        checked: true,
        text: "禁止后台播放",
        alert: "部分设备或环境不支持"
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
    dependJS: ["zepto", "media"],
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
      });
      var checkedConf = ["preload", "controls"];
      var style, cls;
      if (!data.src) {
        return "";
      }
      $.each(["autoplay", "loop", "frontend"], function (i, key) {
        if (data[key]) {
          checkedConf.push(key);
        }
      });
      $.each(checkedConf, function (i, key) {
        checkedConf[i] = checkedConf[i] + '="' + checkedConf[i] + '"';
      });
      var html = '<audio src="' + tools.safeHTML(data.src) + '" ' + checkedConf.join(" ") + ' width="100%">not support</audio>';
      // 根据显示类型处理
      switch (data.type) {
        case "1": // 背景模式
          if (!data.bgpic) return "";
          this.dependCss = ["media"];
          cls = [data.ctrlSize, "inlineTheme", data.ctrlPos];
          html = '<div class="hide3">' + html + '</div><div class="mediaCtrl audioCtrl"><img src="' + data.bgpic + '"/><i></i></div>';
          break;
        case "3": // 无图模式
        case "4": // 海报模式
          if (!data.title) return "";
          if (data.type === "4" && !data.bgpic) return;
          cls = ["inlineTheme"];
          this.dependCss = ["media", "audio"];
          var title = data.title.split("##");
          var h1 = title[0];
          var h2 = title[1];
          var kind = data.type === "3" ? "audioJustText" : "audioWithImg";
          // 拼接html代码
          html = ['<div class="hide3">', html, '</div>',
            '<div class="mediaCtrl audioCtrl ' + kind + '">',
            data.type === "4" ? '<img src="' + data.bgpic + '"/>' : '',
            '<ul class="audioBox"><li><i></i></li><li>',
            '<h1>' + tools.safeHTML(h1) + '</h1>',
            h2 ? '<h2>' + tools.safeHTML(h2) + '</h2>' : '',
            '</li></ul>',
            '</div>'
          ].join("");
          break;
        case "2": // 浮动定位
          this.dependCss = ["audio2"];
          cls = [data.ctrlSize, "floatTheme", "theme" + data.theme, "pos" + data.pos];
          style = '<style>.floatTheme .' + this.id + ' i:before{color:' + data.color + ';}</style>';
          html = '<div class="hide3">' + html + style + '</div><div class="mediaCtrl audioCtrl ' + this.id + '"><i></i></div>';
          break;
      }
      // 返回
      cls.push("audio");
      return '<section style="' + css + '" class="' + cls.join(" ") + '">' + html + "</section>";
    }
  });
});
