// 页面操作绑定
define([
  "jquery", "format", "dialog", "LS", "Class",
  "custom/action.publish",
  "custom/action.import"
], function ($, format, dialog, LS, Class, Publish, Import) {
  var Actions = {
    // 导入已有的模块继续编辑
    "import": function (name) {
      // 指定了组件
      if (name) {
        (this._Code.tmpl === this._Code.jsEditor.getValue() ? function (act) {
          act();
        } : function (act) {
          $.dialog.confirm("导入组件将替换现有编辑器中的内容，无法恢复！<br>确定导入吗？")
            .onBtnClick(function (btnID) {
              btnID && act();
            })
        })(function () {
          Import(name, function (data, desc) {
            if (data) {
              Actions._Code.setCode(data);
            } else {
              $.dialog.alert(desc || "导入出错，请稍后再试。");
            }
          });
        });
        return;
      }
      // 未指定组件，则弹出对话框输入组件名
      var importDialog = $.dialog({
        title: "导入",
        width: 400,
        content: ['<div class="form-group">',
          '<label class="needed" for="jsname">组件英文名称</label>',
          '<input class="form-control" id="jsname" placeholder="请输入私有模块的英文名称或url地址">',
          '<small>导入后，将替换现有编辑器中的内容！</small>',
          '</div>'
        ].join(""),
        button: ["*导入"]
      }).onShow(function () {
        var btn = this.wrap.find(".btn[rel=1]");
        $("#jsname").keyup(function (e) {
          if (e.keyCode === 13) {
            btn.click()
          }
        })
      }).onBtnClick(function (btnId) {
        if (btnId) {
          var input = $("#jsname");
          var name = $.trim(input.val());
          var wrap;
          if (!name) {
            wrap = input.closest(".form-group").addClass("has-error");
            input[0].select();
            window.setTimeout(function () {
              wrap.removeClass("has-error");
            }, 1500);
            return false;
          }
          Import(name, function (data, desc) {
            if (data) {
              importDialog.close();
              Actions._Code.setCode(data);
            } else {
              $.dialog.alert(desc || "导入出错，请稍后再试。");
            }
          });
          return false;
        }
      });
    },

    // 重置
    reset: function () {
      $.dialog({
        title: null,
        css: "iDialogConfirm",
        content: "确定清空现有配置以及预览缓存吗？",
        button: ["仅清空预览数据", "*确定", "取消"]
      }).onBtnClick(function (btnId) {
        if (btnId) { // 清空预览缓存
          LS.remove("customPreview");
        }
        if (btnId === 1) {
          Actions._Code.reset();
        }
      });
    },

    // 预览
    preview: function () {
      this.submit("preview");
    },

    // 提交组件
    "submit": function (action) {
      // 获得完整代码以及json配置
      var code = this._Code.get();
      // 通过正则检测的name/NAME作为备选
      var bkInfo = (function () {
        var name = code.match(/var PLUGIN_ID\s*=\s*([^,;\n\r]+)/) || code.match(/name\s*:\s*(['"][^,\n\r]+)/);
        var NAME = code.match(/NAME\s*:\s*(['"][^,\n\r]+)/);
        return {
          name: name ? name[1].replace(/(?:^['"]*|['"]*$)/g, "") : null,
          NAME: NAME ? NAME[1].replace(/(?:^['"]*|['"]*$)/g, "") : null
        };
      })();
      // 分析组件名称
      window.__define = function (dep, fn) {
        try {
          fn();
        } catch (e) {
          window.__detect(bkInfo);
        }
      };
      window.__detect = function (obj, cfg) {
        window.__detect = function () {};
        if (typeof obj === "string" && cfg) {
          obj = cfg;
        }
        if (!obj.name || !obj.NAME) {
          $.dialog.alert("检测代码中的name和NAME失败。操作中断。");
        } else {
          Publish(obj.name, obj.NAME, code, action || "submit");
        }
      };
      // 替换代码中的主要函数，并尝试执行
      var dcode = code
        .replace(/define\(/, "window.__define(")
        .replace(/Panel\.extend\(/, "window.__detect(");
      try {
        /* eslint-disable */
        eval(dcode);
      } catch (e) {
        window.__detect(bkInfo);
      }
    },

    // 获取组件列表
    list: function (reload) {
      var tohtml = function (data, css, linkTmpl) {
        var html = [];
        $.each(data, function (i, obj) {
          var updateInfo = '--@--';
          var t;
          obj.url = obj.url || linkTmpl.replace(/{name}/g, obj.name);
          if (obj.lastUpdate && obj.lastUpdate.length === 3) {
            t = new Date(obj.lastUpdate[2]);
            updateInfo = (obj.lastUpdate[1] || '--') + "@" + [t.getFullYear(), t.getMonth() + 1, t.getDate()].join("/")
          }
          html.push('<tr class="' + (css || '') + '"><td>' +
            '<span class="itemName" title="点击导入组件" data-action="import:' + obj.name + '">' + obj.name + '</span>',
            '<a class="itemLink" target="_blank" href="' + obj.url + '"><span class="icon-link"></span></a></td><td>' +
            (obj.NAME || '--') + '</td><td>' +
            updateInfo + '</td></tr>'
          );
        });
        return html.join('')
      };
      var wrap = this._listWrap;
      $.get("/api/custom/list").then(function (data) {
        wrap.empty();
        if (!LS.get("knowListTog") && !reload) {
          wrap.removeClass("hideList");
        }
        wrap.html([
          '<div id="listSwitch">',
          '<span class="glyphicon glyphicon-chevron-right"></span>',
          '<span class="glyphicon glyphicon-chevron-left"></span>',
          '</div><div id="tableWrap">',
          '<table class="table table-striped">',
          '<thead><tr><th>组件名</th><th>中文名</th><th>最近更新</th></tr></thead>',
          '<tbody>',
          tohtml(data.private, "text-primary", "/customCode/{name}.js"),
          tohtml(data.public, "", "/open/pageMaker/customCode/{name}.js"),
          '</tbody>',
          '</table></div>'
        ].join(''));
        $("#listSwitch").click(function () {
          wrap.toggleClass("hideList");
          LS.set("knowListTog", "yes");
        });
      });
    }
  };

  return {
    init: function (Code, listWrap) {
      Actions._Code = Code;
      Actions._listWrap = $(listWrap);
      // 绑定全局代理监听
      $(document.body).delegate("[data-action]", "click", function () {
        var act = $(this).data("action").split(":");
        if (act[0] && Actions[act[0]]) {
          Actions[act[0]].apply(Actions, act[1] ? act[1].split(",") : []);
        }
        return false;
      });
      Actions.list();
      $.bindMsg("pubok", function() {
        Actions.list(true);
      });
    },
    setListHeight: function (h) {
      Actions._listWrap.height(h);
    }
  };
});
