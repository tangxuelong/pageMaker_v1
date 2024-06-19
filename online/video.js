/* 视频资源动态获取并播放 */
(function (fn) {
  if (window.define && define.amd) {
    define([], fn);
  } else {
    window.VS = fn();
  }
})(function () {
  var ua = navigator.userAgent.toLowerCase();
  var os = /(?:iphone|ipad|ipod)/.test(ua) ? "ios" : /(?:android|adr )/.test(ua) ? "android" : "other";

  // 定义站点class
  function videoSite(id, name, homePage, urlReg, srcFn) {
    this.id = id;
    this.name = name;
    this.homePage = homePage;
    this.urlReg = urlReg;
    this.cache = {};
    this.srcFn = srcFn;
  }
  videoSite.prototype = {
    // 校验
    isMySiteUrl: function (url) {
      for (var i = 0; i < this.urlReg.length; i++) {
        if (this.urlReg[i].test(url)) {
          this.lastMatchId = RegExp.$1;
          return true;
        }
      }
      return false;
    },

    // 分析资源地址
    checkSource: function (url, callback) {
      if (!this.isMySiteUrl(url)) {
        return callback(false);
      }
      this.checkSourceById(this.lastMatchId, function (ret) {
        if (ret) {
          ret.url = url;
        }
        callback(ret);
      });
    },
    checkSourceById: function (id, callback) {
      if (!id) {
        return callback(false);
      }
      var me = this;
      if (this.cache[id]) {
        callback(this.cache[id]);
        return;
      }
      this.srcFn(id, function (data) {
        if (data) {
          // 保留站点和id信息
          data.site = me.id;
          data.id = id;
          // 设置到同一个属性，其中IOS下优先使用 m3u8 格式视频
          data.iosSrc = data.m3u8 || data.mp4;
          data.otherSrc = data.mp4 || data.m3u8;
          data.src = os === "ios" ? data.iosSrc : data.otherSrc;
          // 回调
          callback(me.cache[id] = data);
        } else {
          callback(false);
        }
      });
    }
  };

  function Queue(actor) {
    this.actor = actor || function (data, next) {
      next()
    };
    this.cache = [];
  }
  Queue.prototype = {
    push: function (data) {
      this.cache.push(data);
      this.deal();
    },
    deal: function () {
      if (this.ing || !this.cache.length) {
        return;
      }
      var me = this;
      var data = me.cache.shift();
      this.ing = true;
      this.actor(data, function () {
        me.ing = false;
        me.deal();
      });
    }
  };

  function getScript(src) {
    var head = document.getElementsByTagName("head")[0] || document.documentElement || document.body,
      tag = document.createElement("script");
    tag.type = "text/javascript";
    tag.charset = "UTF-8";
    tag.src = src;
    head.appendChild(tag, head.lastChild);
  }

  // 网易视频处理队列
  var v163Queue = new Queue(function (data, next) {
    // var jsonpCallback = "vls"+ Math.random().toString(16).slice(2);
    // 网易视频这个jsop接口有点二，callback参数无效，固定 videoList;
    var jsonpCallback = "videoList";
    var id = data.id;
    var callback = data.callback;
    window[jsonpCallback] = function (data) {
      delete window[jsonpCallback];
      try {
        callback(!data || !data.title ? undefined : {
          mp4: data.mp4_url || data.mp4Hd_url,
          m3u8: data.m3u8_url || data.m3u8Hd_url,
          pic: data.cover,
          desc: data.title
        });
      } catch (e) {}
      next();
    };
    // 远程调用接口获取
    getScript('//3g.163.com/touch/video/detail/jsonp/' + id + '.html?callback=' + jsonpCallback);
  });

  var v163 = new videoSite("163", "网易视频", "http://v.163.com/special/video/", [
    /^http:\/\/v\.163\.com\/paike\/[^\/]+\/([^\.]+)\.html/i,
    /^http:\/\/3g\.163\.com\/touch\/videoplay\.html\?vid\=([^#&]+)/i
  ], function (id, callback) {
    v163Queue.push({
      id: id,
      callback: callback
    });
  });

  // 优酷视频
  // var youku = new videoSite("youku", "优酷", "http://www.youku.com/", [
  //  /^http:\/\/v\.youku\.com\/v_show\/id_([^\.]+)\.html/i,
  //  /^http:\/\/player\.youku\.com\/embed\/([^\/\.]+)/i,
  //  /^http:\/\/player\.youku\.com\/player\.php\/sid\/([^\/]+)\/v\.swf/i
  // ]);

  // 酷6视频
  // var ku6 = new videoSite("ku6", "酷6", "http://www.ku6.com/", [
  //   /^http:\/\/v\.ku6\.com\/show\/(.+)\.html/
  // ], function (id, callback) {
  //   var jsonpCallback = "jQuery" + Math.random().toString(16).slice(2);
  //   window[jsonpCallback] = function (ret) {
  //     delete window[jsonpCallback];
  //     if (!ret || !ret.data) {
  //       callback();
  //       return;
  //     }
  //     var data = ret.data;
  //     // 回调
  //     callback({
  //       // mp4: data.f.split(",")[0],
  //       mp4: "http://v.ku6.com/fetchwebm/" + id + ".m3u8",
  //       m3u8: "http://v.ku6.com/fetchwebm/" + id + ".m3u8",
  //       pic: data.bigpicpath || data.picpath,
  //       desc: data.desc || data.t
  //     });
  //   };
  //   // 远程调用接口获取
  //   getScript('//v.ku6.com/fetch.htm?t=getVideo4Player&vid=' + id + '&stype=mp4&cb=' + jsonpCallback);
  // });

  // 返回视频站点列表
  var vs = [v163];
  vs.getVideoSrcByUrl = function (url, callback) {
    var hit = false;
    var n = vs.length;
    var i = 0;
    var obj;
    for (; i < n; i++) {
      obj = vs[i];
      if (obj.isMySiteUrl(url)) {
        hit = true;
        obj.checkSource(url, function (res) {
          if (res && res.src) {
            callback(res);
          } else {
            callback();
          }
        });
      }
    }
    if (!hit) {
      callback();
    }
  };
  vs.getVideoSrcById = function (site, id, callback) {
    var hit = false;
    var n = vs.length;
    var i = 0;
    var obj;
    for (; i < n; i++) {
      obj = vs[i];
      if (obj.id === site) {
        hit = true;
        obj.checkSourceById(id, function (res) {
          if (res && res.src) {
            callback(res);
          } else {
            callback();
          }
        });
      }
    }
    if (!hit) {
      callback();
    }
  };
  return vs;
});
