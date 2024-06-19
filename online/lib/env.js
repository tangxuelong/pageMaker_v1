// 环境识别
window.__ENV = (function () {
  var ua = window.navigator.userAgent.toLowerCase();
  if (ua.indexOf("micromessenger") >= 0) {
    return "weixin"
  }
  if (ua.indexOf("yixin") >= 0) {
    return "yixin"
  }
  if (ua.indexOf("newsapp") > 0) {
    return "newsapp"
  }
  return "wap"
})();
