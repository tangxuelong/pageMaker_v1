define(["jquery"], function ($) {
  // 返回接口
  var lock = false;
  return function (name, callback) {
    if (lock) {
      return;
    }
    lock = true;
    $.get("/api/custom/code", {
      name: name,
      cache: Math.random().toString(16).slice(2)
    }).then(function (json) {
      lock = false;
      callback(json.data, json.desc);
    }, function () {
      lock = false;
      callback(null, "网络或服务器错误，无法导入数据。");
    });
  };
});
