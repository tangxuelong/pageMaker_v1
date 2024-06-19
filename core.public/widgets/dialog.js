/**
 * Dialog组件
 *
 * [Depend On]
 * jQuery 1.4.2 +
 * base.class.js(即Class模式，默认包含在easyCore.js中)
 * easyCore.js(弱依赖： $.fn.bindDrag 以及 $.fn.setControlEffect)
 *
 * [Change Log]
 * 2014-09-01 马超 基于第一版重新设计，相比旧版接口有以下重要变化
 *      > 默认返回的内容不再是一个字符串（对话框编号），而变成一个控制对象，其中该对象的toString方法返回原来的对话框编号
 *      > 取消 $.dialog.position / $.dialog.bindDrag / $.dialog._cache 方法
 *      > 删除 type=frame, type=ajax 类型（新控制对象可以方便实现类似功能）
 *      > 支持Event/Message通知，增加 onCreate/onShow/onBeforeClose/onClose/onDestroy 事件和 dialog.show/dialog.hide/dialog.change消息通知
 *      > 支持动态修改对话框内容/宽高/定位等
 *      > 宽度默认修改为自适应（有一个最小宽度值），并调整定位逻辑是尽量居中
 * 2014-12-19 马超 增加 layout:2 配置，强制设置半透蒙层
 *
 * [基本接口]
 * $.dialog( options_or_content [,callback] );
 * @return  返回对话框[控制对象]
 * 参数 options，见下[配置参数]
 * 参数 callback 为关闭对话框后的回调函数，接收一个参数表示对话框处理结果：
 *  > 用户点击关闭参数为 null
 *  > 点击对话框按钮则参数为 btnClick 方法返回值
 *  > 若 btnClick 方法无返回值（即undefined），则参数为按钮编号，编号规则见下[配置参数]描述
 *  > 回调函数的this对象为按钮dom
 * 
 * $.dialog( [dialogID_or_dialogClass_or_dialogCtrlObj] );
 * @return 无返回值
 * 关闭指定的对话框，若不传递参数则关闭所有已经打开的对话框，若传递的不是dialogID、dialogClass或dialogCtrlObj，则走打开对话框的逻辑（见上）
 *
 * [Class接口]
 * Class.Widgets.Dialog.create(options);
 * Class.Widgets.Dialog.destroyAll();
 * 
 * [包装接口]
 * $.dialog.confirm
 * $.dialog.alert
 * $.dialog.error
 * $.dialog.info
 * $.dialog.toast
 *
 * [控制对象]
 * 打开对话框返回的控制对象包括（如果不是第一次动态加载的话）：
 *      id : dialogId
 *      wrap : $dialogWrap
 *      button : $buttons
 *      close : function() 关闭对话框
 *      destroy : function() 等同于 close
 *      content : function(content [,contentType] [,ifResetPosition])
 *      position : function( [position] )  设置为 true 则按照之前的定位类型重新定位
 *      unbindDrag : function()
 *      bindDrag : function( [type] )
 *      height : function( [height] )
 *      width : function( [width] )
 *      title : function( [title] )
 *      //以下是 Event 接口，主要用于对话框打开后增加事件处理。使用方法示例：
 *      //ctrlObj.onBeforeClose(fn); 或 ctrlObj.bind("onClose", fn); 或 ctrlObj.bindOnce("onDestroy", fn); 或  ctrlObj.unbind("onBtnClick", fn);
 *      //推荐使用以下接口来挂接事件处理
 *      onCreate : function( ctrlObj )          //dom节点准备完毕，并准备开始css动画（如果设置了的话）
 *      onShow : function( ctrlObj )            //对话框显示动画结束，用户界面进入可用状态
 *      onBeforeClose : function( returnValue ) //准备关闭对话框，如果返回false，则阻止
 *      onClose : function( returnValue )       //关闭动画结束，界面已经不可见，但dom尚且存在
 *      onDestroy : function( returnValue )     //dom节点被移除，事件卸载完毕，相当于基本接口的 callback
 *      onBtnClick : function( btnId, $currentBtn ) //对话框按钮或关闭按钮被点击
 *      
 * [消息通知]
 * 当打开或关闭一个对话框时，将发送全局消息(Message)如下，使用方法示例：$.bindMsg("dialog.show", fn);
 *      dialog.show :   function( descOps )
 *      dialog.hide :   function( descOps )
 *      dialog.change : function( type, descOps )
 * 参数 type 表示类型：1 新增了对话框 0 关闭了对话框
 * 其中descOps为对话框描述统计数据，含有以下字段： dialogNum / layoutNum / opacityZeroLayout
 *
 * [配置参数]
    {
        title : null,       [可选][字符串|null] 对话框标题，若标题为空字符，则不显示标题栏（仍显示关闭按钮）；如果为null，则不显示标题栏也不显示关闭按钮；
        content : "",       [必选][字符串] 对话框内容，如果type是insert/agent时必须是一个selector或dom
        type :  "html",     [可选]["html"|"text"|"insert"|"agent"|"shell"] 为content指定类型
        width : 0,          [可选][数字] 对话框宽度，若为0，则跟随内容宽度自适应（有最小200px宽度限制）
        height : 0,         [可选][数字] 对话框高度，若为0，则跟随内容高度自适应（主体部分保持最小50像素高度）
        button : ["确定"],    [可选][字符串数组] 对话框按钮，若为空数组，则不显示按钮栏；如果按钮字符以*开头，则表示是默认按钮，但*不显示，默认按钮在打开时会被聚焦选中
        method : "prepend", [可选]["append"|"prepend"] dom元素的插入位置，默认prepend
        css : "",           [可选][字符串|"iDialogError"|"iDialogAlert"|"iDialogConfirm"|"iDialogInfo"] 附加样式，该样式被添加到对框框最外层元素上（具体参考下方的HTML结构）
        position : "c",     [可选][数字0~8|整数数组|坐标对象|字符示位] 定位对话框的位置，默认居中
                                > 0 可用屏幕中央 1-8分别从屏幕左上角顺时针对应八个位置
                                > 若为数组，则以该数组给定的xy坐标显示
                                > 若为对象则当作定位样式处理，支持left、right、top、bottom属性，如果值是 auto/c/center 则居中显示，比如 left:"auto" 则左右居中
                                > 若为字符，则可以处理 t l r b c 字符的任何合理组合
        dragable : 1,       [可选][布尔|数字] 是否允许对话框可拖动，若设置为true(或1)并且title为空或者null，则不能拖动，若设置为2则全部对话框都可以触发拖动（可编辑元素除外）
        animate : 15,       [可选][数字] 动画类型 0无动画 1渐入 2切入 3缩小渐入(CSS3) 4旋转(CSS3) 5放大弹出(CSS3) 或者区分设置 13 / 14 / 15 / 23 / 24 / 25，也可以自定义CSS3的transition样式
        layout : true,      [可选][布尔] 是否显示蒙层，即打开类模式窗口（不是真正的模式窗口），设置为 2 则强制半透蒙层
        timeout : 0，        [可选][数字] 是否自动关闭对话框，为0则不自动关闭，单位ms
        //以下参数传递的事件也可以通过控制对象绑定
        //其中init对应的是 onCreate 事件，beforeClose 对应 onBeforeClose 事件，check对应 onBtnClick 事件
        //其中check绑定的函数的this是dom元素，onBtnClick 的this是对话框控制对象
        init : $.noop,      [可选][函数] 初始化方法，如果type为ajax，则该方法会收到一个布尔参数，表示是否成功加载远程数据，如果type为frame则会收到一个frame参数，指向该iframe对象
        beforeClose : $.noop, [可选][函数] 关闭前处理，返回false则不处理，对话框也不关闭，接收一个参数，该参数同callback回调函数的参数
        check : $.noop, [可选][函数] 用户操作处理函数，接受一个参数，代表用户点击的是哪个按钮
                                按钮编号规则：单按钮，编号为1， 多按钮，按照倒序从n-1到0。函数返回值将传递给关闭回调函数并关闭对话框，返回false则不关闭对话框
    }
 *
 * [HTML 结构示意]
    <div class="iDialogLayout">我是蒙层</div>
    <div class="iDialog">
        <table class="iDialogWrapTable">
        <tr><td class="itd-top-left"></td><td class="itd-top-center"></td><td class="itd-top-right"></td></tr>
        <tr><td class="itd-mid-left"></td><td class="itd-mid-center">
            <div class="iDialogContent">
                <div class="iDialogHead"><h1>我是标题</h1></div><a class="iDialogClose" href="#">关闭</a>
                <div class="iDialogBody"><div class="iDialogMain">
                    内容模块
                </div></div>
                <div class="iDialogFoot">
                    <a class='iDialogBtn focusBtn'><span>确定</span></a><a class='iDialogBtn'><span>取消</span></a>
                </div>
            </div>
        </td><td class="itd-mid-right"></td></tr>
        <tr><td class="itd-bot-left"></td><td class="itd-bot-center"></td><td class="itd-bot-right"></td></tr>
        </table>
    </div>
 */
(function(factory) {
    if (window.define && define.amd) {
        define(["jquery", "Class", "drag"], function($) {
            return factory(window, $);
        });
    } else if (window.jQuery) {
        factory(window, window.jQuery);
    }
})(function(window, $, undefined) {
    //映射正确的windows上的对象
    var document = window.document,

        //检测UA，防止高版本jQuery删除browser对象
        //这个检测后期可以放到 easyCore 中
        browser = (function() {
            var obj = {},
                ua = navigator.userAgent.toLowerCase(),
                match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                /(opera)(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
                /(msie) ([\w.]+)/.exec(ua) ||
                /(trident)\/.+rv:([\w.]+)/.exec(ua) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(ua) || [];
            if (match[1]) {
                obj[match[1]] = 1;
                obj.version = match[2] || "0";
            }
            if (obj.trident || obj.msie) {
                obj.msie = 1;
                obj.version = document.documentMode || obj.version;
            }
            //检测国内包壳浏览器
            if (/qqbrowser\/(\d+)/.test(ua)) {
                obj.fucker = 1;
                obj.qq = 1;
                obj.version = RegExp.$1;
            }
            //将版本转化为数字
            obj.version = "" + obj.version;
            obj.ver = +obj.version.replace(/\..*$/, "");
            return obj;
        })(),

        //检测CSS动画结束事件名，不支持的为空
        transitionEnd = (function() {
            var styleObj = document.createElement('div').style,
                eventName = "";
            //优先检测标准化接口，如果有直接返回
            //防止通知支持标准api和私有api的 IE 出现bug
            if (styleObj.transition !== undefined) {
                return "transitionend";
            }
            //不支持标准api，再检测私有的api
            $.each({
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd',
                msTransition: 'MSTransitionEnd'
            }, function(animate, transitionEnd) {
                if (styleObj[animate] !== undefined) {
                    eventName = transitionEnd;
                }
            });
            return eventName;
        })(),

        //探测IE6，因为不涉及关键功能，故采用检测UA
        isIE6 = browser.msie && browser.ver < 7,

        //不给低版本IE开启CSS3动画
        notUseCSS3 = !transitionEnd || browser.fucker || (browser.msie && browser.ver < 10);
    /**
     * 依赖检测
     */
    if (!window.Class || !$) {
        return;
    }

    /**
     * 蒙层控制类(可独立调用)
     *
     * 事件： onCreate/onClick/onDestroy
     * 初始化控制参数
     *      zindex      //层级高度
     *      type        //蒙层类型，-1全透明蒙层  1半透蒙层
     *      css         //蒙层额外样式
     *      animate     //动画类型，支持 1渐入渐出  0无动画，如果全透明，则强制无动画
     */
    //蒙层类私有代码
    var _Layout = {
        //半透明灰色蒙层的个数，最大允许一个，以防止多个半透蒙层叠加导致显示效果变差
        grayLayoutNum: 0,
        layoutNum: 0,

        //创建一个新的蒙层dom节点
        prepareDoms: function(zIndex, type, css) {
            //计算屏幕可用区域最大宽高
            var maxWH = this.getMaxWH(),
                //创建蒙层
                layout = $("<div class='iDialogLayout'></div>").appendTo(this.body[0]).css("zIndex", zIndex),
                //定位类型
                fixed = layout.css("position").toLowerCase() === "fixed",
                //IE6下的iframe蒙层
                frame = isIE6 ? $("<iframe frameborder='0' class='iFrameGround fullFrameGround'/>").insertBefore(layout).css("zIndex", zIndex) : 0,
                //是否蒙层全透明
                opacityZero = type !== 2 && (type !== 1 || this.grayLayoutNum > 0);
            //类型参数检测
            type = {
                1: 1,
                2: 2
            }[type] || -1;

            //调整半透/透明样式
            if (opacityZero) {
                layout.addClass("iOpacityZero");
            } else {
                this.grayLayoutNum++;
            }
            this.layoutNum++;

            //增加自定义样式
            if (css) {
                layout.addClass(css);
            }

            //宽高调整
            fixed || layout.height(maxWH.height);
            if (frame) {
                frame.width(maxWH.width).height(maxWH.height);
                layout.width(maxWH.width);
                this.win.unbind("resize", this.resize).resize(this.resize);
            }
            //返回
            return {
                layout: layout,
                frame: frame,
                opacityZero: opacityZero
            };
        },

        //计算可用区域最大高度和宽度
        getMaxWH: function() {
            var body = this.body = this.body || $(document.body),
                win = this.win = this.win || $(win);
            return {
                width: Math.max(body.outerWidth(), document.documentElement.clientWidth),
                height: Math.max(body.outerHeight(), win.height(), document.documentElement.clientHeight)
            };
        },

        //窗口变化，调整蒙层尺寸
        resize: function() {
            var maxWH = _Layout.getMaxWH();
            $(".fullFrameGround,.iDialogLayout").width(maxWH.width).height(maxWH.height);
        },

        /*
         * 动画特效管理
         * act 1显示 2隐藏
         * type 0无动画 1淡入淡出
         */
        animate: function(dom, act, type, callback) {
            //2015-01-15 马超 增加对蒙层filter的判断，防止fadeIn后filter失效
            if (type == 1 && notUseCSS3) {
                type = 0;
            }
            if (type == 1) {
                dom[act == 1 ? "hide" : "show"]()[act == 1 ? "fadeIn" : "fadeOut"](300, callback || $.noop);
            } else {
                (callback || $.noop)();
            }
        }
    };
    var Layout = Class.Base.Event.extend("Widgets.Layout", {
        init: function(ops) {
            this.callSuper("onCreate onClick onDestroy");
            var com = this,
                doms = _Layout.prepareDoms(ops.zindex || ops.zIndex, ops.type, ops.css);
            //保存数据
            this.options = ops;
            this.opacityZero = doms.opacityZero;
            this.cache = doms;
            //非全透明蒙层，动画处理
            if (ops.animate && !doms.opacityZero) {
                _Layout.animate(doms.layout, 1, ops.animate);
            }
            //绑定事件
            doms.layout.mousedown(function(e) {
                com.trigger("onClick", doms.layout, doms.opacityZero);
            });
            //事件通知
            window.setTimeout(function() {
                com.trigger('onCreate', doms);
            }, 0);
        },
        destroy: function() {
            var com = this,
                ops = com.options,
                layout = com.cache.layout,
                frame = com.cache.frame,
                destroy = function() {
                    com.options = com.cache = undefined;
                    layout[0] && layout.remove();
                    frame && frame[0] && frame.remove();
                    if (_Layout.layoutNum === 0) {
                        _Layout.win.unbind('resize', _Layout.resize);
                    }
                    com.trigger("onDestroy");
                };
            //仅仅可以调用一次
            this.destroy = $.noop;
            //计数器更新
            if (!this.opacityZero) {
                _Layout.grayLayoutNum--;
            }
            _Layout.layoutNum--;
            //销毁蒙层
            if (ops.animate && !this.opacityZero && layout[0]) {
                _Layout.animate(layout, 2, ops.animate, destroy);
            } else {
                destroy();
            }
        }
    });

    /**
     * Dialog对话框对象
     */
    var defaultDialogOptions = {
        title: null,
        content: "",
        type: "html",
        width: 0,
        height: 0,
        button: ["*确定"],
        css: "",
        position: "c",
        method: "prepend",
        dragable: 1,
        layout: 1,
        animate: 15,
        timeout: 0
    };
    //对话框私有属性和方法
    var _Dialog = {
        //对话框编号，也就是对话框的id参照
        guid: 0,

        //全局缓存
        cache: {},
        getCacheInfo: function() {
            var ret = {
                dialogNum: 0,
                layoutNum: 0,
                opacityZeroLayout: 0
            };
            $.each(this.cache, function(id, dialog) {
                ret.dialogNum++;
                if (dialog.layout) {
                    ret.layoutNum++;
                    if (dialog.layout.opacityZero) {
                        ret.opacityZeroLayout++;
                    }
                }
            });
            return ret;
        },

        //zindex计数器
        zindex: {
            model: 10000, //模式窗口从10000开始
            modeless: 1000 //非模式窗口从1000开始
        },

        //检查配置参数
        checkOptions: function(ops, callback) {
            var op = $.extend({}, defaultDialogOptions, ops || {}, $.isFunction(callback) ? {
                callback: callback
            } : {});

            //兼容旧版回调参数
            if ($.isFunction(op.check)) {
                var _check = op.check;
                op.check = function(btnId, currentBtn) {
                    return _check.call(this.wrap[0], +btnId, currentBtn[0]);
                };
            }
            if ($.isFunction(op.init)) {
                var _init = op.init;
                op.init = function() {
                    return _init.call(this.wrap[0]);
                };
            }

            //蒙层参数(0不显示 -1全透明 1半透明 2强制半透明)
            op.layout = (function(type) {
                var layout = {
                    "false": 0,
                    "true": 1,
                    "-1": -1,
                    0: 0,
                    1: 1,
                    2: 2
                }[type];
                return layout === undefined ? -1 : layout;
            })(op.layout);

            //分析动画类型
            //0 无动画 [1,2] jQuery内置动画 [3,9]CSS3动画 [11,19]/[21,29]组合动画 
            op.animate = (function(type) {
                var lowerType = type,
                    css3Type = type;
                if (type > 2) {
                    lowerType = parseInt(type / 10);
                    css3Type = type - 10 * lowerType;
                }
                return notUseCSS3 ? lowerType : css3Type;
            })(op.animate);

            //返回处理好的配置参数
            return op;
        },

        /**
         * 挂接参数传递的事件
         */
        bindParaEvent: function(dialog) {
            if (!dialog) {
                return;
            }
            var ops = dialog.options;
            $.each({
                init: "onCreate",
                check: "onBtnClick",
                beforeClose: "onBeforeClose",
                callback: "onDestroy"
            }, function(para, eventName) {
                $.isFunction(ops[para]) && dialog.bind(eventName, ops[para]);
            });
        },

        /**
         * 创建对话框dom
         */
        prepareDoms: function(id, op) {
            var focusBtnReg = /^\*/,
                emptyString = "",
                //构造HTML
                html = ['<div class="iDialog" style="visibility:hidden;z-index:', op.zindex, '" id="', id, '">',
                    //如果没有layout，则必须为IE6下添加iframe衬底
                    isIE6 && !op.layout ? '<iframe frameborder="0" class="iFrameGround"/>' : "",
                    '<table class="iDialogWrapTable"><tr><td class="itd-top-left"></td><td class="itd-top-center"></td><td class="itd-top-right"></td></tr><tr><td class="itd-mid-left"></td><td class="itd-mid-center">',
                    '<div class="iDialogContent">',
                    '<div class="iDialogHead hide"><h1></h1></div><a class="iDialogClose hide" hidefocus="true" href="#"></a>',
                    '<div class="iDialogBody"><div class="iDialogMain"></div></div>', (!op.button || !op.button.length) ? emptyString : (function() {
                        var html = ['<div class="iDialogFoot">'],
                            button = op.button,
                            n = button.length,
                            i = 0,
                            findFocusBtn = 0;
                        for (; i < n; i++) {
                            html[i + 1] = '<a href="javascript:;" rel="' + (n > 1 ? n - i - 1 : 1) + '" class="btn btn-default iDialogBtn' + (focusBtnReg.test(button[i]) && !findFocusBtn ? (findFocusBtn++, ' focusBtn btn-danger') : emptyString) + '"><span>' + button[i].replace(focusBtnReg, "") + '</span></a>';
                        }
                        html[n + 1] = "</div>";
                        return html.join(emptyString);
                    })(),
                    '</div>',
                    '</td><td class="itd-mid-right"></td></tr><tr><td class="itd-bot-left"></td><td class="itd-bot-center"></td><td class="itd-bot-right"></td></tr></table>',
                    '</div>'
                ].join(emptyString);
            //插入页面
            $(document.body)[op.method](html);
            //获得容器dom
            var wrap = $("#" + id).addClass(op.css || "");

            //返回所有关键Dom对象
            return {
                wrap: wrap,
                content: $(".iDialogContent", wrap),
                main: $(".iDialogMain", wrap),
                ground: $(".iFrameGround", wrap),
                closeBtn: $(".iDialogClose", wrap),
                title: $(".iDialogHead", wrap)
            };
        },

        /**
         * 给元素打标记，用于 insert/agent 模式的弹窗
         */
        markDom: function(dom) {
            var obj = $(dom).eq(0),
                id = "posMark" + (+new Date());
            if (!obj[0]) {
                return null;
            }
            if (!obj[0].orgPosMarkId) {
                obj.after("<div style='display:none' id='" + id + "'/>");
                obj[0].orgPosMarkId = id;
                obj[0]._display = obj.css("display");
            }
            return obj.show();
        },

        /**
         * 归还 insert/agent 模式借的dom元素
         */
        revertDom: function(dialog) {
            var orgDom = dialog.cache.orgDom;
            if (orgDom) {
                orgDom[0] && $("#" + orgDom[0].orgPosMarkId).before(orgDom.css("display", orgDom[0]._display));
                delete dialog.cache.orgDom;
            }
        },

        /**
         * 更新Dom元素前先清理内部的iframe
         * 防止IE6出现错误
         */
        updateDom: function(dom, method, content) {
            dom.find("iframe").remove();
            dom[method](content);
        },

        //根据宽高计算对话框坐标
        posReg: {
            l: /l/i,
            t: /t/i,
            r: /r/i,
            b: /b/i,
            c: /c/i
        },
        /*
         * 按照定位参数的类型进行分别处理
         * > 0 可用屏幕中央 1-8分别从屏幕左上角顺时针对应八个位置
         * > 若为数组，则以该数组给定的xy坐标显示
         * > 若为对象则当作定位样式处理
         * > 若为字符，则可以处理 t l r b c 字符的任何合理组合
         */
        calPosition: function(pos, width, height, positionType) {
            var position = {},
                fixed = positionType === "fixed",
                win = $(window),
                scrollFix = [win.scrollLeft(), win.scrollTop()],
                //left,top,right,bottom
                workArea = [0, 0, win.width(), win.height()],
                //计算预置的X、Y坐标
                X = {
                    left: (function() { /* 左 */
                        return fixed ? {
                            left: 0
                        } : {
                            left: workArea[0] + scrollFix[0]
                        };
                    })(),
                    center: (function() { /* 中 */
                        return fixed ? {
                            left: "50%",
                            marginLeft: "-" + width / 2 + "px"
                        } : {
                            left: Math.floor((workArea[2] + workArea[0] - width) / 2) + scrollFix[0]
                        };
                    })(),
                    right: (function() { /* 右 */
                        return fixed ? {
                            right: 0
                        } : {
                            left: workArea[2] - width + scrollFix[0]
                        };
                    })()
                },
                Y = {
                    top: (function() { /* 上 */
                        return fixed ? {
                            top: 0
                        } : {
                            top: workArea[1] + scrollFix[1]
                        };
                    })(),
                    center: (function() { /* 中 */
                        var top = Math.floor((workArea[3] + workArea[1] - height) / 2) + scrollFix[1],
                            //溢出屏幕的距离
                            overflowH = top < 0 ? Math.abs(top) : 0;
                        return fixed ? {
                            top: "50%",
                            marginTop: "-" + (height / 2 - overflowH) + "px"
                        } : {
                            top: overflowH ? 0 : top
                        };
                    })(),
                    bottom: (function() { /* 下 */
                        return fixed ? {
                            bottom: 0
                        } : {
                            top: Math.max(0, workArea[3] - height + scrollFix[1])
                        };
                    })()
                };
            //按照配置类型进行分别计算
            switch (pos.constructor) {
                case String: //检测配置，转化为数字类型处理
                    var r = this.posReg;
                    pos = pos.length == 1 ? pos + "c" : pos;
                    pos = r.t.test(pos) ? r.l.test(pos) ? 1 : r.r.test(pos) ? 3 : 2 :
                        r.b.test(pos) ? r.l.test(pos) ? 7 : r.r.test(pos) ? 5 : 6 :
                        r.c.test(pos) ? r.l.test(pos) ? 8 : r.r.test(pos) ? 4 : 0 : 0;
                    //没有break，为的是进入下个流程当作数字处理
                case Number:
                    if (pos < 0 || pos > 8)
                        break;
                    //计算预设的九个点
                    var arr = [
                        [X.center, Y.center],
                        [X.left, Y.top],
                        [X.center, Y.top],
                        [X.right, Y.top],
                        [X.right, Y.center],
                        [X.right, Y.bottom],
                        [X.center, Y.bottom],
                        [X.left, Y.bottom],
                        [X.left, Y.center]
                    ];
                    //将CSS配置扩展到一起
                    $.extend(position, arr[pos][0], arr[pos][1]);
                    break;
                case Array:
                    position.left = pos[0] === 0 ? 0 : (pos[0] || "");
                    position.top = pos[1] === 0 ? 0 : (pos[1] || "");
                    break;
                default: //否则认为是自定义CSS对象
                    position = $.extend({}, pos || {});
                    break;
            }
            //删除无效的设置或默认的保留字
            $.each(["left", "right", "top", "bottom"], function(i, key) {
                var val = position[key],
                    keepValue = ["auto", "c", "center"];
                if (key in position && (val ? $.inArray(val, keepValue) >= 0 : val !== 0)) {
                    delete position[key];
                }
            });
            //没有提供的位置信息，默认都居中处理
            if (!("left" in position) && !("right" in position)) {
                $.extend(position, X.center);
            }
            if (!("top" in position) && !("bottom" in position)) {
                $.extend(position, Y.center);
            }
            return position;
        },

        /*
         * 拖动（依赖于组件 $.fn.bindDrag，默认包含在easyCore中）
         */
        bindDrag: function(wrap, type) {
            var handler = type == 2 ? wrap : $(".iDialogHead", wrap),
                orgPos, orgMouse;
            if (!handler[0] || (!type && type !== 0) || handler.css("cursor") == "move") {
                return;
            }
            if (!$.fn.bindDrag) {
                return "缺少拖动组件 $.fn.bindDrag，无法绑定拖动。";
            }
            //获取定位信息
            var isFixed = wrap.css("position").toLowerCase() == "fixed",
                getOffset = isFixed ? function(wrap) {
                    return {
                        left: wrap[0].offsetLeft,
                        top: wrap[0].offsetTop
                    };
                } : function(wrap) {
                    return wrap.offset();
                };
            //改变样式
            handler.css("cursor", "move")
                .bindDrag({
                    beforeDrag: function(e) {
                        var target = $(e.target),
                            tag = target[0].tagName.toLowerCase(),
                            label = target.closest("label", handler),
                            isOK = true;
                        //排除特殊元素的监听
                        $.each("a button select input textarea object applet".split(" "), function(i, key) {
                            if (tag === key || target.closest(key, handler)[0]) {
                                isOK = false;
                            }
                        });
                        //检查是否label
                        if (label[0] && label.attr("for")) {
                            isOK = false;
                        }
                        return isOK;
                    },
                    dragStart: function(e) {
                        orgPos = getOffset(wrap);
                        orgMouse = [e.pageX, e.pageY];
                        //重置初始化定位信息，避免影响拖动
                        wrap.css({
                            marginLeft: "",
                            marginTop: "",
                            left: orgPos.left,
                            top: orgPos.top,
                            right: "",
                            bottom: ""
                        });
                        //显示遮盖iframe的蒙层，防止鼠标移入iframe时拖动失效
                        $(".iDialogDragLayoutHelper", wrap).show();
                    },
                    onDrag: function(e) {
                        wrap.css({
                            left: orgPos.left + e.pageX - orgMouse[0],
                            top: orgPos.top + e.pageY - orgMouse[1]
                        });
                    },
                    dragEnd: function(e) { //如果移出可视区域，则移动到可视区域(至少保留40像素可视)
                        var pos = getOffset(wrap),
                            win = $(window),
                            winSize = [win.width(), win.height()],
                            wrapSize = [wrap.width(), wrap.height()],
                            docScroll = isFixed ? [0, 0] : [win.scrollTop(), win.scrollLeft()],
                            posfix = {};
                        //顶部超出区域，则回到顶部，否则露头40像素
                        posfix.top = Math.max(docScroll[0], Math.min(pos.top, winSize[1] - 40 + docScroll[0]));
                        posfix.left = Math.min(winSize[0] - 40 + docScroll[1], Math.max(pos.left, 60 - wrapSize[0] + docScroll[1]));
                        //需要修正位置的，则挪动位置
                        if (posfix.top != pos.top || posfix.left != pos.left) {
                            wrap.animate(posfix, 200);
                        }
                        $(".iDialogDragLayoutHelper", wrap).hide();
                    }
                });
        },

        //取消拖动
        unbindDrag: function(dialog) {
            if (!dialog) {
                return;
            }
            var wrap = dialog.wrap,
                type = dialog.options.dragable;
            if (wrap[0] && type) {
                (type == 2 ? wrap : wrap.find(".iDialogHead")).unbind("mousedown").css("cursor", "");
                //会导致bindMoveTop的事件被误卸载，需要添加回来
                _Dialog.bindMoveTop(dialog);
            }
        },

        //调整IE6的iframe背景尺寸
        fixIframeGround: function(dialog) {
            var ground = dialog ? dialog.cache.ground : 0;
            ground && ground.css("zIndex", -1).width(dialog.width()).height(dialog.height());
        },

        /**
         * 为对话框绑定点击置顶的功能
         */
        bindMoveTop: function(dialog) {
            if (!dialog || dialog.layout) {
                return;
            }
            dialog.wrap.mousedown(function() {
                _Dialog.moveTop(dialog);
            });
        },

        /**
         * 将无蒙层对话框置顶
         */
        moveTop: function(dialog) {
            if (!dialog || dialog.layout || dialog.closing || dialog.closed) {
                return;
            }
            var myIndex = dialog.options.zindex,
                maxi = 0;
            $.each(_Dialog.cache, function(id, obj) {
                if (obj && !obj.closed && !obj.closing && !obj.layout) {
                    var index = obj.options.zindex;
                    //所有比当前对话框高的zindex降低
                    if (index < _Dialog.zindex.modeless && index > myIndex) {
                        obj.wrap.css("zIndex", obj.options.zindex = index - 1);
                        maxi = index > maxi ? index : maxi;
                    }
                }
            });
            maxi && dialog.wrap.css("zIndex", dialog.options.zindex = maxi);
        },

        /**
         * 找到最顶层的对话框
         */
        findTopDialog: function() {
            var maxi = 0,
                dialog = null;
            $.each(this.cache, function(id, obj) {
                if (obj && !obj.closing && !obj.closed) {
                    var index = obj.options.zindex;
                    dialog = index > maxi ? (maxi = index, obj) : dialog;
                }
            });
            return dialog;
        },

        /**
         * 找到最顶层的对话框并聚焦默认的按钮
         */
        focusBtn: function(dialog) {
            dialog = dialog || _Dialog.findTopDialog();
            if (!dialog || (document.hasFocus && !document.hasFocus())) {
                return;
            }
            //聚焦默认按钮
            $(".iDialogBtn[rel=1]", dialog.wrap).focus();
            //聚焦选中的按钮
            $(".focusBtn:visible", dialog.wrap).focus();
        },

        /**
         * 关闭最顶层的对话框
         */
        closeTopDialog: function(e) {
            if (e && e.keyCode == 27) {
                var dialog = _Dialog.findTopDialog();
                if (dialog && $(".iDialogClose:visible", dialog.wrap).length) {
                    dialog.close();
                }
            }
        },

        /**
         * 绑定全局快捷Esc键
         */
        checkShortCut: function() {
            $(document).unbind("keydown", this.closeTopDialog);
            for (var id in this.cache) {
                $(document).keydown(this.closeTopDialog);
                return;
            }
        },

        /**
         * 绑定对话框按钮click监听
         */
        bindBtnClick: function(dialog) {
            var wrap = dialog.wrap;
            if (wrap[0] && !wrap[0].initButtonClick) {
                wrap.delegate(".iDialogBtn", "click", function(e) {
                    //从 rel 属性中取按钮编号
                    var id = parseInt($(this).attr("rel") || "-1", 10),
                        //触发事件
                        ret = dialog.trigger('onBtnClick', id, $(this));
                    //检查返回值
                    ret = ret === undefined ? id : ret;
                    if (ret !== false) {
                        dialog.close(ret);
                    }
                    e.preventDefault();
                }).delegate('.iDialogClose', 'click', function(e) {
                    dialog.close(null);
                    e.preventDefault();
                });
                wrap[0].initButtonClick = true;
            }
        },

        /*
         * 动画特效管理
         * act 1显示 2隐藏
         * type 0无动画 1淡入淡出 2滑入滑出 3缩小淡入放大淡出(css3) 4旋转(Y)入旋转(Y)出(css3) 5渐变放大入渐变缩小出
         */
        animate: function(dom, act, type, callback) {
            var css, pos, core = ["iDialogShowAniCore", "iDialogHideAniCore"][act - 1],
                fn = callback || $.noop,
                aniCallback = function() {
                    dom.removeClass(core)[act == 1 ? "show" : "hide"]();
                    fn();
                };
            //在IE7动态加载模式下，会有小概率情况发生com元素不存在的情况，但功能似乎不受影响
            //由于问题不容易复现，尚未发现问题症结，故先做一下兼容处理
            //2015-01-17 马超
            if( !dom || !dom[0] ){
                return fn();
            }

            //显示dom
            dom.css("visibility", "visible");

            //如果没有动画，或设置了CSS3动画，但是当前浏览器不支持CSS3动画，则统一无动画
            if (!type || (type > 2 && notUseCSS3)) {
                dom[act == 1 ? "show" : "hide"]();
                return fn();
            }
            //如果是全兼容普通动画（基于jQuery）
            if (type < 3) {
                act == 1
                    //显示动画
                    ? dom.hide()[type == 1 ? "fadeIn" : "slideDown"](200, fn)
                    //隐藏动画
                    : dom.show()[type == 1 ? "fadeOut" : "slideUp"](200, fn);
                return;
            }
            //进入CSS3动画流程
            css = "iDialogAnimate" + type;
            if (act == 1) { //显示动画
                dom.one(transitionEnd, aniCallback).addClass(css);
                window.setTimeout(function() {
                    dom.addClass(core).removeClass(css);
                }, 10);
            } else { //关闭动画
                dom.one(transitionEnd, aniCallback).addClass(core);
                window.setTimeout(function() {
                    dom.addClass(css);
                }, 10);
            }
        },

        /**
         * 关闭所有的对话框
         */
        closeAll: function() {
            //优化点：当同时关闭n个对话框的时候，直接无动画关闭，以提高性能
            $.each(_Dialog.cache, function(id, dialog) {
                dialog.close();
            });
        }
    };
    //创建对话框主类
    var Dialog = Class.Base.Event.extend("Widgets.Dialog", {
        init: function(options, callback) {
            //创建事件
            this.callSuper("onCreate onShow onBeforeClose onClose onDestroy onBtnClick");

            //检查参数
            var ops = _Dialog.checkOptions(options || {}, callback),
                dialog = this;

            //创建蒙层
            if (ops.layout) {
                this.layout = Layout.create({
                    zindex: _Dialog.zindex.model++,
                    type: ops.layout,
                    animate: ops.animate ? 1 : 0
                }).onDestroy(function() {
                    dialog.layout = null;
                }).onClick(function() {
                    //如果是全透明背景，点击后，提醒当前对话框窗口
                    if (this.opacityZero) {
                        dialog.flash();
                    }
                });
                ops.zindex = _Dialog.zindex.model++;
            } else {
                this.layout = null;
                ops.zindex = _Dialog.zindex.modeless++;
            }

            //创建标志
            this.id = "iDialog" + _Dialog.guid++;
            //创建对话框容器
            this.cache = _Dialog.prepareDoms(this.id, ops);
            //保存配置
            this.options = ops;
            //设置默认返回值
            this.returnValue = null;
            //保存容器并显示
            this.wrap = this.cache.wrap.css("visibility", "visible");

            //设定标题
            this.title(true);
            //宽高设置
            this.width(ops.width).height(ops.height);
            //插入内容，并定位
            this.content(ops.content, ops.type, true);

            //处理完毕暂时隐藏，动画的时候再显示
            this.wrap.css("visibility", "hidden");

            //增加对话框叠加点击的处理
            _Dialog.bindMoveTop(this);
            //聚焦按钮
            _Dialog.focusBtn(this);
            //挂接参数传递的事件
            _Dialog.bindParaEvent(this);

            //检查拖动
            ops.dragable && this.bindDrag();
            //定时关闭
            ops.timeout && window.setTimeout(function() {
                dialog.close();
            }, ops.timeout);

            //存入全局缓存
            _Dialog.cache[this.id] = this;
            //检查快捷键绑定
            _Dialog.checkShortCut();

            //通知事件
            window.setTimeout(function() {
                dialog.trigger('onCreate', dialog);
                _Dialog.animate(dialog.wrap, 1, ops.animate, function() {
                    dialog.trigger("onShow", dialog);
                    //全局消息，设置50ms的缓冲
                    $.sendMsg(50, "dialog.show", _Dialog.getCacheInfo());
                });
            }, 0);
        },
        //闪动对话框
        flash: function() {
            var wrap = this.wrap,
                i = 0,
                N = 2 * 6,
                timer = window.setInterval(function() {
                    wrap[i % 2 ? "removeClass" : "addClass"]("iDialogFlash");
                    ++i >= N && window.clearInterval(timer);
                }, 100);
            return this;
        },
        //修改对话框内容
        //待优化：当第二次修改content的时候，利用dialogBody元素动画过渡宽高
        content: function(content, contentType, ifResetPosition) {
            //处理参数
            if (typeof(contentType) === "boolean") {
                ifResetPosition = contentType;
                contentType = "html";
            }
            contentType = contentType || "html";
            if (!content && content !== "") {
                return this;
            }
            //读取缓存
            var cache = this.cache,
                wrap = cache.wrap,
                dialog = this,
                update = _Dialog.updateDom,
                groundCopy;
            //检查现有的内容是否有借调行为（insert/agent）
            //如果有，则先归还dom
            _Dialog.revertDom(this);

            //插入内容
            switch (contentType) {
                case "html":
                case "text":
                    //如果main元素已经被删除，则取wrap
                    update(cache.main || wrap, contentType, content);
                    break;
                case "shell":
                    //缓存数据有变，删除引用
                    cache.main = cache.content = null;
                    //如果有iframe背景，则需要保留
                    if (cache.ground[0]) {
                        groundCopy = cache.ground.clone();
                    }
                    //重写全部的兑换框
                    update(wrap, "html", content);
                    break;
                case "insert": //将content指定的Dom（或seletor）作为内容插入到对话框内容区域（对话框仍包含外层table容器）
                case "agent": //将content指定的Dom（或seletor）作为整个对话框的内容（仅保留最外层Div容器）
                    var orgDom = _Dialog.markDom(content);
                    if (!orgDom) {
                        this.content("没有找到页面内容（" + content + "）请检查！");
                    } else {
                        //如果对话框被shell过后，main元素已经不存在，则当作agent流程处理
                        if (contentType == "agent" || !cache.main) {
                            this.content(orgDom, "shell");
                        } else {
                            update(cache.main, "html", orgDom);
                        }
                        //保存引用，方便以后归还
                        cache.orgDom = orgDom;
                    }
                    break;
            }

            //如果有可见的iframe，则添加拖动辅助层（防止鼠标拖动到iframe内的时候，无法捕获）
            if (wrap.find("iframe:visible").length && !wrap.find(".iDialogDragLayoutHelper").length) {
                wrap.append('<div class="iDialogDragLayoutHelper"></div>');
            }
            //恢复iframe背景
            if (groundCopy) {
                wrap.prepend(groundCopy);
                cache.ground = groundCopy;
                _Dialog.fixIframeGround(this);
            }

            //更新dom引用
            this.button = $(".iDialogBtn", wrap);

            //增加按下样式处理，次要功能
            //因为setControlEffect还依赖了别的接口，所以直接tryCatch，不再继续处理
            try {
                this.button.setControlEffect("iDialogBtnDown");
                this.cache.closeBtn.setControlEffect("iDialogCloseDown");
            } catch (e) {}

            //绑定按钮事件
            _Dialog.bindBtnClick(this);

            //检查是否需要重新定位，如果需要，就使用初始化的定位方式重新定位
            ifResetPosition && this.position(true);
            return this;
        },
        //重新定位对话框
        position: function(position) {
            if (position === undefined) {
                return this.options.position;
            }
            if (position === true) {
                position = this.options.position;
            }
            this.options.position = position;
            //更新CSS定位信息
            this.wrap.css($.extend({
                    left: '',
                    top: '',
                    bottom: '',
                    right: '',
                    marginTop: '',
                    marginLeft: ''
                },
                _Dialog.calPosition(position || 0, this.width(), this.height(), this.wrap.css("position"))
            ));
            return this;
        },
        //取消拖动
        unbindDrag: function() {
            _Dialog.unbindDrag(this);
            return this;
        },
        //设置拖动(type:1标题拖动 type:2整个对话框拖动)
        bindDrag: function(type) {
            var options = this.options;
            //检查处理参数
            type = type || options.dragable || 1;
            //先解除绑定
            this.unbindDrag();
            //重新绑定拖动
            var errText = _Dialog.bindDrag(this.wrap, type);
            if (errText) {
                this.warn(errText);
            }
            //更新缓存标记
            options.dragable = type;
            return this;
        },
        //修改标题
        title: function(title) {
            if (title === undefined) {
                return this.options.title;
            }
            if (title === true) {
                title = this.options.title;
            }
            var cache = this.cache,
                notitle = "iDialogNoTitle";
            //如果dom节点尚且存在，则修改
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
            //存入缓存
            this.options.title = title;
            return this;
        },
        //修改高度
        height: function(height) {
            var cache = this.cache,
                wrapH = cache.wrap.height(),
                main = cache.main,
                wrap = cache.wrap;
            if (height === undefined) {
                return wrapH;
            }
            //必须是数字类型
            height = parseInt(height, 10) || 0;
            if (height === 0) {
                (main || wrap).css("height", "auto");
            } else if (height) {
                //内容区域保持最小 50 像素的高度
                if (main) {
                    main.height(Math.max(height - (wrapH - main.height()), 50));
                } else {
                    wrap.height(Math.max(50, height));
                }
            }
            //调整iframe背景
            _Dialog.fixIframeGround(this);
            return this;
        },
        //修改宽度
        width: function(width) {
            var cache = this.cache;
            if (width === undefined) {
                //在IE8下，弹窗内部有iframe的时候，其jquery的宽度计算似乎有bug，第一次计算为0，第二次计算正确。
                return cache.wrap.width() || cache.wrap.width();
            }
            //必须是数字类型
            width = parseInt(width, 10) || 0;
            if (width === 0) {
                cache.wrap.css("width", "auto").addClass("autoWidthDialog");
            } else if (width) {
                cache.wrap.removeClass("autoWidthDialog").width(Math.max(width, 200));
            }
            //调整iframe背景
            _Dialog.fixIframeGround(this);
            return this;
        },
        //关闭对话框
        close: function(returnValue) {
            if (this.closing || this.closed) {
                return;
            }
            var retValue = returnValue === undefined ? this.returnValue : returnValue,
                dialog = this;
            if (this.trigger('onBeforeClose', retValue) === false) {
                return;
            }
            this.returnValue = retValue;

            //打标记，开始关闭
            this.closing = true;
            //检查缓存，确定是否要卸载全局的Esc快捷按键监听
            _Dialog.checkShortCut();

            //开始清理资源
            this.layout && this.layout.destroy();
            _Dialog.animate(this.wrap, 2, this.options.animate, function() {
                dialog.closed = true;
                dialog.wrap.hide();
                dialog.trigger("onClose", retValue);
                //清理缓存，销毁控制对象
                _Dialog.revertDom(dialog);
                _Dialog.updateDom(dialog.wrap, "html", "");
                dialog.wrap.empty().remove();
                delete _Dialog.cache[dialog.id];
                delete dialog.cache;
                delete dialog.wrap;
                delete dialog.button;
                delete dialog.options;
                if (isIE6) {
                    document.body.className = document.body.className;
                }
                //通知销毁事件
                dialog.trigger('onDestroy', retValue);
                //全局消息，增加 50ms 缓冲
                $.sendMsg(50, "dialog.hide", _Dialog.getCacheInfo());
                //重新聚焦其他对话框的按钮
                _Dialog.focusBtn();
            });
        },
        toString: function() {
            return this.id;
        }
    });
    //同名函数
    Dialog.prototype.destroy = Dialog.prototype.close;
    Dialog.closeAll = Dialog.destroyAll = _Dialog.closeAll;
    //消息汇总
    $.bindMsg("dialog.show", function(info) {
        $.sendMsg("dialog.change", 1, info);
    });
    $.bindMsg("dialog.hide", function(info) {
        $.sendMsg("dialog.change", 0, info);
    });

    /**
     * 对外接口包装
     */
    //基本接口
    $.dialog = function(options, callback) {
        if (options === undefined) {
            return Dialog.closeAll();
        }
        //指定单一对户框进行关闭
        if (options.constructor === Dialog || (typeof options == "string" && _Dialog.cache[options])) {
            //如果有第二个参数，则当作返回值
            (options.close ? options : _Dialog.cache[options]).close(callback);
            return;
        }
        //指定类型关闭，即分组关闭
        //如果不是分组关闭，则当作 content 来新建一个对话框
        if (typeof options === "string") {
            //如果尝试关闭一个不存在的弹窗，则直接返回
            if (/^iDialog\d+$/.test(options)) {
                return;
            }
            var css = options.indexOf(".") === 0 ? options.substr(1) : "";
            if (css) {
                $.each(_Dialog.cache, function(id, dialog) {
                    if (dialog.wrap.hasClass(css)) {
                        //如果有第二个参数，则设置为返回值
                        dialog.close(callback);
                    }
                });
                return;
            } else {
                options = {
                    content: options
                };
            }
        }
        //创建新对话框
        return Dialog.create(options, callback);
    };

    //增值包装接口
    $.each({
        alert: function(content, btn, callback) {
            return Dialog.info(content, btn, callback, 0, "iDialogAlert");
        },
        confirm: function(content, btn, callback) {
            return Dialog.info(content, btn, callback, ["*确定", "取消"], "iDialogConfirm");
        },
        error: function(content, btn, callback) {
            return Dialog.info(content, btn, callback, 0, "iDialogError");
        },
        info: function(content, btn, callback, _defaultBtn, _defaultCss) {
            if ($.isFunction(btn)) {
                callback = btn;
                btn = 0;
            }
            var button = btn || _defaultBtn || ["*确定"];
            return Dialog.create({
                title: null,
                css: _defaultCss || "iDialogInfo",
                content: content,
                dragable: 2,
                //如果不使用按钮，则默认2500秒后自动关闭
                //timeout : button.length ? 0 : 2500,
                button: button
            }, callback);
        },
        toast: function(content, timeout, callback) {
            if ($.isFunction(timeout)) {
                callback = timeout;
                timeout = 0;
            }
            return Dialog.create({
                title: null,
                css: "iDialogToast",
                content: content,
                button: [],
                layout: -1,
                position: {
                    bottom: "30%"
                },
                timeout: timeout || 2500,
                animate: 16
            }, callback).onCreate(function() {
                //使用全透明蒙层的目的是提高zindex
                //确保提示在最上方，打开后需要删除蒙层
                this.layout.destroy();
            });
        }
    }, function(method, fn) {
        Dialog[method] = $.dialog[method] = fn;
    });

    return $.dialog;
});
