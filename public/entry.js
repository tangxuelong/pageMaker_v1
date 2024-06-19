/**
 * require路径定义
 */
require.config({
  baseUrl: "/",
  paths: {
    "jquery": "/lib/jquery",
    "bootstrap": "/lib/bootstrap/js/bootstrap",
    "Class": "/base/class",
    "LS": "/base/LS",
    "file": "/base/file",
    "protect": "/base/protect",
    "number": "/base/number",
    "string": "/base/string",
    "format": "/base/format",
    "template": "/base/template",
    "liveCheck": "/base/livecheck",
    "color": "/base/color",
    "drag": "/base/drag",
    "drop": "/base/drop",
    "cookie": "/base/cookie",
    "hash": "/base/hash",
    "url": "/base/url",
    "upload": "/base/upload",
    "promise": "/base/promise",
    "dialog": "/widgets/dialog",
    "qrCode": "/widgets/qrCode",
    "datetimepicker": "/widgets/datetimepicker/js/bootstrap-datetimepicker.min",
    // 兼容以前私有组件的路径写法
    "tools": "/com/tools"
  }
});
(function () {
  var SS = document.getElementsByTagName("script");
  for (var i = 0; i < SS.length; i++) {
    var scriptDom = SS[i];
    var js = scriptDom.getAttribute("data-js");
    if (js) {
      require([js]);
    }
  }
})();
