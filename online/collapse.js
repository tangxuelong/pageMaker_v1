// 折叠交互组件，
(function ($) {
  if (!$) {
    return
  }
  $(document).ready(function () {
    $(".collapseSec").prepend("<div class='collapseShowMore'></div>");
    $(document.body).delegate(".collapseSec .collapseShowMore", "click", function () {
      if (this.__colling) {
        return;
      }
      this.__colling = true;
      var handler = $(this);
      var sec = handler.closest(".collapseSec");
      var curHeight = sec.height();
      var maxHeight = sec[0].scrollHeight;
      // 使用CSS3开始动画
      sec.css("maxHeight", "none").height(curHeight).addClass("collapseAni").height(maxHeight);
      handler.addClass("collapseAni").css("opacity", 0);
      // 动画是在半秒内完成，半秒后移除多余元素
      setTimeout(function() {
        sec.removeClass("collapseAni collapseSec").css("height", "auto");
        handler.remove();
        // 如果是预览状态，需要调整iscroll的状态
        window.isPreview && window.whenPageChange();
      }, 500);
    });
  });
})(window.Zepto || window.jQuery);
