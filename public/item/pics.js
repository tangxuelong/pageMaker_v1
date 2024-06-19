define([
  "jquery", "tools", "com/panel", "com/animate", "com/image"
], function ($, tools, Panel, Animate, holderImage) {
  /**
   * 图片轮播
   */
  return Panel.extend({
    icon: "images",
    name: "pics",
    NAME: "轮播图",
    group: "ext",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*图片配置",
      content: [{
        type: "text",
        text: "配置两组以上方可生效 <a href='#group-add'>+增加配图</a>"
      }, {
        type: "imageGroup",
        addon: "主图",
        name: "image",
        holder: "输入完整图片地址，或上传图片",
        groupCss: "group_first"
      }, {
        type: "imageGroup",
        addon: "蒙图",
        name: "image1",
        holder: "蒙图1，方位默认 l，动作设置格式：方位>URL地址",
        groupCss: "group_middle"
      }, {
        type: "imageGroup",
        addon: "蒙图",
        name: "image2",
        holder: "蒙图2，方位默认 r，方位可选：l / r / t / b",
        groupCss: "group_middle"
      }, {
        type: "inputGroup",
        addon: "配文",
        name: "text",
        holder: "配图文字，可选，换行使用 #",
        groupCss: "group_middle"
      }, {
        type: "urlGroup",
        addon: "链接",
        name: "url",
        holder: "图片链接地址，可选",
        groupCss: "group_last"
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加配图</a>"
      }]
    }, {
      label: "配文",
      content: [{
        type: "radio",
        name: "subType",
        value: 1,
        checked: true,
        text: "不显示"
      }, {
        type: "radio",
        name: "subType",
        value: 2,
        text: "内部单行"
      }, {
        type: "radio",
        name: "subType",
        value: 3,
        text: "内部多行"
      }, {
        type: "radio",
        name: "subType",
        value: 4,
        text: "外部多行"
      }]
    }, {
      label: "配文颜色",
      css: "layoutFor4",
      content: [{
        type: "color",
        name: "subColor",
        value: "#5d5d5d"
      }]
    }, {
      label: "配文字号",
      css: "layoutFor2 layoutFor3 layoutFor4",
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
      label: "缩略点类型",
      content: [{
        type: "radio",
        name: "dottype",
        value: "1",
        text: "圆点",
        checked: true
      }, {
        type: "radio",
        name: "dottype",
        value: "2",
        text: "方块"
      }, {
        type: "radio",
        name: "dottype",
        value: "3",
        text: "数字"
      }]
    }, {
      label: "缩略点位置",
      content: [{
        type: "radio",
        name: "dotpos",
        value: "0",
        text: "不显示"
      }, {
        type: "radio",
        name: "dotpos",
        value: "11",
        text: "外部居左"
      }, {
        type: "radio",
        name: "dotpos",
        value: "1",
        text: "外部居中",
        checked: true
      }, {
        type: "radio",
        name: "dotpos",
        value: "12",
        text: "外部居右"
      }, {
        type: "radio",
        name: "dotpos",
        value: "2",
        text: "内部居右"
      }]
    }, Animate.getConf(), {
      label: "定位方式",
      content: [{
        type: "radio",
        name: "pos",
        value: "0",
        text: "默认",
        checked: true
      }, {
        type: "radio",
        name: "pos",
        value: "1",
        text: "底部浮层"
      }]
    }, {
      label: "自动轮播",
      content: [{
        type: "number",
        name: "timer",
        min: 0,
        max: 5,
        value: 3,
        after: "秒"
      }]
    }, {
      label: "背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "transparent",
        imageName: "bgimage",
        holder: "背景图，宽度撑满且纵向平铺"
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
      typeSelector: "[name*=subType]",
      prefixCss: "layoutFor"
    },

    // 获取蒙层html
    getMaskHTML: function (mask, type) {
      if (/^(.+)>(.+)$/.test(mask)) {
        mask = RegExp.$2;
        type = RegExp.$1.toLowerCase();
      }
      // 同时设置缩写
      type = {
        l: "left",
        r: "right",
        t: "top",
        b: "bottom"
      }[type] || type || "left";
      return !mask ? Promise.resolve('') : holderImage.getImageData(mask, "mask " + type)
        .then(function (imageData) {
          return imageData.html;
        });
    },
    get: function () {
      var data = this.save();
      var subType = data.subType;
      var images = data.image;
      var images1 = data.image1;
      var images2 = data.image2;
      var texts = data.text;
      var urls = data.url;
      var textConf = {
        style: "",
        css: ""
      };
      var aniCss = Animate.getCss(data);
      if (!$.isArray(images)) {
        return "";
      }
      // 获取配文字号、颜色
      if (data.subType === "4") {
        textConf.style = "color:" + data.subColor;
      }
      if (Number(data.subType) > 1) {
        textConf.css = "fs" + data.size;
      }
      var css = {
        2: "swipeSec textSwipe",
        3: "swipeSec textSwipe nowrap",
        4: "swipeSec textSwipe nowrap outer"
      }[subType] || "swipeSec";
      var lib = this;
      // 遍历函数
      var eachData = function (fn) {
        for (var i = 0, n = images.length; i < n; i++) {
          if (images[i]) {
            fn(images[i], images1[i], images2[i], texts[i], urls[i], subType);
          }
        }
      };
      // 加载依赖
      this.dependCss = ["swipe", "animate.active"].concat(holderImage.css);
      this.dependJS = ["zepto", "swipe"].concat(holderImage.js);
      // 获得图片链接的html代码
      var getImageLink = function (image, mask1, mask2, text, url, type) {
        return holderImage.getImageData(image)
          .then(function (imageData) {
            return Promise.all([
              lib.getMaskHTML(mask1, "left"),
              lib.getMaskHTML(mask2, "right")
            ]).then(function (maskArr) {
              return imageData.html + maskArr.join("");
            });
          }).then(function (html) {
            // 包括配文
            if (Number(type) >= 2) {
              html += '<span style="' + textConf.style + '" class="' + textConf.css + '">' + (tools.safeHTML(text).replace(/#/g, "<br>") || "&nbsp;") + '</span>';
            }
            if (url) {
              html = "<a href='" + tools.safeHTML(url) + "'><div class='" + aniCss.join(" ") + "'>" + html + "</div></a>";
            }
            return html;
          });
      };
      // 所有同步异步处理过程用promise串联起来
      var allJobs = Promise.resolve(['<section class="', css, ' swipeSecPos', data.pos, '" style="',
        tools.getPaddingStyle({
          top: data.martop,
          bottom: data.marbtm,
          left: data.marl,
          right: data.marr
        }, "margin"), ";", tools.getCss({
          "background-color": data.bgcolor,
          "background-image": "url(" + data.bgimage + ")"
        }), '">',
        // 插入一个占位图片，保证最小为一个背景图高度
        data.bgimage ? '<img src="' + data.bgimage + '" class="swipe-imgHolder"/>' : '',
        '<div class="swipe-wrapHolder" style="',
        tools.getPaddingStyle({
          top: data.padtop,
          bottom: data.padbtm,
          left: data.padl,
          right: data.padr
        }), ";", '">',
        '<div class="swipe" rel="', data.timer, '">',
        '<div class="swipeWrap">'
      ].join(""));
      eachData(function (image, mask1, mask2, text, url, type) {
        allJobs = allJobs.then(function (globalHTML) {
          return getImageLink(image, mask1, mask2, text, url, type)
            .then(function (html) {
              return globalHTML + '<div class="swipeItem">' + html + '</div>';
            });
        });
      });
      // 收尾
      return allJobs.then(function (globalHTML) {
        return globalHTML + ['</div></div>', (function () {
            if (data.dotpos === "0") { // 不显示缩略点
              return "";
            }
            var html = [];
            var k = 0;
            if (data.dottype === "3") { // 数字格式
              html = ['<b style="' + textConf.style + '" class="' + (textConf.css || "fs2") + '">-/-</b>'];
            } else {
              eachData(function () {
                html[k] = "<i rel='" + k + "'></i>";
                k++;
              });
              if (k < 2) {
                return "";
              }
            }
            return '<div class="swipeCtrl ctrlPos' + data.dotpos + ' ctrlType' + data.dottype + '">' + html.join("") + '</div>';
          })(),
          '</div>',
          "</section>"
        ].join("")
      });
    }
  });
});
