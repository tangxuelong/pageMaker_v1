/**
 * 分组标题js
 */
(function ($) {
  var noop = function () {};
  var jump = function (item, init) {
    // 初始化状态不滚动
    if (init === true) return;
    // 给页面渲染留出时间，然后再进行页面滚动
    return setTimeout(function() {
      window.scrollHelper.scrollToItem(item[0]);
    }, 50);
  };
  $(function () {
    $(".gTitle").each(function () { // 查找每个分组标题的控制范围
      var title = $(this);
      var children = [];
      var next = title.next();
      var act;
      while (next[0] && !next.hasClass("gTitle") && !next.hasClass("gEnd")) {
        children.push(next);
        next = next.next();
      }
      title.click(act = function (init) {
        var isCollapse = title.hasClass("collapse");
        var method = isCollapse ? "removeClass" : "addClass";
        $.each(children, function (i, dom) {
          dom[method]("hide");
        });
        title[isCollapse ? "removeClass" : "addClass"]("collapse");
        // 如果是展开，则滚动定位
        isCollapse && jump(title, init === true);
        // 通知预览状态
        (window.whenPageChange || noop)();
      });
      // 默认都是展开的，如果有折叠标记，则折叠
      if (title.attr("grel") === "y") {
        act(true);
      }
    });
  })
})(window.Zepto || window.jQuery);
