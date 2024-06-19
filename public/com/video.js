/**
 * 视频设置模块，仅仅为pageMaker服务，不具有通用性
 */
define(["jquery", "/online/video.js", "dialog", "protect"], function ($, VS) {
  // 启用的视频资源解析网站
  var sites = VS;

  // 全局监听模块
  $(document).delegate(".videoConfWrap i", "click", function () {
    var dialogResult = null;
    var domHelper = $(this);
    var domBox = domHelper.closest(".videoConfWrap");
    var nearHidden = domBox.find("input:hidden");
    var initValue = nearHidden[0] ? nearHidden.val() : "";

    $.dialog({
      title: "网络视频",
      width: 560,
      content: ['请输入视频网站的视频url地址：（' + (sites.length === 1 ? "仅" : "") + '支持',
        (function () {
          var html = [];
          for (var i = 0; i < sites.length; i++) {
            html[i] = '<a href="' + sites[i].homePage + '" target="_' + sites[i].id + '">' + sites[i].name + '</a>';
          }
          return html.join("、");
        })(), '）',
        '<input class="form-control" name="videoUrl" id="videoUrl" />',
        '<div id="videoSrcBox">',
        '<label>视频资源：</label><div id="videoInfo">--</div>',
        '</div>',
        '<div id="v_notOKTip" style="display:none;position:absolute;left:26px;bottom:19px;color:red;font-weight:700;">尚未获取到视频资源！</div>'
      ].join(""),
      button: ["*插入视频资源", "取消"]
    }).onCreate(function () {
      var videoInfo = $("#videoInfo");
      var dialog = this;
      var zz = function (a) {
        return ("0" + parseInt(a)).slice(-2)
      };
      var updateResult = function (res) {
        if (!res) {
          videoInfo.text(res === false ? "----不支持的视频网站或链接错误----" : "--");
          dialog.position(true);
          return;
        }
        var html = [];
        // 视频路径需要有
        html.push(['<div>文件：',
          '<a href="' + res.iosSrc + '" target="_blank" title="' + res.iosSrc + '">ios</a>、',
          '<a href="' + res.otherSrc + '" target="_blank" title="' + res.otherSrc + '">other</a>',
          '</div>'
        ].join(""));
        if (res.desc) {
          html.push('<div>描述：' + res.desc + '</div>');
        }
        // if (res.length) {
        //     html.push('<div>长度：' + [zz(res.length / 3600), zz((res.length % 3600) / 60), zz(res.length % 60)].join(":") + '</div>');
        // }
        if (res.pic) {
          html.push('<div>截图：<img style="width:320px;vertical-align:top" src="' + res.pic + '"/></div>');
          var img = new Image();
          img.onload = img.onerror = function () {
            dialog.position(true);
            img = null;
          };
          img.src = res.pic;
        }
        videoInfo.html(html.join(""));
        dialog.position(true);
      };

      $("#videoUrl").val(initValue).on("input", $.getProtectedFn(function () {
          var url = $.trim(this.value);
          dialogResult = null;
          videoInfo.text("资源分析中...");
          VS.getVideoSrcByUrl(url, function (ret) {
            if (ret) {
              updateResult(ret);
              dialogResult = ret;
            } else {
              updateResult(url ? false : null);
            }
          });
        }, "@check", 200))
        .trigger("input");
    }).onBtnClick(function (btnId) {
      if (btnId) { // 确认按钮
        if (dialogResult) {
          this.close(dialogResult);
        } else {
          $("#v_notOKTip").show();
          window.setTimeout(function () {
            $("#v_notOKTip").hide();
          }, 2000);
        }
        return false;
      }
    }).onClose(function (ret) {
      if (ret && ret.src && ret.url) { // 有返回的视频资源结果
        var mediaInput = domBox.find("input.medias").val(ret.site + "@" + ret.id);
        if (ret.pic) {
          mediaInput.data("pic", ret.pic).trigger("pic.change", ret.pic);
        }
        nearHidden[0] && nearHidden.val(ret.url);
      }
    });
  });
});
