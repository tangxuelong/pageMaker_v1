// 导出
define([
  "jquery", "LS", "com/core", "com/gconf", "Class", "dialog"
], function ($, LS, Core, gConf, Class) {
  $(document).delegate('.saveConf', 'mousedown', function (e) {
    if (!gConf.func.jsonDownload) {
      $.dialog.toast("当前项目不支持配置导出功能。");
      return;
    }
    if (!window.Blob || !window.URL) {
      alert("你的浏览器不支持文件流下载，请更换chrome/firefox等浏览器");
      return;
    }
    var conf = Core.save();
    var meta = Class.Page.Panel.get("pageMetaInfo").save();
    var now = new Date();
    var zz = function (a) {
      return ("00" + a).slice(-2)
    };
    // 动态修改下载链接
    this.download = [
      gConf.name,
      now.getFullYear(),
      zz(now.getMonth() + 1),
      zz(now.getDate()),
      meta.title || "export"
    ].join("_") + ".json";
    this.href = URL.createObjectURL(new Blob([JSON.stringify(conf)]));
  })
});
