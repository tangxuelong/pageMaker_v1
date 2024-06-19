define([
  "jquery", "tools", "com/panel", "LS", "com/gconf"
], function ($, tools, Panel, LS, gConf) {
  /**
   * META信息配置
   */
  Panel.extend("Page.META", {
    name: "meta",
    NAME: "META信息配置",
    init: function () {
      this.callSuper({
        id: "pageMetaInfo",
        titleEdited: false
      });
    },
    tmpl: [{
      label: "页面标题",
      content: [{
        type: "input",
        name: "title",
        value: "",
        holder: "页面标题，同时也是分享的标题"
      }]
    }, {
      label: "关键词",
      content: [{
        type: "input",
        name: "keywords",
        value: "",
        holder: "页面关键词"
      }]
    }, {
      label: "页面描述",
      content: [{
        type: "input",
        name: "description",
        value: "",
        holder: "描述文字，同时也是分享的描述内容"
      }]
    }, {
      label: "基本字号",
      content: [{
        type: "radio",
        name: "baseFont",
        value: "fontBase",
        checked: true,
        text: "正常"
      }, {
        type: "radio",
        name: "baseFont",
        value: "fontBig",
        text: "大号"
      }]
    }, {
      label: "链接目标",
      content: [{
        type: "radio",
        name: "linkTarget",
        value: "def",
        checked: true,
        text: "默认",
        info: "浏览器默认，无特殊设置"
      }, {
        type: "radio",
        name: "linkTarget",
        value: "self",
        text: "当前页面"
      }, {
        type: "radio",
        name: "linkTarget",
        value: "parent",
        text: "上层页面",
        info: "当页面被iframe形式引入的时候生效"
      }, {
        type: "radio",
        name: "linkTarget",
        value: "top",
        text: "顶层页面",
        info: "当页面被iframe形式引入的时候生效"
      }, {
        type: "radio",
        name: "linkTarget",
        value: "blank",
        text: "新页面"
      }]
    }, {
      label: "页面背景",
      content: [{
        type: "background",
        colorName: "bgColor",
        colorValue: tools.config.bgColor,
        imageName: "bgImage",
        holder: "背景图，宽度撑满不平铺",
        // 增加图片上传特定的参数，指定上传的图片不进行图片尺寸调整和限制
        size: 'free'
      }]
    }, {
      label: "分享图片",
      content: [{
        type: "image",
        name: "shareImage",
        holder: "分享图片设置"
      }]
    }],
    save: function () {
      var conf = this.callSuper();
      // 增加项目名称保存
      conf.pname = gConf.NAME;
      return conf;
    },
    get: function () {
      var obj = this.save();
      // 预留默认值保存
      var def = $.extend({}, obj);
      // ======== 追加全局样式 ==========
      obj.moreStyle = "";
      obj.bgColor = obj.bgColor === tools.config.bgColor ? "" : obj.bgColor;
      if (obj.bgColor || obj.bgImage) {
        obj.moreStyle = "<style>html,body{" + [
          obj.bgImage ? "background-image:url(" + obj.bgImage + ");" : "",
          obj.bgColor ? "background-color:" + obj.bgColor : ""
        ].join("") + "}" +
        // 背景色获取
        (obj.bgColor ? '.pagebg{background-color:' + obj.bgColor + '!important}' : '') +
        // iphonex适配分享蒙层
        ".iphonex #wapShareWrap a{margin-bottom:34pt}</style>";
      }
      if (obj.linkTarget !== "def") {
        obj.moreStyle += '<base target="_' + obj.linkTarget + '"/>';
      }
      // 基本依赖
      this.dependCss = ["base", obj.baseFont];
      this.dependJS = ["share"];
      // ======== 追加全局脚本 ==========
      // 分享信息
      var shareDataStr = JSON.stringify({
        title: obj.title || gConf.item.share.defShareTitle,
        desc: obj.description || gConf.item.share.defShareDesc,
        img: obj.shareImage || gConf.item.share.defShareImg
      });
      // 拼接脚本信息
      obj.moreScript = '<script>' + [
          // 分享初始化代码，立即执行
          gConf.item.share.close ? '' : ['try{',
            gConf.item.share.initCode.replace(/\$shareData\$/g, shareDataStr),
            '}catch(e){console.error("share-initCode throw error",e)}'
          ].join(''),
          // 触发分享代码，保存到window._shareNow等待执行
          gConf.item.share.close ? '' : ['window._shareNow=function(){',
            'try{',
            gConf.item.share.triggerCode.replace(/\$shareData\$/g, shareDataStr),
            '}catch(e){',
            'console.error("share-triggerCode throw error",e)}',
            '}'
          ].join(''),
          // 检测APP内嵌，保存到window._inMyApp等待执行
          gConf.item.app.close ? '' : ['window._inMyApp=function(){',
            'try{return ',
            gConf.item.app.code,
            '}catch(e){',
            'console.error("app-code throw error",e);return false}',
            '}'
          ].join('')
        ].join(";") +
        '</' + "script>";
      // 处理双引号导致模版截断的问题
      $.each(["title", "keywords", "description"], function (i, key) {
        obj[key] = $.safeHTML(obj[key]);
      });
      // 保存默认值
      def.title = "";
      def.keywords = "";
      def.description = "";
      def.bgImage = "";
      def.shareImage = "";
      this.setDefault(def, true);
      return obj;
    }
  });
});
