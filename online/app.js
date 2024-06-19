/**
 * 如果是当前APP则修改样式以供其他模块使用
 */
document.addEventListener('DOMContentLoaded', function () {
  window.inMyApp = window._inMyApp ? window._inMyApp() : false;
  if (window._inMyApp && window.inMyApp) {
    document.body.className = (document.body.className + " inMyApp").replace(/^ +/g, '');
  }
}, false);
(function ($) {
  var isLedeAppCore = window.AppCore && window.AppCore.getAppName;
  // 是乐得的AppCore组件则跳过不处理
  if (!$ || isLedeAppCore) {
    return;
  }
  // 发送客户端命令
  function sendCmd(cmd, type) {
    // 修改location方式发送命令
    if (type === "href") {
      window.location.href = cmd;
      return;
    }
    // 默认iframe方式发送命令
    var iframe = document.getElementById("__cmdFrame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "__cmdFrame";
      document.body.appendChild(iframe);
      iframe.style.display = "none";
    }
    iframe.src = cmd;
  }
  // 增加cmd属性监听逻辑
  // 非乐得Appcore组件，则需要绑定页面元素点击代理
  $(document).ready(function () {
    $(document.body).delegate("*[cmd]", "click", function (e) {
      var cmd = $(this).attr("cmd");
      // 由分享模块处理
      if (!cmd || cmd === "share") {
        return;
      }
      // 在当前项目App内就阻止链接的默认行为
      if (window.inMyApp) {
        e.preventDefault();
      }
      // 发送命令
      sendCmd(cmd);
    });
  });
})(window.jQuery || window.Zepto);
