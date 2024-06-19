define([
  "jquery", "Class", "com/gconf", "com/panel", "com/set", "LS", "qrCode", "string"
], function ($, Class, gConf, Panel, SET, LS) {
  // 发布配置面板
  var CONF = Panel.extend({
    name: "pub",
    NAME: "发布选项",
    init: function (config) {
      this.callSuper(config);
      // 检查是否需要自动添加全局动效组件
      if (SET.get("autoAnimate") === "1" && !Panel.get("globalAnimate")) {
        Class.Page.ANIMATE.create();
      }
    },
    tmpl: [{
      label: "*发布目录",
      content: [{
        type: "input",
        name: "fld",
        holder: "发布的目录名，不区分大小写，测试用请加 test- 前缀"
      }, {
        type: "text",
        css: "error",
        text: ""
      }]
    }, {
      label: "目录存在",
      content: [{
        type: "radio",
        name: "warn",
        value: "1",
        checked: true,
        text: "警告而不发布"
      }, {
        type: "radio",
        name: "warn",
        value: "0",
        text: "强制发布（若有口令，则需要提供）"
      }]
    }, {
      label: "设置口令",
      css: "setKey",
      content: [{
        type: "input",
        name: "pubpsw",
        holder: "任意字符作为发布口令"
      }]
    }, {
      label: "确认口令",
      css: "cfmKey hide",
      content: [{
        type: "input",
        name: "cfmpsw",
        holder: "请提供之前发布设置的口令"
      }]
    }, {
      label: "新口令",
      css: "cfmKey hide",
      content: [{
        type: "input",
        name: "newpsw",
        holder: "若不修改原有口令，请保留空即可，若删除口令，请输入null"
      }]
    }, {
      label: "预计路径",
      content: [{
        type: "text",
        text: "<span class='onlineUrl'>--</span>"
      }]
    }],
    initEvent: function () {
      var com = this;
      var fldInput = this.wrap.find("[name=fld]");
      var fldParent = fldInput.parent();
      var errorBox = fldInput.next();
      var onlineUrl = this.wrap.find(".onlineUrl");
      var warnRadio = this.wrap.find("[name*=warn]");
      var setkey = this.wrap.find(".setKey");
      var cfmkey = this.wrap.find(".cfmKey");
      warnRadio.click(function () {
        if (this.value === "1") { // 新发布
          setkey.removeClass("hide");
          cfmkey.addClass("hide");
        } else {
          setkey.addClass("hide");
          cfmkey.removeClass("hide");
        }
        com.dialog.position(true);
      });
      fldInput.bind({
        "input": function () {
          errorBox.html("");
          fldParent.removeClass("has-error");
          // 过滤非法字符
          var val = $.trim(this.value);
          var val2 = val.replace(/[^\da-zA-Z_-]/g, "");
          if (val !== val2 && val) {
            this.value = val2;
          }
          // 同步目录预览
          var fld = $.trim(this.value).toLowerCase();
          if (fld && gConf.publishPrefix) {
            onlineUrl.text(gConf.publishPrefix + fld + "/index.htm");
          } else {
            onlineUrl.text(gConf.publishPrefix ? "--" : '发布后可知');
          }
        },
        "focusout": function () {
          var conf = com.save();
          if (conf.warn === "1" && conf.fld) {
            $.get("/api/check/path" +
              "?path=" + encodeURIComponent(conf.fld) +
              "&_=" + String.random(2)
            ).then(function (json) { // success
                json.err && com.error("fld", json.desc || "同名目录已经存在");
              },
              function () { // fail
                com.error("fld", "发布目录名校验失败");
              }
            );
          }
        }
      });
      // 检查上次保存的发布目录信息，并聚焦输入框
      var lastEditFld = LS.get("editFld");
      if (lastEditFld) {
        fldInput.val(lastEditFld);
        window.setTimeout(function () {
          fldInput.trigger("input")[0].select();
        }, 500);
      } else {
        window.setTimeout(function () {
          fldInput[0].select();
        }, 500);
      }
    },
    save: function () {
      var conf = this.callSuper();
      conf.fld = $.trim(conf.fld.toLowerCase());
      if (conf.warn === "1") {
        delete conf.cfmpsw;
        delete conf.newpsw;
      } else {
        delete conf.pubpsw;
      }
      return conf;
    },
    get: function () {
      if (this.lock) {
        return null;
      }
      var config = this.save();
      delete config.NAME;
      return config;
    },
    error: function (name, errorInfo) {
      var input = this.wrap.find("input[name='" + name + "']");
      var errorBox = input.next(".error");
      input.parent().addClass("has-error");
      input[0] && !errorInfo && input[0].focus();
      if (errorBox[0]) {
        errorBox.html(errorInfo || "");
      }
    }
  });

  // 发布成功面板
  var OK = Class.Page.Panel.extend({
    name: "pubok",
    NAME: "发布成功",
    init: function (config) {
      this.url = config.url;
      this.cover = config.cover;
      this.callSuper(config);
    },
    tmpl: [{
      label: "页面地址",
      content: [{
        type: "text",
        text: "<a href='#' class='onlineUrl'></a><br><small class='coverAlert'>！覆盖发布时，浏览器端会有最长1小时的缓存，用Ctrl+F5强制刷新。</small>"
      }]
    }, {
      label: "二维码",
      content: [{
        type: "text",
        text: "<span class='qrCode'></span>"
      }]
    }],
    initEvent: function () {
      this.wrap
        .find(".onlineUrl")
        .text(this.url)
        .attr("href", this.url)
        .attr("target", "_blank");
      if (!this.cover) {
        this.wrap.find(".coverAlert").hide();
      }
      // 插入二维码
      this.wrap.find(".qrCode").qrcode({
        width: 220,
        height: 220,
        text: this.url
      });
    }
  });

  // 返回两个面板
  return {
    CONF: CONF,
    OK: OK
  }
});
