(function () {
  window.URL = window.URL || {};
  var each = function (arr, fn) {
    for (var i = 0; i < arr.length; i++) {
      fn(i, arr[i]);
    }
  };
  URL.getParaFromString = function (str, paraName) {
    var data = {};
    each(String(str).match(/([^=&#?]+)=[^&#]+/g) || [], function (i, para) {
      var d = para.split("=");
      var val = decodeURIComponent(d[1]);
      if (data[d[0]] !== undefined) {
        data[d[0]] += "," + val;
      } else {
        data[d[0]] = val;
      }
    });
    return paraName ? data[paraName] || "" : data;
  };
  URL.getPara = function (paraName) {
    var str = window.location.search.replace(/^\?/g, "");
    var dstr = str;
    // 先解码，解码失败则替换&链接符号，保证内容能够解析
    // 解码失败的情况极其少见，以后确认算法后可以优化代码
    try {
      dstr = decodeURI(str);
    } catch (e) {
      dstr = str.replace(/"%26"/g, "&");
    }
    return URL.getParaFromString(dstr, paraName);
  };
})();
