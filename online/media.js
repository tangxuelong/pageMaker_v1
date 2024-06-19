/**
 * 自定义外观的媒体控制
 * 媒体对象支持的事件：http://www.w3school.com.cn/tags/html_ref_eventattributes.asp
 */
(function ($) {
  var hiddenName, hideEventName;
  $.each({
    hidden: "visibilitychange",
    mozHidden: "mozvisibilitychange",
    webkitHidden: "webkitvisibilitychange"
  }, function (key, evt) {
    if (document[key] !== undefined) {
      hiddenName = key;
      hideEventName = evt;
    }
  });
  // 页面可视变化之后
  function visibilityChange(obj) {
    if (hideEventName) {
      document.addEventListener(hideEventName, function () {
        if (document[hiddenName]) {
          obj.runningWhenSleep = !obj.paused;
          obj.pause();
        } else {
          if (obj.runningWhenSleep == true) {
            obj.play();
          }
          delete obj.runningWhenSleep;
        }
      }, false);
    }
  }

  // 初始化视频播放器
  window.__initH5Video = function () {
    $(".videoCtrl").each(function () {
      if (this.__inited) {
        return;
      }
      this.__inited = true;
      var box = $(this),
        video = box.parent().find("video")[0],
        videoBox = $(video).parent(),
        ctrl = $("i", this),
        src = $(video).data("src");
      if (!video) {
        ctrl.remove();
        return;
      }
      var evt = {
        playing: function () {
          $.vclick && $.vclick("video.play://" + src);
          videoBox.removeClass("hide3");
          box.addClass("hide3");
        },
        waiting: function () {
          box.addClass("loading");
        }
      };
      $.each(evt, function (key, handler) {
        // video.addEventListener(key, handler, false);
        $(video).bind(key, handler);
      });
      ctrl.click(function () {
        video[video.paused ? "play" : "pause"]();
        // 微信内没有事件通知，需要直接显示
        if (/micromessenger/i.test(navigator.userAgent)) {
          evt.playing();
        }
      });
      $(video).attr("frontend") && visibilityChange(video);
    });
  };

  $(document).ready(function () {
    // 音频
    $(".audioCtrl").each(function () {
      var box = $(this),
        audio = box.parent().find("audio")[0],
        ctrl = $("i", this);
      if (!audio) {
        ctrl.remove();
        return;
      }
      // var log = window.log || function(){};
      var evt = {
        playing: function () {
          // log("playing fired!");
          box.removeClass("loading").addClass("playing");
        },
        pause: function () {
          // log("pause fired!");
          box.removeClass("loading playing");
        },
        waiting: function () {
          // log("waiting fired!");
          box.removeClass("playing").addClass("loading");
        },
        error: function () {
          // log("error fired!");
        }
      };
      $.each(evt, function (key, handler) {
        // audio.addEventListener(key, handler, false);
        $(audio).bind(key, handler);
      });
      // 绑定操作
      ctrl.click(function () {
        audio[audio.paused ? "play" : "pause"]();
      });
      $(audio).attr("frontend") && visibilityChange(audio);
    });
    // 视频
    window.__initH5Video();
    // 动态分析的视频
    window.VS && $(".vshelper").each(function () {
      var me = $(this);
      var data = me.data("id").split("@");
      var html = me.data("html");
      window.VS.getVideoSrcById(data[0], data[1], function (res) {
        html = html.replace(/\{src\}/, res.src);
        me.after(html);
        me.remove();
        window.__initH5Video();
      });
    });
  });
})(window.Zepto || window.jQuery);
