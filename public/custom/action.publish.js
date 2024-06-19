define([
  "jquery", "dialog", "custom/set", "LS"
], function ($, dialog, custom, LS) {
  /**
   * 检查基础的组件名
   */
  function checkName(name) {
    if (name.toUpperCase() === "ERROR" || !/^[^-]+-.+$/.test(name)) {
      return "组件名称（" + name + "）必须包含中划线！<br>请重新调整代码后重试。";
    }
    if (!/^\w+-[\w-]+$/.test(name)) {
      return "组件名称（" + name + "）只能使用字母数字和下划线";
    }
  }

  /***********************************************************************************
   * 预览
   */
  function preview(name, NAME, code) {
    var nameErr = checkName(name);
    if (nameErr) {
      return $.dialog.alert(nameErr);
    }
    var previewDialog = $.dialog({
      title: "预览",
      css: "publishDialog",
      content: "<p class='center'>代码推送中，请稍候...</p>",
      width: 400,
      button: []
    });
    $.post("/api/custom/publish", {
      name: name,
      NAME: NAME,
      preview: true,
      code: code
    }).then(function (json) {
      switch (json.err) {
        case -1:
          window.location.reload(true);
          break;
        case 0:
          LS.set("customPreview", json.data);
          previewDialog && previewDialog.content(["<p class='center'>",
            "<span class='glyphicon glyphicon-ok'></span>代码推送完毕，请到<a href='/' target='pageMaker'>pageMaker</a>中查看。",
            "</p>"
          ].join("")) && previewDialog.position(true);
          break;
        default:
          var desc = json.desc || "服务器错误！请稍候重试。";
          previewDialog && previewDialog.content("<p class='center'>" + desc + "</p>");
      }
    }, function () {
      previewDialog && previewDialog.content("<p class='center'>服务器错误！请稍候重试。</p>");
    });
  }

  /***********************************************************************************
   * 发布，必须提供口令
   */
  function doSubmit(name, NAME, code) {
    var nameErr = checkName(name);
    if (nameErr) {
      return $.dialog.alert(nameErr);
    }
    var getHtml = function (id, text, holder) {
      return ['<div class="form-group">',
        '<label class="needed" for="', id, '">', text, '</label>',
        '<input class="form-control" id="', id, '" placeholder="', holder, '">',
        '</div>'
      ].join("")
    };
    var pubDialog = $.dialog({
      title: "提交组件 " + name,
      width: 400,
      content: ['<div>',
        getHtml("cus-key", "组件口令", "请输入组件口令，区分大小写"),
        getHtml("cus-newkey", "修改口令", "若修改口令请直接输入新口令，不修改请留空"),
        '</div>'
      ].join(""),
      button: ["*提交", "取消"]
    }).onBtnClick(function (btnId) {
      if (!btnId) {
        return;
      }
      var keyInput = $("#cus-key");
      var key = $.trim(keyInput.val());
      var newKeyInput = $("#cus-newkey");
      var newkey = $.trim(newKeyInput.val());
      var wrap;
      if (!key) {
        wrap = keyInput.closest(".form-group").addClass("has-error");
        keyInput[0].select();
        window.setTimeout(function () {
          wrap.removeClass("has-error");
        }, 1500);
        return false;
      }
      pushCode({
        name: name,
        NAME: NAME,
        code: code,
        key: key,
        newkey: newkey
      }, pubDialog);
      return false
    });
  }

  function pushCode(paraData, pubDialog) {
    if (pushCode.lock) {
      return;
    }
    pushCode.lock = true;
    $.post("/api/custom/publish", paraData).then(function (json) {
      pushCode.lock = false;
      switch (json.err) {
        case -1:
          window.location.reload(true);
          break;
        case 0:
          // 增加私有组件到本地配置中
          custom.add(json.data);
          pubDialog && pubDialog.close();
          $.sendMsg && $.sendMsg("pubok");
          $.dialog({
            title: "提交成功",
            css: "iDialogInfo",
            height: 200,
            content: "代码提交成功，请到<a href='/' target='pageMaker'>pageMaker</a>中查看。",
            button: ["*确定"]
          }).onBtnClick(function (btnId) {
            btnId && window.open("/", "pageMaker");
          });
          break;
        default:
          $.dialog.alert("<p class='center'>" + json.desc + "</p>");
      }
    }, function () {
      pushCode.lock = false;
      $.dialog.alert("<p class='center'>服务器错误！请稍候重试。</p>");
    });
  }

  // 返回接口
  return function (name, NAME, code, action) {
    switch (action) {
      case "preview":
        preview(name, NAME, code);
        break;
      case "submit":
        doSubmit(name, NAME, code);
        break;
    }
  };
});
