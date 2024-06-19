// 操作系统区分
window.__OS = (function () {
  var ua = navigator.userAgent.toLowerCase();
  return /(?:iphone|ipad|ipod)/.test(ua) ? "ios" : /(?:android|adr )/.test(ua) ? "android" : !/mobile/.test(ua) ? "pc" : "other";
})();
