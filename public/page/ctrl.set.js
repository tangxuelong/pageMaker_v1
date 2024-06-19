// 设置
define([
  "jquery", "./setpanel", "com/gconf", "com/set", "LS", "dialog"
], function ($, SetPanel, gConf, SET, LS) {
  var showDialog = function (sub) {
    $.dialog({
      title: "设置",
      width: 640,
      css: "settingDialog",
      content: "<div id='settingWrap'><div id='settingBox'>选项加载中...</div></div>",
      button: ["*保存", "取消"]
    }).onCreate(function () {
      // 清空容器
      $("#settingBox").empty();
      // 初始化发布选项组件
      this.setPanel = SetPanel.create({
        wrap: "#settingBox",
        noCache: true
      });
      // 恢复已有配置
      this.setPanel.load(SET.get());
      // 检查子面板
      if (sub) {
        this.setPanel.showSubPanel(sub);
      }
      // 重新定位
      this.position(true);
    }).onBtnClick(function (btnId) {
      var setResult = this.setPanel.get(btnId);
      if (setResult === false) {
        return false;
      }
      if (btnId) { // 保存
        if (setResult.needReload) {
          delete setResult.needReload;
          SET.save(setResult);
          window.location.reload(true);
          return;
        }
        SET.save(setResult);
      }
    });
  };
  $(document).delegate('.setting', 'click', function (e) {
    showDialog();
    e.preventDefault();
  });
  return showDialog;
});
