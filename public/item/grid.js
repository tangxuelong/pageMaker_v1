define([
  "jquery", "tools", "com/panel", "com/animate", "com/image"
], function ($, tools, Panel, Animate, holderImage) {
  /**
   * 图宫格
   */
  return Panel.extend({
    icon: "th-large",
    name: "gird",
    NAME: "图宫格",
    group: "ext",
    init: function () {
      this.did = "grid" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "布局",
      content: [{
        type: "radio",
        name: "type",
        text: "横置二列",
        value: "st2"
      }, {
        type: "radio",
        name: "type",
        text: "纵置二列",
        checked: true,
        value: "pt2"
      }, {
        type: "radio",
        name: "type",
        text: "纵置三列",
        value: "pt3"
      }, {
        type: "radio",
        name: "type",
        text: "纵置四列",
        value: "pt4"
      }]
    }, {
      label: "说明",
      content: [{
        type: "text",
        text: "纵置二列的配图宽度控制到240像素内，其他类型图片宽度控制到120像素。"
      }]
    }, {
      label: "宫格",
      content: [{
        type: "text",
        text: "配置两组以上方可生效 <a href='#group-add'>+增加宫格</a>"
      }, {
        type: "imageGroup",
        addon: "图片",
        name: "image",
        holder: "输入完整图片地址，或上传图片",
        groupCss: "grid_img group_first"
      }, {
        type: "inputGroup",
        addon: "标题",
        name: "title",
        holder: "设置格式为：主要标题#次要标题",
        groupCss: "grid_title group_middle"
      }, {
        type: "inputGroup",
        addon: "链接",
        name: "link",
        holder: "设置格式为：链接地址|客户端App命令",
        groupCss: "grid_title group_middle"
      }, {
        type: "radioGroup",
        groupCss: "grid_css group_last",
        name: "css",
        addon: "配色",
        radios: [{
          value: "gray",
          checked: true,
          text: "黑灰"
        }, {
          value: "red",
          text: "黑红"
        }]
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加宫格</a>"
      }]
    }, {
      label: "背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "",
        imageName: "bgimage",
        holder: "背景图，宽度撑满且纵向平铺"
      }]
    }, {
      label: "边线",
      content: [{
        type: "checkbox",
        name: "tbLine",
        text: "上下边线"
      }, {
        type: "checkbox",
        name: "lrLine",
        text: "左右边线"
      }]
    }, {
      label: "隔线",
      content: [{
        type: "checkbox",
        name: "horLine1",
        text: "短横线"
      }, {
        type: "checkbox",
        name: "horLine",
        text: "中横线"
      }, {
        type: "checkbox",
        name: "horLine2",
        text: "长横线"
      }, {
        type: "checkbox",
        name: "verLine1",
        text: "短纵线"
      }, {
        type: "checkbox",
        name: "verLine",
        text: "中纵线"
      }, {
        type: "checkbox",
        name: "verLine2",
        text: "长纵线"
      }]
    }, {
      label: "线颜色",
      content: [{
        type: "color",
        name: "bdcolor",
        text: "边线色",
        value: ""
      }, {
        type: "color",
        name: "spcolor",
        text: "隔线色",
        value: ""
      }]
    }, {
      label: "预置补白",
      content: [{
        type: "radio",
        name: "prepad",
        value: 2,
        checked: true,
        text: "正常"
      }, {
        type: "radio",
        name: "prepad",
        value: 1,
        text: "较小"
      }, {
        type: "radio",
        name: "prepad",
        value: 0,
        text: "无补白"
      }]
    }, Animate.getConf({
      aniOpac: true
    }), {
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
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        value: 0,
        before: "右 "
      }]
    }],
    initEvent: function () {
      var horLines = $("[name*=horLine]", this.wrap).click(function () {
        if (this.checked) {
          horLines.each(function () {
            this.checked = false;
          });
          this.checked = true;
        }
      });
      var verLine = $("[name*=verLine]", this.wrap).click(function () {
        if (this.checked) {
          verLine.each(function () {
            this.checked = false;
          });
          this.checked = true;
        }
      });
    },
    checkOneConf: function (img, linkCmdStr, title, css) {
      if (img) {
        var linkCmd = linkCmdStr.split("|");
        var titleArr = title.split("#");
        var link = linkCmd[0];
        var cmd = linkCmd[1];
        // 自动补足分享链接
        if (link.indexOf("share") === 0) {
          link = "share://";
        }
        return {
          img: img,
          link: link || "javascript:;",
          cmd: cmd,
          title: titleArr[0],
          sub: titleArr[1],
          css: css,
          dependShare: link === "share://" || cmd === "share",
          dependApp: cmd !== ""
        };
      }
    },
    get: function () {
      var data = this.save();
      var i = 0;
      var n = data.image.length;
      var okData = [];
      var dependShare = false;
      var dependApp = false;
      var aniCls = Animate.getCss(data).join(" ");
      var obj;
      if (!$.isArray(data.image)) {
        return;
      }

      // 挑出有效的配置
      for (; i < n; i++) {
        obj = this.checkOneConf(data.image[i], data.link[i], data.title[i], data.css[i] + " " + aniCls);
        obj && okData.push(obj);
        dependShare = dependShare || (obj ? obj.dependShare : false);
        dependApp = dependApp || (obj ? obj.dependApp : false);
      }

      if (okData.length < 2) {
        return;
      }

      // 样式
      var cls = ["grid", data.type, "prepad" + data.prepad];
      if (data.tbLine) cls.push("tbLine");
      if (data.lrLine) cls.push("lrLine");
      // 纵横线
      data.horLine2 ? cls.push("horLine hfull") : data.horLine ? cls.push("horLine") : data.horLine1 && cls.push("horLine hmini");
      data.verLine2 ? cls.push("verLine vfull") : data.verLine ? cls.push("verLine") : data.verLine1 && cls.push("verLine vmini");

      // 声明依赖
      this.dependJS = [];
      dependShare && this.dependJS.push("share");
      dependApp && this.dependJS.push("app");

      this.dependCss = ["grid", "animate.active"].concat(holderImage.css);
      this.dependJS = this.dependJS.concat(holderImage.js);

      // 开始分析图片数据
      var allImageJobs = [];
      $.each(okData, function (index, obj) {
        allImageJobs.push(holderImage.getImageData(obj.img)
          .then(function (imageData) {
            obj.imgHTML = imageData.html;
          }));
      });

      var lib = this;
      return Promise.all(allImageJobs)
        .then(function () {
          // 拼接html代码
          return ['<section style="', tools.getPaddingStyle({
              top: data.padtop,
              bottom: data.padbtm,
              left: data.padl,
              right: data.padr
            }), '">',
            data.spcolor ? '<style>#' + lib.did + ' li:before,#' + lib.did + ' li:after{background-color:' + data.spcolor + '}</style>' : '',
            '<div id="', lib.did, '" class="', cls.join(" "), '" style="', tools.getCss({
              "border-color": data.bdcolor,
              "background-color": data.bgcolor,
              "background-image": data.bgimage ? "url(" + data.bgimage + ")" : ""
            }), '">',
            lib.getHTML(
              okData,
              data.type.replace(/\d/g, ""),
              Number(data.type.replace(/\D/g, ""))
            ),
            '</section>'
          ].join('');
        });
    },

    /**
     * 获取布局的html代码
     */
    getHTML: function (okData, type, gridNum) {
      var html = [];
      var n = okData.length;
      var obj, i;
      var font = {
        h1: "fs3",
        h2: "fs1"
      };
      switch (type) {
        case "st": // 横置系列
          font.h2 = "fs2";
          html.push('<ul>');
          for (i = 0; i < n; i++) {
            obj = okData[i];
            if (i % gridNum === 0 && i > 0) {
              html.push("</ul><ul>");
            }
            html.push(['<li class="' + obj.css + '"><a href="', obj.link, '">',
              '<div>', obj.imgHTML, '</div><div>',
              obj.title ? '<h1 class="' + font.h1 + '">' + tools.safeHTML(obj.title) + '</h1>' : '',
              obj.sub ? '<h2 class="' + font.h2 + '">' + tools.safeHTML(obj.sub) + '</h2>' : '',
              '</div></a></li>'
            ].join(""));
          }
          for (var j = i % gridNum; j > 0 && j < gridNum; j++) {
            html.push('<li></li>')
          }
          html.push("</ul></div>");
          return html.join("");
        case "pt": // 纵置系列
          if (gridNum === 2) {
            font.h2 = "fs2";
          }
          if (gridNum === 4) {
            font.h1 = "fs2";
          }
          html.push('<ul>');
          for (i = 0; i < n; i++) {
            obj = okData[i];
            if (i % gridNum === 0 && i > 0) {
              html.push("</ul><ul>");
            }
            html.push(['<li class="' + obj.css + '"><a href="', obj.link, '">',
              obj.imgHTML,
              obj.title ? '<h1 class="' + font.h1 + '">' + $.safeHTML(obj.title) + '</h1>' : '',
              obj.sub ? '<h2 class="' + font.h2 + '">' + $.safeHTML(obj.sub) + '</h2>' : '',
              '</a></li>'
            ].join(""));
          }
          for (var j = i % gridNum; j > 0 && j < gridNum; j++) {
            html.push('<li></li>')
          }
          html.push("</ul></div>");
          // 返回
          return html.join("");
      }
    }
  });
});
