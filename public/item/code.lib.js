define([
  "jquery", "LS", "com/set", "com/gconf"
], function ($, LS, SET, gConf) {
  // 数据转化方法
  var stringify = function (data) {
    // 排重、数据检查
    data = unique(data);
    var str = [];
    var outRes = function (type, arr) {
      var o = [];
      $.each(arr || [], function (i, file) {
        o.push(type + ":" + file + "\n");
      });
      return o.join("");
    };
    $.each(data, function (i, conf) {
      str.push([
        "#", conf.name.replace(/^cus-/, ""),
        ">", conf.text, "\n",
        outRes("js", conf.js),
        outRes("css", conf.css)
      ].join(""));
    });
    return str.join("");
  };
  var parse = function (str) {
    var arr = (String(str)).replace(/\r/g, "\n")
      .replace(/\n[\n\s\xa0\u3000]*\n/g, "\n")
      .replace(/(?:^\n+|\n+$)/, "")
      .match(/#[^#]+/g);
    if (!arr) return [];
    var idReg = /^#([^#>\n]+)>([^\n]+)/;
    var lib = [];
    $.each(arr, function (i, confStr) {
      var m = {};
      var js, css;
      if (idReg.test(confStr)) {
        // 添加一个特殊的前缀，以防止跟内置的模块冲突
        m.name = "cus-" + $.trim(RegExp.$1);
        m.text = $.trim(RegExp.$2);
        // 分析js路径/css路径
        js = $.map(confStr.match(/js:[^\n$]+/gi) || [], function (str) {
          return str.slice(3);
        });
        css = $.map(confStr.match(/css:[^\n$]+/gi) || [], function (str) {
          return str.slice(4);
        });
        // 至少包含一个资源
        if (js.length + css.length) {
          js.length && (m.js = js);
          css.length && (m.css = css);
          lib.push(m);
        }
      }
    });
    return unique(lib);
  };
  // 多库排重合并、数据检查
  var unique = function (data) {
    if (!$.isArray(data)) {
      data = [data];
    }
    var lib = [];
    var nameObj = {};
    $.each(data, function (i, obj) {
      if (obj && obj.name && obj.text && !nameObj[obj.name] && (obj.js || obj.css)) {
        lib.push(obj);
        nameObj[obj.name] = true;
      }
    });
    return lib;
  };
  // 内置的模块
  var defLib = [{
    name: "Zepto",
    text: "Zepto($)",
    js: ["zepto"]
  }, {
    name: "share",
    text: "Share",
    js: ["share"]
  }, {
    name: "app",
    text: "APP",
    js: ["app"]
  }, {
    name: "Format",
    text: "$.format",
    js: ["lib/format"]
  }, {
    name: "Template",
    text: "$.template",
    js: ["lib/template"]
  }, {
    name: "Time",
    text: "$.now",
    js: ["zepto", "lib/time"]
  }, {
    name: "URL",
    text: "URL.getPara",
    js: ["lib/url"]
  }, {
    name: "NET",
    text: "window.__NET",
    js: ["lib/net"]
  }, {
    name: "OS",
    text: "window.__OS",
    js: ["lib/os"]
  }, {
    name: "User",
    text: "window.__USER",
    js: ["lib/user"]
  }, {
    name: "Env",
    text: "window.__ENV",
    js: ["lib/env"]
  }];

  // 从本地存储中读取用户的自定义配置
  var cusLib = gConf.func.customCodeLib ? parse(SET.get("libs")) : [];

  // 返回给其他模块调用
  return {
    libs: defLib.concat(cusLib),
    parse: parse,
    stringify: stringify,
    unique: unique,
    // 获取自定义库
    getCusLib: function () {
      return parse(SET.get("libs"));
    },
    // 增加自定义库
    addLib: function (data) {
      if (!data) return;
      if (typeof data === "string") {
        data = parse(data);
      }
      // 先获取当前存储的配置
      var cusLib = this.getCusLib();
      // 检查数据，跟本地存储中的数据合并
      data = unique(cusLib.concat(unique(data)));

      // 如果数量有变化，则存回本地存储
      if (data.length !== cusLib.length) {
        SET.save({
          libs: stringify(data)
        });
        this.libs = defLib.concat(data);
        return true;
      }
    }
  };
})
