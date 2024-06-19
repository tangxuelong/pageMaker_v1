/**
 * js上传模块
 */
define(["jquery"], function ($) {
  // 指定input[type=file]启动上传
  $.fn.upload = function (fileType, size, callback) {
    var fileInput = this[0];
    var file = fileInput.value;
    var ext = file.replace(/.+\.([^\./\\]+)$/, "$1").toLowerCase();
    if (fileInput.type !== "file") {
      return this;
    }
    if (!window.FormData) {
      callback(1, "您的浏览器不支持FormData，请更换chrome/firefox等浏览器！");
      return this;
    }
    if (fileType.indexOf(ext) < 0) {
      callback(2, "错误的文件类型！");
      return this;
    }
    var formData = new FormData();
    formData.append("f", fileInput.files[0]);
    $.ajax({
      url: size ? "/api/upload?size=" + size : "/api/upload",
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (ret) {
        switch (ret.err) {
          case -1:
            // 未登录则刷新页面进行验证登录
            window.location.reload(true);
            break;
          case 0:
            if (ret.data.f) {
              callback(0, ret.data.f);
            } else {
              callback(3, "服务器返回的字段信息错误，没有找到上传结果信息。");
            }
            break;
          default:
            callback(ret.err, ret.desc);
        }
      },
      error: function (ret) {
        callback(4, "服务器出错，上传失败。");
      }
    });
    return this;
  };

  // 绑定按钮容器
  $.fn.bindUpload = function (fileType, size, callback, acting) {
    return this.each(function () {
      var me = $(this);
      var position = me.css("position");
      if ({
          "absolute": 1,
          "relative": 1,
          "fixed": 1
        }[position] !== 1) {
        me.css("position", "relative");
      }
      var init = function () {
        me.find(".auto_upload_file").remove();
        var w = me.outerWidth();
        var h = me.outerHeight();
        me.append("<input type='file' class='auto_upload_file'/>");
        // 在微信内不隐藏上传框
        var opacity = 0;
        if (navigator.userAgent.toLocaleLowerCase().indexOf("micromessenger") > 0) {
          opacity = 0.01;
        }
        me.find(".auto_upload_file").css({
          position: "absolute",
          left: 0,
          top: 0,
          opacity: opacity,
          width: w,
          height: h,
          zIndex: 99
        }).bind("change", function () {
          acting && acting.call(me[0], 1);
          $(this).upload(fileType, size, function (err, data) {
            acting && acting.call(me[0], 2);
            if (err) {
              return alert(data);
            }
            callback && callback.call(me[0], data);
            init();
          });
        });
      };
      init();
    });
  };
});
