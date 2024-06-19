define([
  "jquery", "tools", "com/panel", "com/gconf",
  "./code.lib", "com/codemirror", "page/ctrl.set"
], function ($, tools, Panel, gConf, CodeLib, CodeMirror, SetDialog) {
  /**
   * 自定义脚本
   */
  return Panel.extend({
    icon: "embed2",
    name: "code",
    NAME: "JSCSS",
    group: "adv",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "警告",
      content: [{
        type: "text",
        text: "非前端程序员勿动！！脚本会在插入的位置立即执行。由于执行环境不同，部分js代码在预览状态下可能无效。"
      }]
    }, {
      label: "代码库",
      content: CodeLib.libs.concat({
        type: "link",
        href: "javascript:;",
        css: "cusLibEntry",
        text: "自定义"
      }).map(function (obj, i) {
        if (!obj.type) {
          obj.type = "checkbox";
          obj.checked = i === 0;
        }
        return obj;
      })
    }, {
      label: "选项",
      content: [{
        type: "checkbox",
        name: "strictMode",
        text: "严格模式",
        checked: true
      }, {
        type: "checkbox",
        name: "printError",
        text: "控制台打印错误"
      }]
    }, {
      label: "样式(CSS)",
      content: [{
        type: "textarea",
        name: "css",
        value: "",
        holder: "请直接编写CSS"
      }]
    }, {
      label: "脚本(JS)",
      content: [{
        type: "textarea",
        name: "js",
        value: "",
        holder: "请直接编写JS脚本"
      }, {
        type: "link",
        css: "submitCode btn btn-default btn-sm",
        text: "提交代码",
        href: "javascript:;"
      }]
    }],
    initEvent: function () {
      // 自定义代码库入口
      if (gConf.func.customCodeLib) {
        $(".cusLibEntry", this.wrap).click(function () {
          SetDialog("cusLibConf");
        });
      } else {
        $(".cusLibEntry", this.wrap).remove();
      }

      var lib = this;
      lib.jsTextArea = $("[name=js]", lib.wrap);
      lib.cssTextArea = $("[name=css]", lib.wrap);

      lib.jsEditor = CodeMirror.fromTextArea(lib.jsTextArea[0], {
        lineNumbers: true,
        mode: "javascript",
        // 更多主题样式  http://codemirror.net/demo/theme.html
        theme: "mbo"
      });
      lib.cssEditor = CodeMirror.fromTextArea(lib.cssTextArea[0], {
        lineNumbers: true,
        mode: "css",
        theme: "mbo"
      });
      lib.submitCodeBtn = $(".submitCode", lib.wrap).click(function (e) {
        lib.okJS = lib.jsEditor.getValue();
        // 通知内容变化
        lib.iamChange();
        e.preventDefault();
      });
      // 设置编辑器高度
      lib.cssEditor.setSize(lib.cssTextArea.parent().width(), 150);
      lib.jsEditor.setSize(lib.jsTextArea.parent().width(), 350);

      // 响应窗体变化
      $(window).resize(function () {
        lib.setCodeArea();
      });
    },

    // 自动设置代码容器宽度
    setCodeArea: function () {
      // 先设置一个小量，防止已经撑破页面导致计算错误
      this.cssEditor.setSize(1, 150);
      this.jsEditor.setSize(1, 350);
      // 计算宽度，两个代码容器使用同一个宽度
      var w = this.cssTextArea.parent().width();
      this.cssEditor.setSize(w, 150);
      this.jsEditor.setSize(w, 350);
    },

    load: function (data) {
      // 如果有自定义库，则先更新自定义库配置信息
      if (data.cusLib && CodeLib.addLib(data.cusLib)) {
        // 如果配置库有变化，则刷新页面，重新来过
        window.location.reload(true);
        return;
      }
      this.callSuper(data);
      this.jsEditor && data.js && this.jsEditor.setValue(data.js);
      this.cssEditor && data.css && this.cssEditor.setValue(data.css);
      this.okJS = data.okJS;
    },
    save: function () {
      var data = this.callSuper();
      // 直接存入代码字段
      data.js = this.jsEditor.getValue();
      data.css = this.cssEditor.getValue();
      data.okJS = this.okJS;
      // 如果选了自定义的库，则保存自定库的配置信息
      var cusLib = [];
      $.each(CodeLib.libs, function (i, conf) {
        if (data[conf.name] && /^cus/.test(conf.name)) {
          cusLib.push(conf);
        }
      });
      if (cusLib.length) {
        data.cusLib = CodeLib.stringify(cusLib);
      }
      return data;
    },
    get: function () {
      var data = this.save();

      // 检查js和okJS是否一致
      if (data.js === data.okJS) {
        this.submitCodeBtn.attr("disabled", "disabled");
      } else {
        this.submitCodeBtn.removeAttr("disabled");
      }

      // 分析引入组件的依赖
      var JS = [];
      var CSS = [];
      $.each(CodeLib.libs, function (i, conf) {
        if (data[conf.name]) {
          $.each(conf.js || [], function (i, js) {
            if ($.inArray(js, JS) < 0) {
              JS.push(js);
            }
          });
          $.each(conf.css || [], function (i, css) {
            if ($.inArray(css, CSS) < 0) {
              CSS.push(css);
            }
          });
        }
      });
      this.dependJS = JS;
      this.dependCss = CSS;

      // 拼接代码
      return [
        data.css ? '<style mini>' + data.css + '</style>' : "",
        '<script', ' mini>', '+function($){',
        data.strictMode ? '"use strict";' : '',
        'try{', this.okJS, '}catch(e){',
        data.printError ? 'console.log(e);' : '',
        '}}(window.Zepto||window.jQuery);',
        '</', 'script>'
      ].join('');
    }
  });
});
