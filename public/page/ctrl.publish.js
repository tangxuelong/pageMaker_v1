define([
  "jquery", "./pubpanel", "LS", "com/core", "com/gconf", "dialog"
], function ($, PubPanel, LS, Core, gConf) {
  // 发布方法，从绑定函数中提取
  var publish;

  // 如果发布中断（比如登录跳转），保存用户行为标记十分钟
  var lastAct = Number(LS.get("leaveWhenPub") || 0);
  if (Number(new Date()) <= lastAct + 10 * 60 * 1000) {
    window.setTimeout(function () {
      publish();
    }, 100);
  }
  LS.remove("leaveWhenPub");

  // 绑定页面监听
  $(document).delegate('.publish', 'click', publish = function (e) {
    // 检查是否有组件报错
    Core.readFromPage()
      .then(function (data) {
        var error = data.error;
        if (error.length) {
          return $.dialog({
            title: "配置错误",
            width: 450,
            content: "以下组件配置有错误，请调整后再发布：<br>" + $.map(error, function (obj) {
              return obj.name + "(" + obj.num + ")"
            }).join("、")
          });
        }
        showDialog();
      });
    e && e.preventDefault();
  });

  // 展开对话框
  function showDialog() {
    $.dialog({
      title: null,
      width: 600,
      css: "publishDialog",
      content: "<div id='publishBox'>发布选项加载中...</div>",
      button: ["*立即发布", "取消"]
    }).onCreate(function () {
      // 清空容器
      $("#publishBox").empty();
      // 初始化发布选项组件
      this.publish = PubPanel.CONF.create({
        wrap: "#publishBox",
        noCache: true
      });
      // 传入dialog方便组件内控制对话框
      this.publish.dialog = this;
      // 重新定位
      this.position(true);
    }).onBtnClick(function (btnId) {
      if (btnId) { // 准备发布，检查发布设置
        if (this.publish && !this.publishing) {
          var conf = this.publish.get();
          var dialog = this;
          var reset;
          // 有返回，则开始检查数据
          if (conf) {
            if (!conf.fld) {
              this.publish.error("fld");
              return false;
            }
            // 准备发布
            this.publishing = 1;
            this.button.eq(0).text("发布中，请耐心等待");
            this.button.eq(1).hide();
            // 复原函数
            reset = function () {
              dialog.publishing = 0;
              dialog.button.eq(0).text("立即发布");
              dialog.button.eq(1).show();
            };
            // 开始发布
            conf.json = Core.saveString();
            conf.html = Core.getPageHTML();
            // 发布页面
            $.post("/api/publish", conf).then(function (ret) {
              // 处理发布结果
              switch (ret.err) {
                case -1: // 未登录
                  // 保存用户的行为
                  LS.set("leaveWhenPub", Number(new Date()));
                  LS.set("editFld", conf.fld);
                  // 强刷页面进行登录
                  window.location.reload(true);
                  return;
                case 0: // 发布成功
                  // 记录最近一次要发布的项目和目录，方便再次进入页面时进行内容核对
                  LS.set("lastPublish", ret.data.url);
                  // 记录已经发布的目录
                  LS.set("editFld", conf.fld);
                  // 服务器端修改了配置，则重新导入
                  if (ret.data.json) {
                    Core.load(JSON.parse(ret.data.json))
                  }
                  dialog.close(ret);
                  break;
                default:
                  $.dialog.alert(ret.desc || "发布出现错误，请稍候再试！");
                  reset();
              }
            }, function () { // 发布失败
              $.dialog.alert("服务器错误！");
              reset();
            });
          }
        }
        return false
      }
    }).onClose(function (ret) {
      if (ret && ret.data) { // 发布成功
        $.dialog({
          width: 600,
          css: "publishDialog",
          content: '<div id="pubOK">加载中，请稍候...</div>',
          button: ["*立即访问", "知道了"]
        }).onCreate(function () {
          $("#pubOK").empty();
          PubPanel.OK.create({
            wrap: "#pubOK",
            noCache: true,
            url: ret.data.url,
            cover: ret.data.cover
          });
          this.position(true);
        }).onBtnClick(function (btn) {
          if (btn) {
            window.open(ret.data.url);
            return false;
          }
        });
      } else { // 取消发布
        this.publish && this.publish.del(true);
      }
    });
  }
});
