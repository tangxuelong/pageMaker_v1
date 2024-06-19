/**
 * 底部浮层
 */
document.addEventListener('DOMContentLoaded', function () {
  var doms = document.querySelectorAll(".btmFloat");
  var src, holder, img, style;
  var bindClose = function (holder, dom) {
    var link = dom.querySelectorAll(".closeLink");
    if (link[0]) {
      link[0].addEventListener("click", function () {
        dom.parentNode.removeChild(dom);
        holder && holder.parentNode.removeChild(holder);
      }, false);
    }
  };
  // 找出可视的元素
  for (var i = 0, n = doms.length, dom; i < n; i++) {
    dom = doms[i];
    style = window.getComputedStyle ? getComputedStyle(dom, null) : dom.currentStyle;
    if (style.display !== "none") {
      src = dom.getElementsByTagName("img")[0].src;
      // 插入占位内容
      if (src) {
        holder = document.createElement("div");
        img = new Image();
        holder.appendChild(img);
        holder.style.visibility = "hidden";
        holder.className = "btmFloatHolder";
        img.src = src;
        document.querySelectorAll("#_>div")[0].appendChild(holder);
        // 检查是否需要显示
        if (dom.className.indexOf("noholder") > 0) {
          holder.style.display = "none";
        }
      }
      // 绑定关闭事件
      bindClose(holder, dom);
    }
  }
}, false);
