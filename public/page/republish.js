/**
 * 自动页面发布，可以根据日期范围、组件使用、日志页面手选等方式来实现自动重发
 */
define([
  'jquery', 'LS', "com/core", "com/gconf", "item/all", "dialog"
], function ($, LS, Core, gConf, Item) {
  'use strict';
  // 主要调用入口
  function main() {
    $.dialog({
      title: "自动重发布",
      css: "repubDialog",
      width: 800,
      content: [
        '<div class="col-md-5 repub-colLeft">',
        '<div id="repubCondition">',
        '<form class="form-inline">',
        '<div class="form-group">',
        '<input type="text" id="startTime" name="startTime" class="form-control timeInput" placeholder="起始时间">',
        '</div>',
        '<div class="form-group">',
        '<label>~</label>',
        '<input type="text" id="endTime" name="endTime" class="form-control timeInput" placeholder="截至时间">',
        '</div>',
        '<h5>涉及组件</h5>',
        (function () {
          var group = {};
          $.each(Item.getList(), function (i, obj) {
            group[obj.type] = group[obj.type] || [];
            group[obj.type].push('<label class="repubCondLabel">');
            group[obj.type].push('<input type="checkbox" name="repubItem" value="' + obj.name + '"/>');
            group[obj.type].push(obj.NAME + '</label>');
          });
          var html = [];
          for (var type in group) {
            if (html.length > 0) {
              html.push('<div class="line"></div>');
            }
            html.push(group[type].join(''));
          }
          return html.join("")
        })(),
        '<div><label>多组件逻辑</label>：',
        '<label class="repubCondLabel"><input type="radio" name="logic" checked value="or">或</label>',
        '<label class="repubCondLabel"><input type="radio" name="logic"  value="and">与</label>',
        '</div>',
        '<a href="#" id="searchPages"><span>查询</span></a>',
        '</form>',
        '</div>',
        '</div><div class="col-md-7">',
        '<div id="repubPageList">请选择查询条件后，点击"查询"。</div>',
        '</div>'
      ].join(''),
      button: ["*重新发布", "取消"]
    }).onShow(function () {
      $(".timeInput", this.wrap).datetimepicker({
        forceParse: false,
        format: "yyyy-mm-dd hh:ii"
      });
      // 查询
      $("#searchPages").click(function () {
        getPageList($("#repubCondition form").serialize(), "#repubPageList");
        return false;
      });
    }).onBtnClick(function (btnId) {
      if (btnId) { // 启动发布
        if (!$("#allRepubPage")[0]) {
          $.dialog.toast("请先查询出页面信息。");
          return false;
        }
        var pages = [];
        $("#repubPageList [name=repubPage]:checked").each(function () {
          pages.push(this.value);
        });
        if (!pages.length) {
          $.dialog.toast("请先选择要重新发布的页面。");
          return false;
        }
        this.close(pages);
      }
    }).onClose(function (pages) {
      pages && republish(pages)
    });
  }

  // 发送列表过滤请求
  function getPageList(para, resultWrap) {
    var wrap = $(resultWrap).html('查询中...');
    $.post('/api/search/page', para)
      .then(function (ret) {
        if (ret.err) {
          wrap.html(ret.desc);
        } else {
          wrap.html([
            '<h5>共查询到', ret.data.length, '条记录：</h5>',
            '<table class="table table-striped">',
            '<thead>',
            '<tr><th width="30"><input type="checkbox" checked id="allRepubPage"></th><th width="140">目录</th><th>标题</th></tr>',
            '</thead>',
            '<tbody id="pageBody">',
            (function () {
              var html = [];
              $.each(ret.data, function (i, obj) {
                html.push([
                  '<tr><td>', '<input type="checkbox" name="repubPage" id="repubPage-', obj.fld, '" value="', obj.fld, '" checked>',
                  '</td><td><label for="repubPage-', obj.fld, '">', obj.fld, '</label></td><td title="',
                  obj.author, '发布于\n', (new Date(obj.time)).toLocaleString(), '">',
                  obj.title || '--',
                  '</td></tr>'
                ].join(''));
              });
              return html.join('')
            })(),
            '</tbody>',
            '</table>'
          ].join(''));
          // 处理全选/全不选
          var allRepubPage = $("#allRepubPage").click(function () {
            var checked = this.checked;
            pages.each(function () {
              this.checked = checked;
            });
          });
          var pages = $("[name=repubPage]");
          $("#pageBody").delegate("input:checkbox", "click", function () {
            var checked = 0;
            var unchecked = 0;
            pages.each(function () {
              if (this.checked) {
                checked++;
              } else {
                unchecked++;
              }
            });
            allRepubPage[0].indeterminate = false;
            if (checked === 0) {
              allRepubPage[0].checked = false
            } else if (unchecked === 0) {
              allRepubPage[0].checked = true;
            } else {
              allRepubPage[0].indeterminate = true;
            }
          });
        }
      }, function (res) {
        wrap.html("查询失败（" + res.status + "）");
      });
  }

  // 批量重新发布
  function republish(pages) {
    var userStop = false;
    $.dialog({
      title: null,
      width: 400,
      content: "<p id='repubInfoBox' class='bg-info'></p><div id='repubResult'></div>",
      button: ["*确定终止?", "终止", "关闭"]
    }).onBtnClick(function (btnId) {
      if (btnId === 2) {
        userStop = true;
        return false;
      }
      if (btnId === 1) {
        this.button.hide().first().show();
        return false;
      }
    }).onCreate(function () {
      // 显示中间的『终止』按钮
      this.button.hide().eq(1).show();
      // 启动
      var resultWrap = $("#repubResult");
      var currentWrap = $("#repubInfoBox");
      var dialog = this;
      var result = {
        failed: 0,
        success: 0
      };
      var repub = function (index) {
        if (index < pages.length && !userStop) {
          currentWrap.html("正在重新发布：" + pages[index]);
          republishOnePage(pages[index], function (err, desc) {
            if (err) {
              result.failed++;
              resultWrap.prepend('<div class="pagePubResult failed">' + pages[index] + ' 发布失败：' + desc + '</div>');
            } else {
              result.success++;
              resultWrap.prepend('<div class="pagePubResult success">' + pages[index] + ' 重新发布成功（<a href="' + desc + '" target="_blank">链接</a>）</div>');
            }
            repub(index + 1);
          });
        } else {
          var last = pages.length - result.failed - result.success;
          currentWrap.html([
            "共", pages.length, "个页面，发布成功", result.success,
            "个，失败", result.failed, "个",
            last > 0 ? "，未处理" + last + "个" : "",
            "。"
          ].join(''));
          // 清空配置
          Core.clear();
          // 显示关闭按钮
          dialog.button.hide().eq(2).show();
        }
      };
      repub(0);
    });
  }

  // 指定目录重新发布
  function republishOnePage(fld, callback) {
    $.ajax("/api/load/config?path=" + encodeURIComponent(gConf.publishPrefix + fld))
      .then(function (json) {
        if (json.err) {
          return callback(json.err, json.desc);
        }
        var data;
        try {
          data = JSON.parse(json.data);
        } catch (e) {
          return callback(1, "JSON内容格式化错误，请联系管理员核查。");
        }
        if ($.isArray(data)) {
          Core.load(data).then(function() {
            // 导入后进行发布
            return Core.getPageHTML(true);
          }, function() {
            // 导入出错
            return null
          }).then(function (html) {
            if (!html) { // 预览出错
              return Promise.reject(html === null ? "导入配置错误。" : "预览数据错误。");
            }
            return {
              fld: fld,
              repub: true,
              json: Core.saveString(),
              html: html
            }
          }).then(function (conf) {
            // 发布页面
            $.post("/api/publish", conf).then(function (ret) {
              // 处理发布结果
              switch (ret.err) {
                case -1: // 未登录
                  window.location.reload(true);
                  return;
                case 0: // 发布成功
                  callback(0, ret.data.url);
                  break;
                default:
                  callback(1, ret.desc);
              }
            }, function () { // 发布失败
              callback(1, "服务器错误！");
            });
          }).catch(function (desc) {
            callback(1, desc);
          });
        }
      }, function () {
        callback(1, '服务器探测失败，无法导入。');
      });
  }

  // 绑定页面启动方式
  $(document).ready(function () {
    if (window.user.type === "superAdmin") {
      $(document).delegate('.republish', 'click', function (e) {
        main();
        e.preventDefault();
      });
    }
  });
});
