/*
 * Dialog组件
 * 2015-06-08 马超 精简于组件库中zepto版本的对话框组件，去掉了iframe等无用的模式
 */
(function (window, Class, $, undefined) {
  var dialogCache = {}, // 全局缓存所有dialog对象
    noop = function () {},
    guid = 0, // 全局唯一id
    zIndex = {
      mod: 10000,
      unMod: 1000 // 每个dialog的zindex
    },
    dialogOptions = {
      title: null,
      content: "",
      type: "html",
      width: "22.91rem",
      height: "",
      button: ["确定"],
      css: "",
      cssObj: {},
      method: "append",
      position: "c",
      layout: true,
      animate: 0,
      timeout: 0,
      init: noop,
      check: noop,
      beforeClose: noop
    },
    PNum = 0, // 当前模式对话框的个数
    // 准备dialog的html
    prepareHTML = function () {
      var id = this.id,
        regf = /^\*/,
        s = "",
        op = this.options,
        dom, zindex = zIndex[op.layout ? "mod" : "unMod"]++,
        // 包装元素
        wrapHead = '<div class="iDialogContent">',
        wrapFoot = '</div>',
        // 标题
        head = (op.title === s || op.title === null) ? s : '<div class="iDialogHead"><h1>' + op.title + '</h1></div>',
        // 关闭链接---不要关闭按钮，需要请自己添加
        xlink = op.title === null ? s : '<a class="iDialogClose" href="#">＋</a>',
        // 按钮
        button = op.button.length === 0 ? s : (function () {
          var html = ['<div class="iDialogFoot">'],
            button = op.button,
            n = button.length,
            i = 0;
          for (i = n - 1; i >= 0; i--)
            {html.push('<a href="#" rel="' + (n > 1 ? n - i - 1 : 1) + '" class="iDialogBtn"><span>' + button[i] + '</span></a>');}
          html[n + 1] = "</div>";
          return html.join(s);
        })(),
        // 构造HTML
        html = ['<div class="iDialog', head ? "" : " iDialogNoTitle", '" style="visibility:hidden;z-index:', zindex, '" id="', id, '">',
          wrapHead, head, xlink,
          '<div class="iDialogBody"><div class="iDialogMain"></div></div>',
          button, wrapFoot,
          '</div>'
        ].join(s);
      // 插入页面，并返回ID
      dom = $(html).addClass(op.css);
      $.extend(this.cache, {
        dialogDom: dom,
        zindex: zindex,
        content: $(".iDialogContent", dom),
        main: $(".iDialogMain", dom),
        closeBtn: $(".iDialogClose", dom),
        title: $(".iDialogHead", dom)
      });
      $(document.body)[op.method](dom);
      return id;
    },
    // 准备遮罩代码
    prepareMask = function () {
      var op = this.options,
        layout = op.layout,
        zindex = this.cache.zindex - 1;
      if (!layout) return;
      var body = document.body,
        win = $(window),
        // layout
        layoutDom = $("<div class='iDialogLayout'></div>").appendTo(body).css("zIndex", zindex),
        // 定位类型
        position = layoutDom.css("position").toLowerCase() === "absolute";
      // 如果是绝对定位的时候---怕fixed有兼容性问题，这里处理下absolute的情况
      if (position) {
        layoutDom.css({
          height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
        });
      }
      // 2015-11-10 马超 增加body的溢出隐藏
      window.setTimeout(function () {
        body._overflow = body._overflow === undefined ? body.style.overflow : body._overflow;
        body.style.overflow = "hidden";
      }, 200);
      // 调整半透/透明样式
      if (!layout || PNum > 0) {
        layoutDom.addClass("iOpacityZero");
      }
      if (layout)
        {PNum++;}
      // 返回
      this.cache.layoutDom = layoutDom;
      return layoutDom;
    },
    // 准备事件
    prepareEvent = function () {
      var dom = this.cache.dialogDom,
        op = this.options,
        com = this;
      if (op.check) {
        com.bind('onBtnClick', function (id, $btn) {
          return op.check.call(dom[0], id, $btn[0], com);
        });
      }
      // 绑定事件
      $(".iDialogBtn", dom).click(function (e) {
        var id = parseInt($(this).attr("rel") || "-1", 10);
        val = com.trigger('onBtnClick', id, $(this), com);
        val = val === undefined ? id : val;
        // 判断脚本函数返回值
        if (val !== false) {
          op.returnValue = val;
          com.close();
        }
        e.preventDefault();
      });
      // 关闭按钮不提供，但是事件还是绑定了吧
      $(".iDialogClose", dom).click(function () {
        com.close();
        return false;
      });
      // 检查是否定时关闭
      op.timeout && window.setTimeout(function () {
        com.close();
      }, op.timeout);
    },
    // 初始化整个dialog
    prepareDialog = function () {
      var com = this,
        dom, op = this.options,
        dialogID = this.id,
        cache = this.cache,
        main;
      // 数据加载完毕后的处理逻辑
      var init = function () {
          // 其他初始化
          op.init.call(dom[0], com);
          setTimeout(function () {
            com.trigger("onCreate", com);
          }, 20);
        },
        setPos = function () {
          // 如果有键盘在，需要多加延时---原因，某些讨厌的浏览器如UC，在点页面的刷新，或者在键盘弹出的情况下点击一个元素弹出弹窗，这个时候计算位置会有问题
          // 在iphone下有键盘弹出，和键盘收起的时候并不能触发reszie事件，通过这个设置
          // 在android的某些浏览器通过这个设置，某些浏览器的 activeElemt取不对，通过 resize事件设置
          if (document.activeElement && /input|textarea|select/i.test(document.activeElement.tagName)) {
            // 在iPhone 6.1下，如果弹窗大小超过屏幕大小，这个时候因为有滚动条，而input输入内容的时候会触发resize，每输入一次触发一次，这个时候会有问题
            // 如果获得焦点的元素是弹窗内部的元素就不执行重新定位弹窗位置，只有外部input会影响弹窗的定位
            if ($(document.activeElement).closest(dom[0]).length) {
              return;
            }
            document.body.scrollLeft = 0;
            // 强制让页面元素失去焦点------某些浏览器下，resize被调用，强制失去焦点，会有问题
            // document.activeElement.blur();
            window.setTimeout(function () {
              // 有键盘的情况下延迟200毫秒
              calPosition.call(com, dom);
              // 显示窗口
              dom.css("visibility", "visible");
            }, 200);
          } else {
            calPosition.call(com, dom);
            dom.css("visibility", "visible");
          }
        };
      // 当前对话框的私有方法，setPos，这个方法是重新定位对话框位置的
      this.__setPos = setPos;
      // 准备dialogHTML
      prepareHTML.call(this);
      // 准备遮罩
      prepareMask.call(this);
      dom = cache.dialogDom;
      main = cache.main;
      // 设定默认返回值
      op.returnValue = null;
      // 处理宽度
      setWidth.call(this);
      // 处理高度
      setHeight.call(this);
      // 插入内容
      switch (op.type) {
        case "html":
        case "text":
          main[op.type](op.content);
          init();
          break;
        case "shell":
          // 直接覆盖指定内容
          dom.html(op.content);
          init();
          break;
        case "insert": // 将content指定的Dom（或seletor）作为内容插入到对话框内容区域（对话框仍包含外层容器）
        case "agent": // 将content指定的Dom（或seletor）作为整个对话框的内容（仅保留最外层Div容器）
          // 移动dom节点前，先在原始位置做标记，以备用完之后放回原处
          // 并保存缓存，以备关闭时恢复
          cache.orgDom = markDom(op.content);
          if (cache.orgDom) {
            cache.orgDomDisplay = cache.orgDom.css("display");
            // 插入dom
            (op.type == "insert" ? main : dom).html(cache.orgDom.show());
            init();
          } else {
            delete cache.orgDom;
            main.html("没有找到页面内容（" + op.content + "）请检查！");
            init();
          }
          break;
      }
      prepareEvent.call(this);
      // 更新dom引用
      this.wrap = dom;
      this.button = $(".iDialogBtn", dom);
      // 定位对话框
      $(window).on('ortchange', setPos).on('resize', setPos); // resize加重新定位是否安全？
      setPos();
      dom.css(op.cssObj);
      animate(dom, 1, op.animate, function () {
        setTimeout(function () {
          com.trigger("onShow", com);
        }, 20);
      });
    },
    setWidth = function (w) {
      var op = this.options,
        $dom = this.cache.dialogDom;
      w = w || op.width;
      w && $dom.width(w);
      if (w === 0) {
        $dom.addClass('iDialogAutoWidth');
      }
    },
    setHeight = function (h) {
      var op = this.options,
        $dom = this.cache.dialogDom,
        $main, bodyFont;
      var rem = /(rem)$/,
        px = /(px)$/;
      $main = $(".iDialogMain", $dom);
      h = h || op.height;
      // 如果h是个字符串
      if (h && typeof h === 'string') {
        // 如果以rem为单位
        if (rem.test(h)) {
          // 将rem逆转为px
          bodyFont = Number($('body').css('font-size').replace('px', ""));
          if (bodyFont) {
            h = Number(h.replace('rem', ""));
            h = h * bodyFont;
          }
          // 如果以px为单位
        } else if (px.test(h)) {
          h = Number(h.replace('px', ""));
        }
      }
      // 处理高度，如果设置高度小于现有高度，则不处理
      $main.css('height', 'auto');
      if (h) {
        mainH = $main.height() + h - $dom.height();
        mainH > 0 && $main.height(mainH);
      }
    },
    // 计算dialog位置
    calPosition = function (dom) {
      var op = this.options,
        p = op.position,
        width = dom.width(),
        height = dom.height(),
        position = {},
        win = $(window),
        winSize = [win.width(), win.height()],
        top, left,
        isAbsolute = dom.css('position').toLowerCase() == "absolute";
      if (dom.outerWidth) {
        width = dom.outerWidth();
        height = dom.outerHeight();
      }
      top = "50%";
      left = "50%";
      if (isAbsolute) {
        top = win.scrollTop();
      }
      position.marginLeft = "-" + width / 2 + "px";
      position.marginTop = "-" + height / 2 + "px";
      if (p == 't') {
        if (isAbsolute) {
          top += winSize[1] / 10;
        } else {
          top = "10%";
        }
        position.marginTop = "0px";
      } else if (p == 'b') {
        if (isAbsolute) {
          top += (winSize[1] / 10) * 9 - height;
        } else {
          top = "auto";
          position.bottom = "10%";
        }
        position.marginTop = "0px";
      } else if ($.isPlainObject(p)) {
        if (p.left) {
          left = p.left;
        }
        if (p.top) {
          top = p.top;
        }
      } else {
        // 如果是绝对定位，则加上scrollTop
        if (isAbsolute) {
          top += winSize[1] / 2;
        }
      }
      position.top = top;
      position.left = left;
      dom.css(position);
      // 返回
      return position;
    },
    /*
     * 动画特效管理
     * act 动画时机：1显示 2隐藏
     * type 0无动画 1淡入淡出 2滑入滑出 3缩小淡入放大淡出(css3)	4旋转(Y)入旋转(Y)出(css3) 5旋转(XY)放大入旋转(XY)缩小出
     */
    animate = function (dom, act, type, callback) {
      var css, core = ["iDialogShowAniCore", "iDialogHideAniCore"][act - 1],
        pos, fn = callback || noop,
        height, temp;
      // 如果没有动画
      if (!type) {
        fn.call(dom[0]);
        return;
      }
      // 否则显示CSS3动画特效
      css = "iDialogAnimate" + type;
      // 如果是动画2
      if (type == 2) {
        height = dom.height();
        temp = dom[0].style.height;
        if (act == 1) {
          dom.css('height', 0).animate({
            height: height
          }, 200, 'linear');
          window.setTimeout(function () {
            dom[0].style.height = temp;
          }, 225);
        } else {
          dom.height(height);
          dom.animate({
            height: 0
          }, 200, 'linear');
          window.setTimeout(function () {
            dom[0].style.height = temp;
            fn.call(dom.hide()[0]);
          }, 225);
        }
        return;
      }
      if (act == 1) { // 显示动画
        dom.addClass(css);
        window.setTimeout(function () {
          dom.addClass(core);
          dom.removeClass(css);
          window.setTimeout(function () {
            dom.removeClass(core);
          }, 310);
        }, 10);
      } else { // 关闭动画
        dom.addClass(core);
        window.setTimeout(function () {
          dom.addClass(css);
          window.setTimeout(function () {
            fn.call(dom.hide()[0]);
          }, 325);
        }, 1);
      }
    },
    // 给dom代理位置打标记
    markDom = function (dom) {
      var obj = $(dom).eq(0),
        id = "posMark" + (Number(new Date()));
      if (!obj[0]) return null;
      if (!obj[0].orgPosMarkId) {
        obj.after("<div style='display:none' id='" + id + "'/>");
        obj[0].orgPosMarkId = id;
      }
      return obj;
    },
    // 销毁dialog
    destroyAll = function () {
      for (var key in dialogCache) {
        dialogCache[key].destroy();
      }
      return this;
    },
    Dialog = {
      init: function (options, callback) {
        this.callSuper("onCreate onShow onBeforeClose onClose onBtnClick onDestroy");
        this.options = $.extend({}, dialogOptions, options);
        this.options.callback = $.isFunction(callback) ? callback : noop;
        this.cache = {};
        this.id = 'iDialog' + guid;
        guid = guid + 1;
        prepareDialog.call(this);
        dialogCache[this.id] = this;
        // 初始化完成将在不能调用init方法
        this.init = noop;
        // 磨砂式的弹窗
      },
      destroy: function () {
        if (this.id) {
          var com = this,
            op = this.options,
            temp, cb = op.callback,
            cache = this.cache,
            rv = op.returnValue,
            orgDom = cache.orgDom,
            orgDomDisplay = cache.orgDomDisplay;
          if (
            (op.beforeClose && op.beforeClose(rv) === false) || com.trigger('onBeforeClose', rv) === false
          ) {
            return this;
          }
          // 如果是模式对话框，模式对话框统计数目减一
          if (op.layout) {
            PNum--;
          }
          if (PNum === 0) {
            // 2015-11-10 马超 增加body的溢出隐藏
            var body = document.body;
            if (body._overflow !== undefined) {
              body.style.overflow = body._overflow;
              delete body._overflow;
            }
          }
          $(window).off('ortchange', this.__setPos).off('resize', this.__setPos); // resize加重新定位是否安全？
          // 有蒙层则移除蒙层
          cache.layoutDom && cache.layoutDom.remove();
          // 直接删除，防止事件内存泄漏
          animate(cache.dialogDom, 2, op.animate, function () {
            com.trigger("onClose", rv);
            // 如果是借用dom，则需要还原到原处
            if (orgDom && orgDom[0].orgPosMarkId) {
              $("#" + orgDom[0].orgPosMarkId).before(orgDom.css("display", orgDomDisplay));
            }
            cache.dialogDom.remove();
            // 需要等到对话框全部清理之后才调用回调
            try {
              cb(rv);
              com.trigger("onDestroy", rv);
            } catch (e) {
              // 如果进入到这个流程，那就是callback代码存在的环境已经关闭
              // 导致 不能执行已经释放的JScript代码
              com.warn(e);
            }
            orgDom = cb = rv = null;
          });
          this.config = null;
          this.cache = null;
          this.id = null;
          dialogCache[this.id] = null;
          delete dialogCache[this.id];
        }
        return this;
      },
      // 同destroy
      close: function () {
        this.destroy();
        return this;
      },
      // 重新定位
      position: function (poc) {
        if (poc) {
          this.options.position = poc;
        }
        this.__setPos();
        return this;
      },
      // 获取宽度或者重置宽度
      width: function (w) {
        if (w === undefined) {
          return this.wrap.width();
        }
        setWidth.call(this, w);
        return this;
      },
      // 获取整个高度 或者 重置内容区高度
      height: function (h) {
        if (h === undefined) {
          return this.wrap.height();
        }
        setHeight.call(this, h);
        return this;
      },
      // 获取标题 或者 修改标题
      title: function (title) {
        // 返回标题
        if (title === undefined) {
          return this.options.title;
        }
        // 重置标题
        if (title === true) {
          title = this.options.title;
        }
        var cache = this.cache,
          notitle = "iDialogNoTitle";
        // 如果dom节点尚且存在，则修改
        if (cache.title && cache.title[0]) {
          if (title === "" || title === null) {
            cache.title.addClass("hide");
            cache.closeBtn[title === null ? "addClass" : "removeClass"]("hide");
            this.wrap.addClass(notitle);
          } else {
            cache.title.removeClass("hide").find("h1").html(title);
            cache.closeBtn.removeClass("hide");
            this.wrap.removeClass(notitle);
          }
        }
        // 存入缓存
        this.options.title = title;
        return this;
      },
      toString: function () {
        return this.id;
      }
    };
  // 扩展销毁所有对话框方法
  Dialog.destroyAll = destroyAll;
  Class.Base.Event.extend("Widgets.Dialog", Dialog);
  // 向Dialog写一个方法销毁所有的对话框
  Class.Widgets.Dialog.destroyAll = destroyAll;

  Class.Widgets.Dialog.alert = function (txt, btn, callback) {
    if ($.isFunction(btn)) {
      callback = btn;
      btn = null;
    }
    if (!btn || !btn.length) {
      btn = null;
    }
    return Class.Widgets.Dialog.create({
      title: null,
      css: "iDialogAlert",
      content: txt,
      button: btn || ["确定"]
    }, callback);
  };
  Class.Widgets.Dialog.confirm = function (txt, btn, callback) {
    if ($.isFunction(btn)) {
      callback = btn;
      btn = null;
    }
    if (!btn || !btn.length) {
      btn = null;
    }
    return Class.Widgets.Dialog.create({
      title: null,
      css: "iDialogConfirm",
      content: txt,
      button: btn || ["确定", "取消"]
    }, callback);
  };
  Class.Widgets.Dialog.toast = function (txt, timeout, callback) {
    if ($.isFunction(timeout)) {
      callback = timeout;
      timeout = null;
    }
    return Class.Widgets.Dialog.create({
      title: null,
      css: "iDialogInfo",
      animate: 1,
      content: txt,
      timeout: Number(timeout) || 2000,
      button: []
    }, callback);
  };
  // 对外放出接口
  (function ($, $$) {
    var dialogIDReg = /^iDialog\d+$/;
    $.dialog = $$.dialog = function (options, callback) {
      // 不传递任何参数，则关闭所有dialog对话框
      if (options === undefined) {
        destroyAll();
        return;
      }
      if (options instanceof Class.Widgets.Dialog && options.destroy) {
        options.destroy();
        return;
      }
      if (typeof options === "string") {
        // 如果将dialog的ID传递过来则关闭指定对话框
        if (dialogIDReg.test(options)) {
          // 如果有第二个参数，则设置为返回值
          if (dialogCache[options]) {
            if (callback) {
              dialogCache[options].returnValue = callback;
            }
            dialogCache[options].destroy();
            return;
          }
          // 否则就当作content内容处理
        } else {
          options = {
            content: options
          };
        }
      } else if ($.isFunction(options)) { // 如果仅仅传递一个函数，则当作回调处理，此条逻辑很奇怪，哈
        callback = options;
        options = {};
      }
      // 否则就创建一个新的对话框，并返回对话框ID
      return Class.Widgets.Dialog.create(options, callback);
    };
    $.alert = $$.alert = Class.Widgets.Dialog.alert;
    $.confirm = $$.confirm = Class.Widgets.Dialog.confirm;
    $.toast = $$.toast = Class.Widgets.Dialog.toast;
  })(window.jQuery || window.Zepto, window.Zepto || {});
})(window, window.Class, window.jQuery || window.Zepto);
