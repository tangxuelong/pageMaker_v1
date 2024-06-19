define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 视频
   */
  return Panel.extend({
    icon: "film",
    name: "video",
    NAME: "视频",
    group: "base",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*视频地址",
      content: [{
        type: "video",
        name: "src",
        dataType: "mp4",
        holder: "视频文件或地址，支持 mp4 格式"
      }]
    }, {
      label: "皮肤图片",
      content: [{
        type: "image",
        name: "bgpic",
        holder: "设置播放器背景图片"
      }]
    }, {
      label: "控制器尺寸",
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
      }]
    }, {
      label: "播放设置",
      content: [{
        type: "checkbox",
        name: "loop",
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
        min: 0,
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        min: 0,
        value: 30,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        min: 0,
        value: 24,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        min: 0,
        value: 24,
        before: "右 "
      }]
    }],
    // 样式和音频的复用，主要是控制器部分
    dependCss: ["media"],
    dependJS: ["zepto", "media"],
    initEvent: function () {
      var picInput = $("[name=bgpic]", this.wrap);
      $("[name=src]", this.wrap).bind("pic.change", function () {
        picInput.val($(this).data("pic")).trigger("input");
      });
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
      $.each(["autoplay", "loop", "frontend"], function (i, key) {
        if (data[key]) {
          checkedConf.push(key);
        }
      });
      if (!data.src) {
        return "";
      }
      $.each(checkedConf, function (i, key) {
        checkedConf[i] = checkedConf[i] + '="' + checkedConf[i] + '"';
      });

      // 检测是否为视频网站地址
      var isVideoSite = /^.{2,10}@.+/.test(data.src);
      // 构造html代码
      var html = '<video data-src="' + $.safeHTML(data.src) + '" x-webkit-airplay="allow" webkit-playsinline="true" src="' + (isVideoSite ? "{src}" : $.safeHTML(data.src)) + '" ' + checkedConf.join(" ") + ' width="100%">not support</video>';
      var cls = ["video", data.ctrlSize, "inlineTheme"];

      // 如果是动态的资源获取
      if (isVideoSite) {
        this.dependJS = ["zepto", "media", "video"];
      }
      // 如果设置了播放背景，则隐藏原生的播放界面
      if (data.bgpic) {
        html = '<div class="hide3">' + html + '</div><div class="mediaCtrl videoCtrl"><img src="' + data.bgpic + '"/><i vclick="video.click://' + data.src + '"></i></div>';
      }

      // 如果是动态分析的视频，则不能输出html
      return ['<section style="', css, '" class="', cls.join(" "), '">',
        isVideoSite ? (function () {
          var key = data.src;
          return ['<i class="vshelper" data-id="', key, '" data-html="', $.safeHTML(html), '">',
            data.bgpic ? '<img src="' + data.bgpic + '"/>' : '',
            '</i>'
          ].join("");
        })() : html,
        "</section>"
      ].join("");
    }
  });
});
