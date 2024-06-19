(function ($) {
  if (!$) {
    return;
  }
  // 是乐得的AppCore组件
  $(document).ready(function () {
    // 是网易自有的AppCore模块
    if (window.AppCore && window.AppCore.getAppName) {
      // 推迟带有cmd属性的链接的跳转
      $(document.body).delegate("a[cmd]", "click", function (e) {
        var link = this.href || "";
        var isHttpUrl = /^https*:\/\//i.test(link) || /^\/\//.test(link);
        if (isHttpUrl && !e.isDefaultPrevented()) {
          window.setTimeout(function () {
            window.location.href = link;
          }, 300);
          e.preventDefault();
        }
      });
      return;
    }
    // 非乐得Appcore组件，则需要绑定页面元素点击代理
    $(document.body).delegate(".share,a[href*='#share'],a[href='share://'],[cmd=share]", "click", function (e) {
      window._shareNow ? window._shareNow() : alert('当前项目不支持自定义分享');
      e.preventDefault();
    });
  })
})(window.Zepto || window.jQuery);
