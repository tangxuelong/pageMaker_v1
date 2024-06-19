// holderImage组件的公共部分
define(["format", "tools"], function (format, tools) {
  'use strict';
  var getSVGData = function (w, h) {
    return "data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' viewBox%3D'0 0 " + w + " " + h + "'%2F%3E";
  };
  var imageCache = {};
  var dependJS = ["zepto", "holderImage"];
  var dependCss = ["holderImage"];
  return {
    getImageData: function (imageUrl, extCss) {
      return new Promise(function (resolve) {
        // 如果已经是dataURI，则直接返回
        if (imageUrl.slice(0, 5) === "data:" || !imageUrl) {
          return resolve();
        }
        if (imageCache[imageUrl]) {
          return resolve(imageCache[imageUrl]);
        }
        var img = new Image();
        img.onload = img.onerror = function () {
          resolve(imageCache[imageUrl] = {
            width: img ? img.width : 0,
            height: img ? img.height : 0
          });
          img = null;
        };
        img.src = imageUrl;
      }).then(function (imgSize) {
        var cls = extCss ? [extCss] : [];
        var js = [];
        var css = [];
        var html = '';
        if (imageUrl) {
          html = '<image' + (cls.length ? ' class="' + cls.join(" ") + '"' : '') + ' src="' + tools.safeHTML(imageUrl) + '"/>';
        }
        // 如果是大图，则采用占位图以提高页面加载速度
        if (imgSize && imgSize.width && imgSize.height) {
          cls.push("holderImage");
          js = dependJS;
          css = dependCss;
          html = '<image' + (cls.length ? ' class="' + cls.join(" ") + '"' : '') + ' data-src="' + tools.safeHTML(imageUrl) + '" src="' + getSVGData(imgSize.width, imgSize.height) + '">';
        }
        return {
          html: html,
          css: css,
          js: js
        }
      });
    },
    // 获取一个占位的图片
    getBlankImage: function(w, h) {
      return getSVGData(w || 100, h || 100);
    },
    // 供外部直接使用
    js: dependJS,
    css: dependCss
  }
});
