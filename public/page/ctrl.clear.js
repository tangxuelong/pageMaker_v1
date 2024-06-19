// 清空
define([
  "jquery", "LS", "com/core", "dialog"
], function ($, LS, Core) {
  $(document).delegate('.clearConf', 'click', function (e) {
    $.dialog.confirm("确定清空现有配置吗？", function (btnId) {
      if (btnId) {
        // 删除上次记录发布目录
        LS.remove("editFld");
        LS.remove("lastPublish");
        Core.clear();
      }
    });
    e.preventDefault();
  })
});
