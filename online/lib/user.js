// 获取各种用户标识
window.__USER = (function () {
  var ck = document.cookie;
  // 提取urs的登录记录
  var pinfo = (ck.match(/P_INFO=([^;| ]+)/) || ck.match(/PO_INFO=([^;| ]+)/)) || [];
  var sinfo = (ck.match(/S_INFO=([^;| ]+)/) || ck.match(/SO_INFO=([^;| ]+)/)) || [];
  // 提取章鱼系统id
  var nuid = document.cookie.match(/_ntes_n[un]id=([^;| ]+)/);
  // 从ua中提取 deviceId，部分客户端支持
  var deviceInfo = navigator.userAgent.match(/ deviceid\/([^ ]+)/i);
  // 返回
  return {
    ursId: pinfo[1] ? decodeURIComponent(pinfo[1]) : null,
    login: Boolean(pinfo[1]) && Boolean(sinfo[1]),
    deviceId: deviceInfo ? deviceInfo[1] : null,
    ntesId: nuid ? decodeURIComponent(nuid[1]) : null
  };
})();
