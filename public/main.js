// pageMaker主js
require([
  "jquery", "Class", "com/set", "item/all", "com/core.preview", "com/gconf",
  "page/check.lock", "page/check.cache",
  // 页面导入、导出、清空、发布等操作
  "page/ctrl.import", "page/ctrl.export", "page/ctrl.clear",
  "page/ctrl.set", "page/ctrl.publish", "page/ctrl.fullscreen",
  "page/republish"
], function ($, Class, SET, allItems, Core, gConf, checkPageLock, popoJoinTip, checkLocalCache) {
  // 提供给预览窗口用于判断的字段
  window.isPreview = true;

  // 准备组件列表菜单
  allItems
    .init("#itemBox .itemBoxContent")
    // 检查页面状态和初始化
    .then(checkPageLock)
    // 检查本地缓存
    .then(checkLocalCache)
    // 开始初始化
    .then(function () {
      $(".pageLoading").remove();
      Core.updateFromCache();
      Core.watch(gConf.mainWrap);
    });
});
