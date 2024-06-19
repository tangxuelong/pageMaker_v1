define([
  "jquery", "tools", "item/p"
], function ($, tools, classP) {
  /**
   * 滚动数字组件，扩展于正文组件
   */
  return classP.extend({
    icon: "magic-wand",
    name: "numroll",
    NAME: "滚动数字",
    group: "ext",
    init: function () {
      this.callSuper();
      this.did = "nr" + String.random();
    },
    tmpl: (function () {
      // 复制一份配置
      var tmpl = JSON.parse(JSON.stringify(classP.prototype.tmpl));

      // 修改模板
      tmpl[0] = {
        label: "*内容",
        content: [{
          type: "textarea",
          name: "text",
          holder: "输入内容，内容中的所有阿拉伯数字将被自动添加动效。"
        }]
      };
      tmpl[1] = {
        label: "颜色",
        content: [{
          type: "color",
          name: "color",
          value: "#5d5d5d",
          text: "正文"
        }, {
          type: "color",
          name: "numColor",
          value: "#f26061",
          text: "数字"
        }]
      };

      // 插入新的配置
      tmpl.splice(-2, 0, {
        label: "数字放大",
        content: [{
          type: "radio",
          name: "zoom",
          value: "100",
          text: "不变"
        }, {
          type: "radio",
          name: "zoom",
          value: "110",
          text: "10%"
        }, {
          type: "radio",
          name: "zoom",
          value: "120",
          text: "20%"
        }, {
          type: "radio",
          name: "zoom",
          value: "130",
          text: "30%",
          checked: true
        }, {
          type: "radio",
          name: "zoom",
          value: "140",
          text: "40%"
        }, {
          type: "radio",
          name: "zoom",
          value: "150",
          text: "50%"
        }, {
          type: "radio",
          name: "zoom",
          value: "160",
          text: "60%"
        }]
      }, {
        label: "数字对齐",
        content: [{
          type: "radio",
          name: "align",
          value: "inherit",
          text: "默认",
          checked: true
        }, {
          type: "radio",
          name: "align",
          value: "middle",
          text: "居中"
        }]
      }, {
        label: "停止顺序",
        content: [{
          type: "radio",
          name: "order",
          value: "1",
          text: "随机"
        }, {
          type: "radio",
          name: "order",
          value: "2",
          text: "左→右",
          checked: true
        }, {
          type: "radio",
          name: "order",
          value: "3",
          text: "左←右"
        }]
      }, {
        label: "动效速度",
        content: [{
          type: "radio",
          name: "speed",
          value: "1",
          text: "慢"
        }, {
          type: "radio",
          name: "speed",
          value: "2",
          text: "中",
          checked: true
        }, {
          type: "radio",
          name: "speed",
          value: "3",
          text: "快"
        }]
      });
      return tmpl;
    })(),
    dependCss: ["title", "p", "numroll"],
    dependJS: ["zepto", "numRoll"],
    get: function () {
      var data = this.save();
      var did = this.did;
      var forEach = Array.prototype.forEach;

      // 修改原有的html输出逻辑
      return this.callSuper(function (css, cls, html) {
        // 标记文本中数字字符
        html = html.replace(/\d/g, function (num) {
          return '<span class="rollnum">' + num + '</span>';
        });
        // 将剩余的文本节点也包装起来，以实现完美的居中对齐方案
        html = (function (orgHtml) {
          var wrapTextNode = function (htmlStr, getLevel2) {
            var div = document.createElement("div");
            var ret = [];
            var tag;
            div.innerHTML = htmlStr;
            forEach.call(div.childNodes, function (node) {
              switch (node.nodeType) {
                case 3: // 纯文本节点
                  ret.push('<span>' + node.nodeValue + '</span>');
                  break;
                case 1: // 普通节点
                  if (getLevel2) {
                    tag = node.nodeName.toLowerCase();
                    ret.push("<" + tag + ">" + wrapTextNode(node.innerHTML) + "</" + tag + ">");
                  } else {
                    ret.push(node.outerHTML);
                  }
                  break;
                default: // 其他类型节点
                  ret.push(node.outerHTML);
              }
            });
            div = null;
            return ret.join("");
          };
          return wrapTextNode(orgHtml, true);
        })("<p>" + html + "</p>");

        // 输出html代码
        return ['<style>',
          '#nr-', did, ' {', css, '}',
          '#nr-', did, ' .rollnum{',
          'color:', data.numColor, ';',
          data.zoom > 100 ? 'font-size:' + data.zoom + "%;" : '',
          '}',
          '#nr-', did, ' p>*{vertical-align:', data.align, '}',
          '</style>',
          '<section id="nr-' + did + '" class="', cls.join(" "), '">',
          $.safeHTML(html, true),
          "</section>",
          '<script>window.numRoll&&numRoll("nr-', did, '", ' + data.order + ', ' + data.speed + ')',
          '</', 'script>'
        ].join("");
      });
    }
  });
});
