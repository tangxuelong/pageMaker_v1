define([
  "jquery", "tools", "com/panel", "com/md"
], function ($, tools, Panel, Markdown) {
  /**
   * 事件轴组件
   */
  return Panel.extend({
    icon: "feed",
    name: "timeline",
    NAME: "时间轴",
    group: "ext",
    init: function () {
      this.rid = "tl" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "*事件配置",
      content: [{
        type: "text",
        text: "配置两组以上方可生效 <a href='#group-add'>+增加配置</a>"
      }, {
        type: "inputGroup",
        addon: "主标",
        name: "mTitle",
        holder: "时间轴事件的主要标题，换行用 #，强调用 *星号*",
        groupCss: "timeline_main group_first"
      }, {
        type: "imageGroup",
        addon: "图片",
        name: "img",
        holder: "配置图片，可选，设置后说明文字将无效",
        groupCss: "timeline_img group_middle"
      }, {
        type: "inputGroup",
        addon: "说明",
        name: "sTitle",
        holder: "说明文字，可选，换行用 #，强调用 *星号*",
        groupCss: "timeline_sub group_last"
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加配置</a>"
      }]
    }, {
      label: "字体颜色",
      content: [{
        type: "color",
        text: "基本色",
        name: "color",
        value: "#5d5d5d"
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
        value: 4
      }, {
        type: "radio",
        name: "size",
        text: "中",
        value: 3,
        checked: true
      }, {
        type: "radio",
        name: "size",
        text: "小",
        value: 2
      }]
    }, {
      label: "轴颜色",
      content: [{
        type: "radio",
        name: "zclr",
        value: "red",
        text: "红色",
        checked: true
      }, {
        type: "radio",
        name: "zclr",
        value: "blue",
        text: "蓝色"
      }, {
        type: "radio",
        name: "zclr",
        value: "yellow",
        text: "黄色"
      }, {
        type: "radio",
        name: "zclr",
        value: "orange",
        text: "橙色"
      }, {
        type: "radio",
        name: "zclr",
        value: "white",
        text: "白色"
      }]
    }, {
      label: "其他",
      content: [{
        type: "checkbox",
        name: "asc",
        text: "倒序输出"
      }, {
        type: "checkbox",
        name: "h1b",
        text: "主标加粗"
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
    dependCss: ["timeline"],
    get: function () {
      var data = this.save();
      var html = [];
      if (!$.isArray(data.mTitle)) {
        return;
      }
      // 筛选数据
      $.each(data.mTitle, function (i, title) {
        if (title) {
          var obj = {
            main: Markdown.format($.safeHTML(title)),
            // 图片和说明文字互斥
            sub: data.img[i] ? "" : Markdown.format($.safeHTML(data.sTitle[i])),
            img: data.img[i]
          };
          html.push(['<li class="fs', data.size, '"><h1 class="fs', data.size, '">', obj.main, '</h1>',
            obj.img ? '<h2><img src="' + obj.img + '"/></h2>' : '',
            obj.sub ? '<h3 class="fs' + (Number(data.size) - 1) + '">' + obj.sub + '</h3>' : '',
            '</li>'
          ].join(""));
        }
      });
      if (html.length < 2) {
        return;
      }

      // 检查是否倒序
      if (data.asc) {
        html = html.reverse();
      }
      var cls = ["timeline", data.zclr];
      if (data.h1b) {
        cls.push("h1b");
      }
      return [
        '<style>#' + this.rid + '{color:' + data.color + '}',
        '#' + this.rid + ' li b{color:' + data.bcolor + '}',
        '</style>',
        '<section id="', this.rid, '" class="', cls.join(" "), '" style="', tools.getPaddingStyle({
          top: data.padtop,
          bottom: data.padbtm,
          left: data.padl,
          right: data.padr
        }), '"><ul>', html.join(""), '</ul></section>'
      ].join("");
    }
  });
});
