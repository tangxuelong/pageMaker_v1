// 检查手机型号
document.addEventListener('DOMContentLoaded', function () {
  var ua = navigator.userAgent.toLowerCase();
  // iphonex的viewport 375 x 812，物理分辨率 1125 x 2436
  var screen = window.screen.width / window.screen.height;
  // 从ua中没有特别的标志是 iphonex，需要辅助宽高比进行检测
  // 后续再出同等宽高比的新设备的时候，还得继续完善检测逻辑
  window.isIphoneX = ua.indexOf("iphone") > 0 && (screen === 375 / 812 || screen === 812 / 375);
  if (window.isIphoneX) {
    document.body.className = (document.body.className + " iphonex").replace(/^ +/g, '');
  }
}, false);
