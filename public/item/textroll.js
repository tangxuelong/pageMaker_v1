define([
  "jquery", "tools", "com/panel", "com/md"
], function ($, tools, Panel, Markdown) {
  /**
   * 滚动字幕
   */
  var iconCodeArr = ["e91a", "ea27", "e951", "e977", "e970", "e9a9", "e99f", "e9cc"];

  function getIconList(name, chk, nullMean) {
    var ops = [{
      type: "radio",
      name: name,
      value: "null",
      checked: chk === -1,
      text: nullMean
    }];
    $.each(iconCodeArr, function (i, code) {
      ops.push({
        type: "radio",
        name: name,
        value: code,
        checked: (chk || 0) === i,
        text: "<span class='textRoll'>" + unescape("%u" + code) + "</span>"
      });
    });
    return ops;
  }

  return Panel.extend({
    icon: "file-text2",
    name: "textroll",
    NAME: "滚动字幕",
    group: "ext",
    init: function () {
      this.callSuper();
      this.did = "text" + String.random();
    },
    tmpl: [{
      label: "图标",
      content: getIconList("icon", 1, "无")
    }, {
      label: "方向",
      content: [{
        type: "radio",
        name: "roll",
        value: "x",
        checked: true,
        text: "横向(左←右)"
      }, {
        type: "radio",
        name: "roll",
        value: "y",
        text: "纵向(下→上)"
      }]
    }, {
      label: "字幕",
      content: [{
        type: "textarea",
        name: "texts",
        holder: "以行为单位，输入多组字幕请回车，加粗强调用 *星号*。"
      }]
    }, {
      label: "颜色",
      content: [{
        type: "color",
        text: "字幕色",
        name: "color",
        value: "#5d5d5d"
      }, {
        type: "color",
        text: "图标色",
        name: "icolor",
        value: ""
      }, {
        type: "color",
        text: "强调色",
        name: "bcolor",
        value: ""
      }]
    }, {
      label: "字号",
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
      label: "对齐",
      css: "layoutFor-y",
      content: [{
        type: "radio",
        name: "align",
        value: "left",
        checked: true,
        text: "靠左"
      }, {
        type: "radio",
        name: "align",
        value: "center",
        text: "居中"
      }]
    }, {
      label: "滚动速度",
      content: [{
        type: "radio",
        name: "rollSpeed",
        value: 3,
        text: "快"
      }, {
        type: "radio",
        name: "rollSpeed",
        value: 2,
        checked: true,
        text: "中"
      }, {
        type: "radio",
        name: "rollSpeed",
        value: 1,
        text: "慢"
      }]
    }, {
      label: "停顿间隔",
      css: "layoutFor-y",
      content: [{
        type: "radio",
        name: "rollWait",
        value: 3,
        text: "长"
      }, {
        type: "radio",
        name: "rollWait",
        value: 2,
        checked: true,
        text: "中"
      }, {
        type: "radio",
        name: "rollWait",
        value: 1,
        text: "短"
      }]
    }, {
      label: "字幕间距",
      css: "layoutFor-x",
      content: [{
        type: "radio",
        name: "itemSP",
        value: 4,
        text: "4"
      }, {
        type: "radio",
        name: "itemSP",
        value: 3,
        checked: true,
        text: "3"
      }, {
        type: "radio",
        name: "itemSP",
        value: 2,
        text: "2"
      }, {
        type: "radio",
        name: "itemSP",
        value: 1,
        text: "1"
      }]
    }, {
      label: "背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "",
        imageName: "bgimage",
        holder: "背景图，高度撑满不平铺"
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
      typeSelector: "[name*=roll__]",
      prefixCss: "layoutFor-"
    },
    dependCss: ["textRoll"],
    dependJS: ["zepto", "textRoll"],
    get: function () {
      var data = this.save();
      if (!data.texts) {
        return;
      }

      var cls = ["textRollSec", "roll-" + data.roll, "fs" + data.size];
      var ops = {
        speed: data.rollSpeed
      };

      switch (data.roll) {
        case "x":
          cls.push("sp" + data.itemSP);
          break;
        case "y":
          cls.push("align-" + data.align);
          ops.wait = data.rollWait;
          break;
      }

      // 检查是否增加前置的图标
      var iconHtml = '';
      if (data.icon !== "null") {
        iconHtml = '<span class="textRoll">' + unescape("%u" + data.icon) + '</span>';
        cls.push('iconShow');
      }

      // 返回html代码和script启动脚本
      return [
        '<style>',
        (function (id) {
          // 最外层元素的自定义样式
          var css = tools.getCss({
            color: data.color,
            "background-color": data.bgcolor,
            "background-image": data.bgimage ? "url(" + data.bgimage + ")" : ""
          }) + ";" + tools.getPaddingStyle({
            top: data.martop,
            bottom: data.marbtm,
            left: data.marl,
            right: data.marr
          }, "margin");

          // 为了设置自动高度的图片，padding通过内部单独元素设置
          var padCss = tools.getPaddingStyle({
            top: data.padtop,
            bottom: data.padbtm,
            left: data.padl,
            right: data.padr
          });

          // 输出自定义的样式
          var style = [
            '#' + id + '{' + css + '}',
            '#' + id + ' .textRollWrap{' + padCss + '}'
          ];
          if (data.bcolor) {
            style.push('#' + id + ' li b{color:' + data.bcolor + '}');
          }
          if (data.icolor) {
            style.push('#' + id + ' .textRoll{color:' + data.icolor + '}');
          }
          return style.join('');
        })(this.did),
        '</style>',
        '<section class="' + cls.join(" ") + '" id="', this.did, '">',
        data.bgimage ? '<img class="rollBgImg" src="' + $.safeHTML(data.bgimage) + '"/>' : '',
        '<div class="textRollWrap">',
        '<div class="textRollContent">',
        iconHtml,
        '<div class="textRollList"><ul>',
        $.map(data.texts.replace(/\r/g, "").replace(/\n+/g, '\n').split('\n'), function (text, index) {
          return '<li>' + Markdown.format($.safeHTML(text)) + '</li>';
        }).join(""),
        '</ul></div>',
        '</div>',
        '</div>',
        '</section>',
        '<script>window.textRoll("', data.roll, '","', this.did, '",' + JSON.stringify(ops) + ')</', 'script>'
      ].join("");
    }
  });
});
