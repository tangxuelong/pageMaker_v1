// 网络状态识别
// 0 未知 1 低网速  2 高网速
window.__NET = (function () {
  var netType = 0;
  // 低版本浏览器忽略处理
  if (![].indexOf) {
    return 0;
  }
  var con = window.navigator.connection;
  if (con) {
    // 从浏览器内核提供的API检测
    // http://caniuse.com/#feat=netinfo
    // http://w3c.github.io/netinfo
    netType = ['cellular', '3', '4'].indexOf(con.type) >= 0 ? 1 : 2;
  } else {
    // 从 UA提供的额外信息检测(通用&电商系APP)
    var ua = navigator.userAgent.toLowerCase();
    var net = (ua.match(/.*(?:nettype|network)\/([^/ ]+).*/) || ua.match(/.*[^/ ]+\/[^/ ]+\/[\d\.]+\/\d+\/([012]).*/) || [])[1] || "";
    netType = ["1", "2g", "3g+", "mobile"].indexOf(net) >= 0 ? 1 : ["offline", "unknown"].indexOf(netType) >= 0 ? 0 : 2;
  }
  return netType;
})();
