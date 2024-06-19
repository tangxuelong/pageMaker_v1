/**
 * markdown like 语法标记组件
 * # 换行(<br>)
 * ## 换段(p标签)
 * *str* 加粗(b标签)
 * [test](link title)  链接
 * --- 分割线
 */
define(["tools"], function (tools) {
  return {
    format: function (str) {
      return str.replace(/#/g, "<br>").replace(/\*([^*]+)\*/g, function (str, m) {
        return "<b>" + m + "</b>";
      });
    }
  }
});
