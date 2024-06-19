// 设置
define([
  "jquery", "./setpanel", "com/gconf", "com/set", "LS", "dialog"
], function ($, SetPanel, gConf, SET, LS) {
  var fullscreenMethods = ["requestFullscreen", "webkitRequestFullScreen", "mozRequestFullScreen", "msRequestFullscreen"];
  var exitMethods = ["exitFullscreen", "webkitCancelFullScreen", "mozCancelFullScreen", "msExitFullscreen"];
  var fullscreen = false;
  var docElm = document.documentElement;
  $(document).delegate('.fullscreen', 'click', function (e) {
    var doc = fullscreen ? document : docElm;
    $.each(fullscreen ? exitMethods : fullscreenMethods, function(i, method) {
      if (doc[method]) {
        doc[method]();
        fullscreen = !fullscreen;
      }
    });
    e.preventDefault();
  });
});
