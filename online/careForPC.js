/**
 * 兼顾PC显示，可以通过 pc 参数来控制页面最大宽度
 */
document.addEventListener('DOMContentLoaded', function () {
  // 分析宽度控制参数
  if (/(?:\?|&)pc=(1600|1200|900|720|auto)(?:$|&)/.test(document.URL)) {
    document.body.className = document.body.className + " max" + RegExp.$1;
  }
}, false);
