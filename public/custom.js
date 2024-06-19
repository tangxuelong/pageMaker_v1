require([
  "jquery", "protect", "url", "com/panel", "LS",
  "custom/code", "custom/action",
  "bootstrap"
], function ($, protect, URL, Panel, LS, Code, pageAction) {
  // 初始化
  Code.init("#fulljsWrap");

  // 获取JS模板
  $.get("/api/custom/tmpl?v" + Number(new Date()), function (a) {
    Code.setTmpl(String(a));
  });

  // =============================================================
  // 绑定事件监听
  pageAction.init(Code, "#listWrap");

  // 动态调整高度
  var body = $("#mainPanelBody");
  var win = $(window);
  function setH() {
    var h = win.height() - body.offset().top - 46;
    Code.setHeight(h);
    pageAction.setListHeight(h);
  }
  win.resize(setH);
  setH();
});
