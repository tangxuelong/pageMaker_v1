// 导入
define([
  "jquery", "LS", "com/core", "com/gconf", "dialog", "file"
], function ($, LS, Core, gConf) {
  $(document).delegate(".loadConf", "click", function (e) {
    $.dialog({
      title: "导入配置",
      width: 540,
      css: 'codeCopyer',
      content: ['<span class="btn btn-default btn-sm" id="uploadJSON">上传json配置</span> ',
        '或将 页面相关信息 复制到下面文本框中：<br>',
        '<div id="configWrap"><textarea id="configText" ',
        'placeholder="支持以下信息导入：\n',
        '1. 完整的 json 配置信息　\n',
        '2. 完整线上页面地址　\n',
        // 不可预知发布完整地址的，不能使用发布目录进行导入
        gConf.publishPrefix ? '3. 发布目录名\n4. 时光机车票' : '3. 时光机车票',
        '"',
        '></textarea></div>',
        '<div style="position:absolute;left:30px;bottom:23px;">注意！！加载新配置会清空现有的配置！！</div>'
      ].join(""),
      button: ["*确认导入", "取消"]
    }).onCreate(function () {
      var did = this.id;
      $("#uploadJSON").bindFileRead(["json", "txt"], function (info) {
        var json;
        try {
          json = JSON.parse(info.content);
        } catch (e) {}
        if (json && $.isArray(json)) {
          Core.load(json);
          $.dialog(did);
        } else {
          $("#configText").text(info.content);
        }
      });
      $("#configText").keydown(function (e) {
        if (e.keyCode === 13) { // 回车键
          $("#" + did).find(".iDialogBtn[rel=1]").click();
          e.preventDefault();
        }
      });
    }).onShow(function () {
      $("#configText")[0].select();
    }).onBtnClick(function (btnId) {
      if (!btnId) return;
      var configText = $.trim($("#configText").val());
      var conf, backupKey, fld;
      var myDialog = this;
      if (configText.indexOf("<!DOCTYPE HTML>") >= 0) {
        alert("html代码不能作为配置重新导入！");
        return false;
      }
      // 删除上次记录发布目录
      LS.remove("editFld");

      // 如果目录名#备份码
      if (gConf.publishPrefix && /^[a-zA-Z\d\-/_]+(?:#(\d+))*$/.test(configText)) {
        backupKey = RegExp.$1;
        fld = configText.replace(/#.+$/, "");
        LS.set("editFld", fld);
        configText = gConf.publishPrefix + fld + "/index.htm";
      }

      // 如果路径是简写的协议，则补充完整
      if (/^\/\//.test(configText)) {
        configText = "http:" + configText;
      }

      // 如果是url地址#备份码
      if (/^https*:\/\/[^#]+#(\d+)$/.test(configText)) {
        backupKey = RegExp.$1;
        configText = configText.replace(/#.+$/, "");
      }

      // 如果是线上地址，则读取线上json配置
      if (/^https*:\/\//i.test(configText)) {
        var path = configText.replace(/\/[^/]*$/, "/")
        $.ajax("/api/load/config" +
          "?path=" + encodeURIComponent(path) +
          "&key=" + encodeURIComponent(backupKey || "")
        ).then(function (json) {
          if (json.err) {
            alert(json.desc);
            console.error("Error JSON Data:", json.data);
            return;
          }
          var data;
          try {
            data = JSON.parse(json.data);
          } catch (e) {
            alert("JSON内容格式化错误，请联系管理员核查。");
          }
          if ($.isArray(data)) {
            myDialog.onClose(function () {
              Core.load(data);
            }).close();
            // 记录缓存数据对应的标志，用于内容更新和检查
            LS.set("lastPublish", path);
            return;
          }
        }, function () {
          alert("服务器探测失败，无法导入。");
        });
        return false;
      }

      // 如果是正常配置内容，则直接格式化处理
      try {
        conf = JSON.parse(configText);
      } catch (e) {}
      if (!conf || !configText || !$.isArray(conf)) {
        alert(configText ? "配置信息错误！无法读取。" : "请将配置粘贴到文本框中！");
        return false;
      }

      // 数据正确则加载配置
      Core.load(conf);
    });
    e.preventDefault();
  });
});
