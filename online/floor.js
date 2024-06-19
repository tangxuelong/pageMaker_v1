/**
 * 分组标题js
 */
(function ($) {
  $(function () {
    // 楼层跳转
    $(document.body)
      .delegate(".floorBase p a", "click", function (e) {
        var id = this.href.split("#")[1];
        $(this).closest(".floorBase").removeClass("open");
        if (window.scrollHelper) {
          id && window.scrollHelper.scrollToItem(document.getElementById(id), window.isPreview ? 0 : -$(this).closest(".floorBase").height());
          e.preventDefault();
        }
      })
      // 展开菜单
      .delegate(".floorBase .handler", "click", function (e) {
        $(this).closest(".floorBase").toggleClass("open");
        e.preventDefault();
      });
    // 获取所有的楼层组件外容器
    var AllFloorBase = $(".floorBase");
    // 判断是否需要显示handler
    var checkHandler = function () {
      AllFloorBase.each(function () {
        var floorBase = $(this);
        var content = floorBase.find("p");
        floorBase.removeClass("showHandler");
        if (content[0] && content[0].scrollWidth > content.width()) {
          floorBase.addClass("showHandler");
        }
      });
    };

    // 查找楼层信息和控制关系
    var guid = 1;
    var floorCache = {};
    AllFloorBase.each(function () { // 查找每个分组标题的控制范围
      var all = [];
      var base = $(this);
      var baseContent = base.find("p");
      var next = base.next();
      var myGUID = guid++;
      var subGuid = 1;
      var myCache = floorCache["floor" + myGUID] = {
        base: base,
        floors: []
      };
      while (next[0] && !next.hasClass("floorEnd") && !next.hasClass("floorBase")) {
        if (next.hasClass("floorHook")) {
          // 保存dom缓存
          myCache.floors.push(next);
          // 设置id关联
          var myid = "floor" + myGUID + "-" + subGuid;
          next.attr("id", myid);
          // 插入定位点击元素
          baseContent.append('<a href="#' + myid + '">' + next.html() + '</a>');
          subGuid++;
        }
        all.push(next);
        next = next.next();
      }
      // 没有控制子元素
      if (subGuid === 1) {
        baseContent.append('<a href="#">空即是色，色即是空。</a>');
      }
      // 预览状态下不处理sticky效果
      if (all.length && !window.isPreview && $.fn.stick_in_parent) {
        var newBox = base.wrap("<section style='overflow:auto'>").parent();
        $.each(all, function (i, obj) {
          var tag = obj[0].tagName.toLowerCase();
          if (tag !== "style" && tag !== "script") {
            newBox.append(obj);
          }
        });
        base.stick_in_parent();
      }
    });

    window.isPreview
      // 如果是预览状态，需要修复因为iscroll导致的滚动问题
      ? AllFloorBase.find("p").bind("mousewheel", function (e) {
        if (e.deltaX !== 0) {
          var floorBase = $(this).closest(".floorBase");
          if (floorBase.hasClass("showHandler") && !floorBase.hasClass("open")) {
            e.stopPropagation();
          }
        }
      })
      // 在线需要修复zepto的点击bug
      : $(document.body).delegate(".floorBase", "touchend", function (e) {
        e.stopPropagation();
      });

    // 动态处理展开handler
    checkHandler();
    window.isPreview || $(window).resize(checkHandler);

    // 滚动定位标记
    var checkOneFloorBase = function (cache) {
      var currentTop = window.scrollHelper.getScrollY();
      var floorBase = cache.base;
      var baseHeight = floorBase.height();
      // 查找需要active的元素
      var activeHook = null;
      var posInfo = [];
      $.each(cache.floors, function (i, hook) {
        posInfo.push(parseInt(hook.offset().top - baseHeight));
      });
      if (currentTop >= posInfo[0]) {
        activeHook = posInfo.length - 1;
        for (var i = 0, N = posInfo.length - 1; i < N; i++) {
          if (posInfo[i] <= currentTop && currentTop < posInfo[i + 1]) {
            activeHook = i;
          }
        }
      }
      floorBase.find(".active").removeClass("active");
      if (activeHook !== null) {
        var target = floorBase.find("p a").eq(activeHook).addClass("active");
        // 计算要滚动到的位置
        var target2 = activeHook > 0 ? target.prev() : target;
        var wrap = target.parent()[0];
        // 滚动到位置
        window.scrollHelper.scrollCore(wrap.scrollLeft, target2[0].offsetLeft, function (value) {
          wrap.scrollLeft = value;
        });
      }
    }
    var checkActiveHook = function () {
      for (var baseKey in floorCache) {
        checkOneFloorBase(floorCache[baseKey]);
      }
    }
    // 监听页面滚动和窗口变化
    function hookAgent() {
      if (hookAgent.t) {
        window.clearTimeout(hookAgent.t);
      }
      hookAgent.t = window.setTimeout(checkActiveHook, 30);
    }
    if (!window.isPreview) {
      // 实时监控页面滚动和尺寸变化
      $(window).resize(hookAgent);
      window.scrollHelper.bindScroll(hookAgent);
      hookAgent();
    } else {
      // 如果是预览状态，则直接选中第一个，不再跟随变化
      AllFloorBase.find("p a:first-child").addClass("active")
    }
  });
})(window.Zepto || window.jQuery);
