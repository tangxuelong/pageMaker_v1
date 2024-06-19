define(["jquery", "dialog", "tools"], function ($, dialog) {
  function ABTest(panel, contentBox) {
    // this.id = "abtest-" + Math.random().toString(16).slice(-4);
    if (!panel || !panel.wrap || !panel.addGroup) {
      return;
    }
    var me = this;
    this.wrap = panel.wrap;
    this.user = window.user;
    this.contentBox = contentBox ? $(contentBox, panel.wrap) : null;
    this.bindActLink();
    // 更改分组模板缓存
    var _checkGroupTmpl = panel.checkGroupTmpl;
    panel.checkGroupTmpl = function (box) {
      _checkGroupTmpl && _checkGroupTmpl.call(this, box);
      box.append('<input type="hidden" name="abflag" value=""/>');
    };
    // 强制约定和panel组件的通讯方式，以提高代码和逻辑的复用性
    this.onDataChange(function (data) {
      var n = panel.getGroupNum();
      // 如果是用户测试，则方案只能配置一个；如果是方案测试，则是方案数量
      var N = data.caseType === 2 ? 1 : data.caseGroupList.length;
      // 配置不足的，增加
      for (; n < N; n++) {
        panel.addGroup();
      }
      var finish = 0;
      // 遍历所有的分组，更新AB测试信息
      panel.eachGroup(function (i, group) {
        if (finish >= N) {
          panel.removeGroup(group);
          return;
        }
        $(".group-title", group).html(me.getDesc(i));
        $("[name=abflag]", group).val(me.data.caseGroupList[i].flag);
        finish++;
      });
    })
  }

  var Config = {
    base: "http://ab.ms.netease.com/index.html?origin=pageMaker",
    curl: "#/index/testProject?email={user}&userName={username}&opType=1",
    eurl: "#/index/testProject?email={user}&userName={username}&opType=2&id={id}&caseType={caseType}&productId={productId}",
    get: function (key, data) {
      return this.base + this[key]
        .replace(/\{username\}/g, encodeURIComponent(window.user.name))
        .replace(/\{user\}/g, encodeURIComponent(data.user))
        .replace(/\{id\}/g, encodeURIComponent(data.id))
        .replace(/\{caseType\}/g, encodeURIComponent(data.caseType))
        .replace(/\{productId\}/g, encodeURIComponent(data.productId));
    }
  };

  // iframe弹窗
  var showIframeDialog = function (url, openCallback, closeCallback) {
    var winW = $(window).width();
    var winH = $(window).height();
    // 弹窗
    var dlg = $.dialog({
      width: winW * 0.8,
      height: winH * 0.8,
      css: "iFrameDialog",
      title: "",
      content: "<div class='iFrameLoading'>Loading...</div><iframe class='iDialogFrame' frameborder='0' scrolling='auto'></iframe>",
      button: []
    }).onCreate(function (dialog) {
      // 启动页面后，就需要
      openCallback && openCallback(this);
      // 创建iframe
      var iframe = dialog.wrap.find(".iDialogFrame"),
        loading = dialog.wrap.find(".iFrameLoading");
      iframe.bind("load", function () {
        loading.remove();
      });
      iframe[0].src = url;
    }).onClose(closeCallback || $.noop);

    // 模拟数据返回
    // window.setTimeout(function() {
    //  window.postMessage(JSON.stringify({
    //    resCode: 200,
    //    sender: "abtest",
    //     "id": 2, //方案ID
    //     "createTime": 1476008224000, //创建时间
    //     "caseType": 1, // 方案类型（1：版本测试 2：用户测试）
    //     "name": "版本测试方案", //方案名称
    //     "productName": "一元购", //产品名称
    //     "memo": "用户测试方案", //方案描述
    //     "updateTime": 1476008224000, //更新时间
    //     "status": 0, //方案状态（草稿、运行、停止）
    //     "testName": "北京用户群", //版本测试的被测用户群或者用户测试的被测版本”
    //     "caseGroupList": [ //版本测试的版本列表或者用户测试的用户群列表，
    //       {
    //         "flowPercentage": "20", //版本流量比例
    //         "flag": 1, //版本id 或用户id
    //         "name": "用户测试版本" //版本的名称或者用户群名称
    //       }, {
    //         "flowPercentage": "80",
    //         "flag": 2,
    //         "name": "用户测试版本"
    //       }
    //     ],
    //     "resDesc": "新建方案成功"
    //   }), "*");
    // }, 1000);
  };

  ABTest.prototype = {
    option: {
      label: "测试管理",
      content: [{
        type: "text",
        text: [
          "<span class='abtestCreateBox'><a class='abtestLink' href='#create'>新建测试</a></span>",
          "<span class='abtestEditBox hide'>",
          "<a class='abtestLink' href='#edit'>修改测试</a>或<a class='abtestLink' href='#create'>新建测试</a>",
          "<div class='caseDesc'></div>",
          "</span>",
          "<input type='hidden' name='abtestConf' value=''>"
        ].join("")
      }]
    },
    bindActLink: function () {
      var me = this;
      // 创建方案
      this.wrap.delegate(".abtestLink", "click", function (e) {
        if (!window.postMessage) {
          alert("您的浏览器不支持postMessage，请更换chrome或火狐等现代浏览器。");
          return;
        }
        var messageEvt;
        var isEditLink = this.href.indexOf("#edit") >= 0 ? 1 : 0;
        showIframeDialog(
          Config.get(isEditLink ? "eurl" : "curl", me.data || {
            user: window.user.user
          }),
          function (dialog) {
            // 打开对话框时就需要挂接postMessage消息，等待ABtest系统的前端通知
            $(window).bind("message", messageEvt = function (e) {
              var dataStr = e.originalEvent.data;
              if (typeof dataStr === "string") {
                var ret = JSON.parse(dataStr);
                if (ret.sender !== "abtest") {
                  return;
                }
                // 处理取消命令
                if (ret.action === "cancel") {
                  dialog.close();
                  return;
                }
                if (ret.resCode && ret.resCode !== 200) {
                  dialog.onClose(function () {
                    alert(ret.resDesc || "方案配置出错，请稍候再试。");
                  }).close();
                  return;
                }
                // 关闭对话框
                dialog.close();
                // 去掉不必要的字段
                $.each(["resCode", "resDesc", "sender", "creator"], function (i, key) {
                  if (ret[key]) {
                    delete ret[key];
                  }
                });
                // 继续处理
                me.getNewData(ret);
              }
            });
          },
          function () {
            // 关闭弹窗时卸载message事件监听
            $(window).unbind("message", messageEvt);
            messageEvt = null;
          });
        e.preventDefault();
      });
    },
    onDataChange: function (fn) {
      this.dataChangeCache = this.dataChangeCache || [];
      fn && this.dataChangeCache.push(fn);
      return this;
    },
    getNewData: function (data) {
      if (!data) {
        return this;
      }
      data.user = this.user;
      data.caseType = Number(data.caseType) || 1;
      this.data = data;
      this.contentBox && this.contentBox.removeClass("hide");
      // 更新方案提示以及缓存
      this.wrap.find(".abtestCreateBox").addClass("hide");
      this.wrap.find(".abtestEditBox").removeClass("hide");
      this.wrap.find("[name=abtestConf]").val(JSON.stringify(data));
      this.wrap.find(".caseDesc").text("【" + data.productName + " - " + data.name + "】" + data.memo);
      // 处理消息通知
      $.each(this.dataChangeCache || [], function (i, fn) {
        fn(data);
      });
      return this;
    },
    getDesc: function (i) {
      var type = this.data.caseType;
      var list = this.data.caseGroupList;
      var data = list[i];
      if (!data) {
        return "未找到AB测试信息";
      }
      // 如果是用户测试，则返回不同用户的统一描述
      if (type === 2) {
        return (function (list) {
          var html = [];
          $.each(list, function (i, data) {
            if (data.flowPercentage) {
              html.push(data.flowPercentage + "%的" + data.name);
            } else {
              html.push(data.name);
            }
          });
          return html.join("、") + "。";
        })(list);
      }
      // 否则是方案测试，输出每个方案的描述文案和流量
      var percent = "";
      if (data.flowPercentage) {
        percent = ['<div class="progress abtest-progress">',
          '<div class="progress-bar" role="progressbar progress-bar-info" aria-valuenow="', data.flowPercentage,
          '" aria-valuemin="0" aria-valuemax="100" style="width:', data.flowPercentage, '%;">',
          data.flowPercentage, '%</div>',
          '</div>'
        ].join("");
      }
      // 返回
      return (data.name || '预设版本之一') + percent;
    },
    checkInitData: function (data) {
      if (data && data.abtestConf) {
        this.getNewData(JSON.parse(data.abtestConf));
      }
    },
    // 获得用于输出的配置信息
    getOutPutConf: function (contentConf) {
      return {
        caseId: this.data.id,
        productId: this.data.productId,
        caseType: this.data.caseType,
        versions: contentConf
      };
    }
  };

  // 保存一个引用副本
  ABTest.option = ABTest.prototype.option;

  return ABTest;
});
