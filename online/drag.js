(function($) {
  if (!$ || !$.fn || !$.fn.bindDrag) {
    return;
  }
  var dragCache = {};
  var now = function() { return Number(new Date()) };
  $(document).ready(function() {
    $(".dragable").bindDrag({
      dragStart: function(e) {
        var $this = $(this);
        var offset = $this.offset();
        // 重置样式
        $this.css({
          margin: '0',
          left: offset.left - window.scrollX,
          top: offset.top - window.scrollY,
          right: "auto",
          bottom: "auto"
        });
        // 记录拖动起始数据
        dragCache.width = offset.width;
        dragCache.height = offset.height;
        dragCache.dragType = $this.data("drag-type");
        dragCache.X = offset.left - window.scrollX - e.clientX;
        dragCache.Y = offset.top - window.scrollY - e.clientY;
        // 记录初始信息
        dragCache.start = {
          top: offset.top - window.scrollY,
          time: now()
        };
      },
      onDrag: function(e) {
        // 移动元素，并记录最新的坐标
        $(this).css(dragCache.current = {
          left: dragCache.X + e.clientX,
          top: dragCache.Y + e.clientY
        });
      },
      dragEnd: function(e) {
        if (dragCache.dragType !== "side") {
          return;
        }
        // 拖动停止，计算悬停逻辑
        var winW = $(window).width();
        var winH = $(window).height();
        // 计算往哪边靠
        var l;
        if (dragCache.current.left < winW - dragCache.current.left - dragCache.width) {
          l = 0;
        } else {
          l = winW - dragCache.width;
        }
        // 按照平均速度计算纵向滑动的距离
        var speed = (dragCache.current.top - dragCache.start.top) / (now() - dragCache.start.time);
        var tfix = Math.min(winH * 0.5, Math.abs(speed * 200)) * (speed > 0 ? 1 : -1);
        $(this).animate({
          left: l,
          top: Math.min(Math.max(0, tfix + dragCache.current.top), winH - dragCache.height)
        }, 200, "swing");
      }
    });
  });
})(window.jQuery || window.Zepto);
