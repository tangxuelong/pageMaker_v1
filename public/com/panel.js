/**
 * pageMaker配置区域通用类
 */
define([
  "jquery", "Class", "com/panel.2html", "com/set", "LS",
  "bootstrap", "drag", "drop", "dialog",
  "com/upload", "com/video", "liveCheck",
  "/widgets/dropMenu/index.js",
  "/widgets/datetimepicker/js/bootstrap-datetimepicker.min.js"
], function ($, Class, JSON2HTML, SET, LS) {
  // 调整input的val方法通知
  var jQuyerOrgValFn = $.fn.val;
  $.fn.val = function (value) {
    var me = this;
    value !== undefined && window.setTimeout(function () {
      me.trigger("input");
    }, 0);
    return jQuyerOrgValFn.apply(this, arguments);
  };
  // 每次刷新页面就随机选一种loading方式
  var loadStyle = Math.random() > 0.5 ? 2 : 1;

  // 全局变量
  var GUID = 1;
  var CACHE = {};
  var panelMsg = Class.Base.Message.create();
  var Conf = SET.get();

  // 配置面板私有方法
  var _Panel = {
    // 绑定类型控制开关
    bindTypeSwitch: function (options) {
      var layout = {};
      var ops = options === true ? {} : (options || {});
      var wrap = this.wrap;
      var changeTo = function (key) {
        $.each(layout, function (key, dom) {
          dom.addClass("hide");
        });
        layout[key].removeClass("hide");
      };
      $(ops.typeSelector || "[name*=type]", wrap).click(function () {
        changeTo(this.value);
      }).each(function () {
        var key = this.value;
        var css = ops.prefixCss || "layoutFor";
        layout[key] = wrap.find("." + css + key);
      }).each(function () {
        this.checked && changeTo(this.value);
      });
    },
    checkEvent: function () {
      // 文件上传需要优先处理，否则initEvent中隐藏了部分元素，会导致初始化失败
      _Panel.bindFileUpload.call(this);
      // 自定义的初始化处理
      if (this.initEvent) {
        this.initEvent();
      }
      // 如果设置了类型开关
      if (this.typeSwitch) {
        _Panel.bindTypeSwitch.call(this, this.typeSwitch);
      }
      // 分组配置控制初始化
      if (this.wrap.find(".group_first")[0]) {
        this.initGroupCache();
        var com = this;
        this.wrap.delegate("a[href*=#group-]", "click", function () {
          com.groupAction(this.hash.replace(/#group-/i, ""), this);
          return false;
        });
      }
      var wrap = this.wrap;
      // 颜色选择器
      switch (Conf.colorPicker) {
        case "1": // 基础版
          require(["color", "/widgets/color/picker2.js"], function () {
            $("input.color", wrap).colorPicker()
          });
          break;
        case "2": // 高级版
          require(["/widgets/color/picker.js", "color"], function () {
            $("input.color", wrap).ColorPicker({
              onSubmit: function (hsb, hex, rgb, el, parent) {
                $(el).val("#" + hex);
                $(el).trigger('input');
                $(el).ColorPickerHide();
              },
              onBeforeShow: function () {
                $(this).ColorPickerSetColor($.getColor(this.value));
              }
            }).bind("input", function () {
              var color = $.getColor(this.value);
              this.style.backgroundColor = color;
              this.style.color = $.contrastColor(color);
              $(this).ColorPickerSetColor(color);
            }).trigger("input");
          });
          break;
      }
      // 全局初始化
      _Panel.commonInit.call(this);
      // 删除按钮
      this.wrap.find(".conf-group-ctrl .del-panel").popover({
        title: "删除该配置？",
        placement: "top",
        content: ['<div class="del-confirm-box">',
          '<button class="btn btn-alert btn-sm">取消</button>',
          '<button class="btn btn-danger btn-sm btn-del">删除</button>',
          '</div>'
        ].join(""),
        html: true
      });
      // 拖动排序
      _Panel.bindDrag.call(this);
    },
    // 绑定拖动排序
    bindDrag: function () {
      var wrap = this.wrap;
      var box = this.__fatherBoxNode;
      if (wrap[0].id === "pageMetaInfo") {
        return;
      }
      wrap.dragDrop({
        box: box,
        items: function () {
          return box.find(".panel:not(#pageMetaInfo)");
        },
        hook: ".move-panel",
        beforeDrag: function () {
          wrap.find(".del-panel").popover("hide");
        },
        dragEnd: function () {
          // 发送消息
          panelMsg.sendMsg("panel.create");
        }
      });
    },
    bindFileUpload: function () {
      this.wrap.find(".fileUploadWrap i").each(function () {
        var size = $(this).data("size");
        $(this).bindUpload($(this).data("type").split(","), size, function (url) {
          $(this).parent().find(">input").val(url);
        }, function (act) {
          $(this)[act === 1 ? "addClass" : "removeClass"]("uploading" + loadStyle);
        });
      });
    },
    commonInit: function () {
      function toggPanel(e) {
        // 点住标题，则不处理
        if ($(e.target).closest(".conf-group-name")[0]) {
          return;
        }
        // 如果是双击，则阻止在其他元素上的监听
        if (e.type === "dblclick" && e.target.className.indexOf("panel-heading") < 0) {
          return;
        }
        var myself = $(this).closest(".panel").attr("id");
        // 切换展开和收起状态
        CACHE[myself] && CACHE[myself].toggle();
      }
      this.__fatherBoxNode
        .delegate('.panel-heading', 'dblclick', toggPanel)
        .delegate(".conf-group-togg", "click", toggPanel)
        .delegate('[contenteditable]', 'focusout', function (event) {
          var me = $(this);
          var noTitle = ["未名", "空即色", "无题", "色即空", "空空如也", "标题^_^", "无为"];
          if (!$.trim(me.text()).length) {
            me.text(noTitle[parseInt(noTitle.length * Math.random())]);
          }
        })
        .delegate(".conf-group-ctrl .del-panel", "focusout", function () {
          var link = $(this);
          window.setTimeout(function () {
            link.popover("hide");
          }, 200);
        })
        .delegate('.conf-group-ctrl .btn-del', 'click', function (event) {
          var obj = CACHE[$(this).closest(".panel").attr("id")];
          obj && obj.del && obj.del();
        })
        .delegate(".panel-heading", "mouseleave", function () {
          $(this).find(".del-panel").popover("hide");
        })
        // 设置和重置默认值
        .delegate(".conf-group-ctrl .deft-panel", "click", function () {
          if (this.__waitReset) {
            delete this.__waitReset;
            return;
          }
          window.clearTimeout(this.__resetTimer);
          var obj = CACHE[$(this).closest(".panel").attr("id")];
          obj && obj.setDefault && obj.setDefault();
        })
        .delegate(".conf-group-ctrl .deft-panel", "mousedown", function () {
          var obj = CACHE[$(this).closest(".panel").attr("id")];
          var me = this;
          this.__resetTimer = window.setTimeout(function () {
            me.__waitReset = true;
            obj && obj.clearDefault && obj.clearDefault();
          }, 1000);
        })
        // 复制并插入到后面
        .delegate(".conf-group-ctrl .copy-panel", "click", function () {
          var obj = CACHE[$(this).closest(".panel").attr("id")];
          obj && obj.copy();
        });
      // 帮助和demo
      $(document).delegate('.demo,.help', 'click', function (e) {
        var info = $(this).data("info");
        var input = $(this).parent().prev();
        var type = $(this).hasClass("demo") ? 1 : 2;
        if (input[0]) {
          if (input.val() || type === 2) {
            $.dialog({
              title: ["输入示例", "使用说明"][type - 1],
              content: "<div id='infoBox' style='max-width:560px'></div>",
              button: ["*知道了"]
            }).onCreate(function () {
              $("#infoBox").text(info);
              this.position(true);
            });
          } else {
            input.val(info);
          }
        }
        e.preventDefault();
      });
      // 数字实时校验
      $(document).bindNumberLiveCheck2(".percent,.number");
      // 仅仅执行一次
      _Panel.commonInit = $.noop;
    }
  };

  // 配置面板组件
  Class.extend("Page.Panel", {
    init: function (options) {
      var ops = options || {};

      // 如果没有设置name和NAME，则报错
      if (!this.name || !this.NAME) {
        console.log("Error:组件缺少中英文名字。");
        return;
      }

      // 如果提供了id，则标示这个组件是只能实例化一次
      this.onlyOne = Boolean(ops.id);
      if (ops.id && CACHE[ops.id]) {
        $.dialog.toast("《" + this.NAME + "》组件只能添加一次！");
        return;
      }

      // 外容器
      ops.wrap = ops.wrap || "#pageConfBox";
      this.__fatherBoxNode = $.isFunction(ops.wrap) ? ops.wrap() : $(ops.wrap);
      // 英文名字
      ops.name = this.name;
      // 中文名字
      ops.NAME = this.NAME;
      // 如果是预览模块，修改中文名字以突出显示
      if (this.isPreviewItem) {
        ops.NAME += "(预览)";
      }
      // 唯一编号
      this.guid = ops.guid = GUID++;

      // 容器编号
      this.id = ops.id = (ops.id || (this.name + "__" + this.guid));
      // 检查容器
      if (!this.__fatherBoxNode[0]) {
        alert("外容器没有找到！无法创建" + ops.name + "(" + ops.NAME + ")面板");
        return;
      }
      // 删除同名对象
      if (CACHE[this.id] && ops.noCache !== true) {
        CACHE[this.id].del(true);
      }
      // 保存配置信息
      this.options = ops;
      // 插入到页面并初始化事件
      this.appendToPage();
      _Panel.checkEvent.call(this);

      // 加载默认值
      this.loadDefault();

      // 发送消息
      panelMsg.sendMsg("panel.create");
    },

    appendToPage: function () {
      var html = JSON2HTML(this.options, this.tmpl);
      // 先把已有的面板折叠起来
      if (SET.get("panelHide") || window.panelHide) {
        this.__fatherBoxNode.find(".panel").addClass("panel-mini");
      }
      // 再插入新的面板
      this.__fatherBoxNode.append(html);
      this.wrap = $("#" + this.id);
      this.body = this.wrap.find('.panel-body');
      if (this.onlyOne) {
        this.wrap.addClass("oneCopyPanel");
      }
      // 保存引用
      if (this.options.noCache !== true) {
        CACHE[this.id] = this;
      }
    },

    // 展开
    expand: function (scrollIntoView) {
      // 如果对象没有创建完毕（比如设置id的组件再次创建），则不处理
      if (!this.__fatherBoxNode) {
        return;
      }
      // 关闭同容器内其他元素
      if (SET.get("panelHide") || window.panelHide) {
        this.__fatherBoxNode.find(".panel").addClass("panel-mini");
      }
      // 展开自己
      this.wrap.removeClass("panel-mini");
      // 滚动定位
      scrollIntoView === true && $(window).scrollTop(this.wrap.offset().top - 60);
    },

    // 收起
    collapse: function () {
      this.wrap.addClass("panel-mini");
    },

    // 轮换
    toggle: function () {
      if (this.wrap.hasClass('panel-mini')) {
        this.expand();
      } else {
        this.collapse();
      }
    },

    // 绑定上传模块
    bindFileUpload: _Panel.bindFileUpload,

    // 保存当前值为默认值
    setDefault: function (defData, noTip) {
      LS.set("dft_" + this.name, JSON.stringify(defData || this.save()));
      if (noTip !== true) {
        $.dialog.toast("《" + this.NAME + "》默认值 保存 成功！");
      }
    },

    // 加载默认值
    loadDefault: function () {
      var deft = LS.get("dft_" + this.name);
      if (deft) {
        this.load(JSON.parse(deft));
      }
    },

    // 内容变化时主动通知
    iamChange: function () {
      panelMsg.sendMsg("panel.change");
    },

    // 重置默认值
    clearDefault: function () {
      LS.remove("dft_" + this.name);
      $.dialog.toast("《" + this.NAME + "》默认值 <b>重置</b> 成功！");
    },

    // 删除
    del: function (imme) {
      // 移除Dom
      if (imme === true) {
        this.wrap.remove();
        panelMsg.sendMsg("panel.remove");
      } else {
        this.wrap.fadeOut(function () {
          this.remove();
          panelMsg.sendMsg("panel.remove");
        });
      }
      // 从缓存中剔除
      if (CACHE[this.id]) {
        delete CACHE[this.id];
      }
    },

    // 配置导入和导出(默认的input回填)
    load: function (conf) {
      var wrap = this.wrap;
      var com = this;
      var findInput = function (name) {
        var input = wrap.find("[name=" + name + "]");
        if (!input[0]) { // 没有找到，则尝试找动态radio元素
          input = wrap.find("[name^='" + name + "__']");
        }
        return input;
      };
      $.each(conf, function (name, value) {
        var input = findInput(name);
        // 如果value是数组，则尝试调用com.add方法增加元素
        if ($.isArray(value) && input.length < value.length) {
          for (var ii = input.length; ii < value.length; ii++) {
            com.addGroup(name);
          }
          input = findInput(name);
        }
        if (input[0]) {
          if (input.is(":text") || input.is(":hidden") || input.is("[type=color]") || input.is("textarea")) {
            if ($.isArray(value) && value.length === input.length) {
              $.each(value, function (i, val) {
                input.eq(i).val(val);
              });
            } else {
              input.val(value);
            }
          } else if (input.is(":checkbox")) {
            if ($.isArray(value) && value.length === input.length) {
              $.each(value, function (i, val) {
                input[i].checked = Boolean(val);
              });
            } else {
              input[0].checked = Boolean(value);
            }
          } else if (input.is(":radio")) {
            if ($.isArray(value)) {
              // 先将radio分组
              var group = {};
              var index = 0;
              input.each(function () {
                var name = this.name;
                if (!group[name]) {
                  if (this.value === value[index]) {
                    index++;
                    group[name] = true;
                    this.checked = true;
                    $(this).trigger("click"); // 模拟点击
                  }
                }
              });
            } else {
              var k = input.filter("[value=" + (value ? $.safeRegStr(value) : '""') + "]");
              k[0] && (k[0].checked = true, k.trigger("click")); // 模拟点击
            }
          }
        }
        // 恢复NAME元素
        if (name === "NAME") {
          wrap.find(".conf-group-name").text(value);
        }
      });
    },

    save: function () {
      var data = {};
      this.wrap.find("input[name],textarea[name]").each(function () {
        var me = $(this);
        var name = this.name;
        var type = (this.type || "").toLowerCase();
        var val = me.is(":checkbox") ? this.checked : $.trim(this.value);
        // 没有name则跳过
        if (!name) {
          return;
        }
        // 特殊处理radio，未选中的radio直接忽略
        if (type === "radio") {
          if (!this.checked) {
            return;
          }
          // 修正name
          name = name.replace(/__[\d_]+$/, "");
        }
        // class中包含类型: text / image / color / percent / url
        if (data[name] !== undefined) { // 有同名key
          if ($.isArray(data[name])) {
            data[name].push(val);
          } else {
            data[name] = [data[name], val];
          }
        } else {
          data[name] = val;
        }
      });
      // 查找可编辑的NAME元素
      var NAME = this.wrap.find(".conf-group-name[contenteditable]");
      if (NAME[0]) {
        data.NAME = NAME.text();
      }
      return data;
    },

    // 复制一个面板
    copy: function () {
      var curData = this.save();
      // 创建副本
      var copy = Class.Page[this.name.toUpperCase()].create();
      if (!copy.onlyOne) {
        // 复制内容
        copy.load(curData);
        // 将副本移动到当前副本后面
        this.wrap.after(copy.wrap);
      }
    },

    // 通用报错提示
    // 用法：在get方法中 return this.error("错误描述");
    error: function (text) {
      if (text === null) {
        this.errorNum = 0;
      }
      if (!text) {
        return;
      }
      // 设置错误标记
      this.errorNum = this.errorNum ? this.errorNum + 1 : 1;
      return ['<div style="font-size:1.083rem;padding:2px;border:1px solid #d44950;border-width:1px 0;margin-bottom:-1px">',
        '<div style="background:#fcf8e3;padding:.5rem;color:#d44950">Error!! 组件《', this.NAME, '》报错！</div>',
        '<div style="padding:.5rem;background:#fff;">', text, '</div>',
        '</div>'
      ].join("");
    },

    // 获取分组配置缓存
    initGroupCache: function () {
      var box = this.wrap.find(".group_first");
      if (!box[0]) {
        return;
      }
      // 创建group容器
      box.before("<div class='groupWrap'><div class='groupBox'></div></div>");
      // 获得容器
      var gWrap = this.wrap.find(".groupWrap");
      var gBox = gWrap.find(".groupBox");
      gBox.append([
        '<div class="group-action-box form-control">',
        '<b class="group-title"></b>',
        '<a class="glyphicon glyphicon-arrow-up" title="置顶" href="#group-top"></a>',
        '<a class="glyphicon glyphicon-arrow-up" title="向上" href="#group-up"></a>',
        '<a class="glyphicon glyphicon-arrow-down" title="向下" href="#group-down"></a>',
        '<a class="glyphicon glyphicon-arrow-down" title="置底" href="#group-bottom"></a>',
        '<a class="glyphicon glyphicon-trash" title="删除" href="#group-remove"></a>',
        '</div>'
      ].join(""));
      // 2016-11-3 马超增加钩子以控制分组html的dom缓存
      if (this.checkGroupTmpl) {
        this.checkGroupTmpl(gBox);
      }
      // 移动初始化的dom进去
      var boxs = [box];
      while (!box.hasClass("group_last")) {
        box = box.next();
        boxs.push(box);
      }
      $.each(boxs, function (i, box) {
        gBox.append(box);
      });
      this.__groupWrap = gWrap;
      this.__groupBox = gBox.clone();
    },

    groupAction: function (act, item) {
      var g1, g2;
      switch (act) {
        case "add":
          this.addGroup();
          break;
        case "remove":
          this.removeGroup(item);
          break;
        case "up":
        case "top":
          g1 = $(item).closest(".groupBox");
          g2 = act === "up" ? g1.prev() : g1.parent().find(".groupBox:first");
          this.__moveGroupTo(g1, g2, true);
          break;
        case "down":
        case "bottom":
          g1 = $(item).closest(".groupBox");
          g2 = act === "down" ? g1.next() : g1.parent().find(".groupBox:last");
          this.__moveGroupTo(g1, g2, false);
          break;
      }
    },

    __moveGroupTo: function (group1, group2, dir) {
      if (this.__groupAnimateLock) {
        return;
      }
      this.__groupAnimateLock = true;
      var width, height;
      var aniTime = 400;
      var com = this;
      var holder1 = $("<div>").css({
        width: width = group1.width(),
        height: height = group1.outerHeight()
      });
      var holder2 = $("<div>").css({
        width: width,
        height: 0
      });
      // 计算group1的移动位置
      var wrapPos = this.__groupWrap.offset();
      var startPos = group1.offset().top - wrapPos.top;
      var endPos = group2.offset().top - wrapPos.top;

      // 插入占位元素
      group1.css({
        position: "absolute",
        "z-index": 100,
        top: startPos,
        width: width,
        transform: "scale(1.03)"
      }).before(holder1);
      group2[dir ? "before" : "after"](holder2);
      // 开始动画
      holder1.animate({
        height: 0
      }, aniTime, function () {
        holder1.remove();
      });
      holder2.animate({
        height: height
      }, aniTime, function () {
        holder2.remove();
      });
      group1.animate({
        top: endPos
      }, aniTime, function () {
        delete com.__groupAnimateLock;
        group1.removeAttr("style");
        group2[dir ? "before" : "after"](group1);
        // 通知
        panelMsg.sendMsg("panel.change");
      });
    },

    // 分组信息添加
    addGroup: function () {
      if (!this.__groupWrap || !this.__groupBox) {
        return;
      }

      // 最大数量限制
      var conf = this.groupConf || {};
      if (conf.max && this.__groupWrap.find(".groupBox").length >= conf.max) {
        $.dialog();
        $.dialog.alert(conf.alert || "一个分组内，元素不能超过" + conf.max + "个！");
        return;
      }

      // 插入dom副本
      var me = this;
      var box = $("<div class='groupBox'></div>");
      this.__radioGuid = this.__radioGuid || 1;
      this.__groupBox.children().each(function () {
        var clone = $(this).clone();
        var radios = clone.find(":radio");
        var guid = radios.length ? me.__radioGuid++ : 0;
        // 处理radio的name
        radios.each(function (index) {
          this.name = this.name + "__" + guid;
          if (index === 0) {
            this.checked = true;
          }
        });
        box.append(clone);
      });
      this.__groupWrap.append(box);

      // 处理文件上传
      this.bindFileUpload();

      // 2016-06-15 增加一个钩子函数
      if (this.afterAdd) {
        this.afterAdd(box);
      }
      // 通知
      panelMsg.sendMsg("panel.change");
    },

    // 分组信息删除
    removeGroup: function (item) {
      var box = $(item).closest(".groupBox");
      if (!box[0]) {
        return;
      }
      box.remove();
      // 通知
      panelMsg.sendMsg("panel.change");
    },

    // 遍历所有的分组
    eachGroup: function (fn) {
      this.__groupWrap.find(".groupBox").each(fn);
    },

    // 查询已有分组数量
    getGroupNum: function () {
      return this.__groupWrap.find(".groupBox").length;
    }
  });

  // 静态接口
  $.extend(Class.Page.Panel, {
    each: function (fn) {
      $.each(CACHE, fn);
    },
    get: function (id) {
      return CACHE[id];
    },
    msg: panelMsg
  });
  // 返回Panel类
  return Class.Page.Panel;
});
