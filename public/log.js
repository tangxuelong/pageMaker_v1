require([
  "jquery", "protect", "url", "LS", "bootstrap"
], function ($, protect, URL) {
  // 数据表格
  var table = $("#mainDataBody");
  var trs = table.find("tr");

  // affix tab
  $.each(["search-box"], function (i, cls) {
    var dom = $("." + cls);
    dom.width(dom.width()).affix({
      offset: {
        top: dom.offset().top - 10
      }
    });
  });

  // 整理分析tr的数据
  var trData = (function (trs) {
    var ret = [];
    trs.each(function () {
      var tr = $(this);
      ret.push({
        tr: tr,
        searchContent: (function () {
          var content = [];
          tr.find(".seachTD").each(function () {
            content.push($.trim($(this).text().toLowerCase()));
          });
          // 拼接成一个字符串处理，方便检索
          return content.join("_______");
        })()
      });
    });
    return ret;
  })(trs);

  // 检索处理函数
  var goSearch = protect(function (e) {
    var keyText = $.trim(this.value).toLowerCase();

    // 先取消已经高亮的，再重新查找新的key
    trs.removeClass("hide");

    // 没有关键词，则中断处理
    if (!keyText) {
      return;
    }

    var keys = keyText.split(" ");
    trs.addClass("hide");

    // 查找内容
    $.each(trData, function (i, data) {
      var text = data.searchContent;
      var hit = true;
      // 必须包含所有的关键词
      $.each(keys, function (i, key) {
        if (text.indexOf(key) < 0) {
          hit = false;
        }
      });
      if (hit) {
        data.tr.removeClass("hide");
      }
    });
  }, "@search", 200);
  // 读取url参数中的内容，并
  // 绑定搜索输入框监听
  $("#searchInput").val(URL.getPara("s")).bind("input", goSearch).trigger("input");
});
