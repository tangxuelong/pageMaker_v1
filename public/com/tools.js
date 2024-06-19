define(["jquery", "number"], function ($) {
  $.safeHTML = function (str, light) {
    var s = (String(str)).replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    // 属性包裹用的引号不能转义
    return light ? s.replace(/=&quot;(.*?)&quot;/g, '="$1"').replace(/=&#39;(.*?)&#39;/g, "='$1'") : s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  $.safeRegStr = function (str) {
    return String(str).replace(/([\\\(\)\{\}\[\]\^\$\+\-\*\?\|])/g, "\\$1");
  };
  return {
    safeHTML: $.safeHTML,
    safeRegStr: $.safeRegStr,
    getCss: function (ops) {
      var css = [];
      $.each(ops, function (key, value) {
        if (value !== undefined && value !== "") {
          css.push(key + ":" + (typeof value === "number" ? (Number(value) / 24).Round(3) + "rem" : value));
        }
      });
      return css.join(";");
    },
    getPaddingStyle: function (data, type) {
      var altNum = function (a) {
        var num = (Number(a) / 24).Round(3);
        return num ? (num + "rem").replace(/^0\./, ".") : 0;
      };
      // 如果全部设置了，则缩略
      $.each(["left", "right", "top", "bottom"], function (i, key) {
        data[key] = Number(data[key] || 0);
      });
      return (type || "padding") + ":" + [altNum(data.top), altNum(data.right), altNum(data.bottom), altNum(data.left)].join(" ");
    },
    config: {
      bgColor: "#ffffff"
    }
  };
});
