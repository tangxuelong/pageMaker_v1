define([
  "jquery", "LS", "tools", "com/panel"
  // LS 本地存储模块
  // LS.get(key) / LS.set(key, value) / LS.remove(key)
  //
  // tools 工具模块:
  // tools.getPaddingStyle(posObj [,type]);
  //    posObj: 描述padding值的对象： {top, left, right, bottom}
  //    type: 可选，默认 padding，可选 margin
  //    @retrun 一个位置描述字符串，可直接输出到 style 标签内
  // tools.getCss(obj);
  //    将对象描述的css样式转化为字符串描述，并将数字值转化为rem格式，可直接输出到 style 标签内
  // tools.safeHTML(str, light)
  //    str: 需要编码的字符串
  //    light: 是否轻度编码，默认false，轻度编码适用于将字符输出到html节点属性中，保留原始的引号
  //    @return 编码后的字符串
  // tools.safeRegStr(str)
  //    将字符串转化为安全的正则表达式字符串，用于构建动态的正则表达式
  //
], function ($, LS, tools, Panel) {
  return Panel.extend({
    // 所有支持的图标见这里：/font/demo.html
    icon: "icon-drawer",
    // 组件英文名称，不能与其他任何组件同名，必须设置有前缀，比如 project-item
    // 一旦提交组件，名称就是作为关键词与组件唯一对应，名称就不能再修改，否则会被当做一个新组件
    // 英文名不区分大小写（因为会强制转化为小写）
    name: "{itemName}",
    // 组件中文名称，建议四个汉字以内
    NAME: "{itemTextName}",
    // 初始化函数
    init: function () {
      // 默认初始化，仅仅调用callSuper即可
      // 如果希望组件只能被实例化一次，可以传入参数id：
      // this.callSuper({id: "myId"})
      this.callSuper();
    },
    // 配置面板
    // 跟 label 同级的属性：css，给面板容器添加指定的 css
    // label前置加*，则会着重输出，表示必选内容
    tmpl: [{
      label: "*单选",
      content: [{
        type: "radio",
        name: "radioName",
        value: 1,
        checked: true,
        text: "显示1"
      }, {
        type: "radio",
        name: "radioName",
        value: 2,
        text: "显示2"
      }]
    }, {
      label: "*输入框",
      css: "layoutFor1",
      content: [{
        type: "input",
        name: "text",
        holder: "这里是holder文字",
        demo: "这里是demo说明，显示到输入框的右侧。"
      }]
    }, {
      label: "颜色",
      css: "layoutFor2",
      content: [{
        type: "color",
        name: "color",
        value: "#434343"
      }]
    }, {
      label: "组合背景",
      content: [{
        type: "background",
        colorName: "bgcolor",
        colorValue: "",
        imageName: "bgimage",
        holder: "背景图"
      }]
    }, {
      label: "上传图片",
      content: [{
        type: "image",
        name: "uploadImage",
        holder: "请输入或上传图片"
      }]
    }, {
      label: "组件内边距",
      content: [{
        type: "number",
        name: "padtop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "padbtm",
        value: 20,
        before: "下 "
      }, {
        type: "number",
        name: "padl",
        value: 0,
        before: "左 "
      }, {
        type: "number",
        name: "padr",
        value: 0,
        before: "右 "
      }]
    }, {
      label: "组件外边距",
      content: [{
        type: "number",
        name: "martop",
        value: 0,
        before: "上 "
      }, {
        type: "number",
        name: "marbtm",
        value: 30,
        before: "下 "
      }, {
        type: "number",
        name: "marl",
        value: 24,
        before: "左 "
      }, {
        type: "number",
        name: "marr",
        value: 24,
        before: "右 "
      }]
    }],
    // 依赖css列表
    dependCss: [],
    // 依赖js列表
    dependJS: [],
    // 可选自动切换，一个组件中，仅仅能有一个切换功能
    typeSwitch: {
      typeSelector: "[name*=radioName]",
      prefixCss: "layoutFor"
    },
    // 初始化事件
    initEvent: function () {
      // this.wrap 指向面板外容器
      // 多数情况下，initEvent函数无须编写代码
    },
    // 输出html代码，可以动态修改 dependCss / depengJS 配置
    // 1、通过 this.save() 来获取组件的配置内容对象（key是配置元素的name）。",
    // 2、修改this.dependJS数组，可以加载指定的js文件（全路径），或内置的js文件：zepto、share、app、format、dialog等。",
    // 3、dependJS 没有自动依赖管理，需要手工控制加载以及顺序。比如要使用dialog需要设置 this.dependJS=['zepto','dialog']。",
    // 4、修改<code>this.dependCss数组，可以加载指定的css文件（全路径）。默认会引入全局重置样式表。",
    // 5、函数需要返回非空的html字符串，否则组件将不输出内容。"
    get: function () {
      // this.save() 可以返回当前用户json格式的配置内容
      // 在预览页面输出的时候，window.isPreview 属性为 true
      var data = this.save();
      // 可以动态修改 dependJS / dependCss
      this.dependJS = ["zepto"];
      this.dependCss = [];
      // 整合样式输出
      var css = tools.getPaddingStyle({
        top: data.padtop,
        bottom: data.padbtm,
        left: data.padl,
        right: data.padr
      }, "margin") + ";" + tools.getCss({
        color: data.color,
        "background-color": data.bgcolor,
        "background-image": data.bgimage ? "url(" + data.bgimage + ")" : ""
      });

      // 在需要提示配置错误的时候，可以调用 error 方法并使用 return 中断处理
      // return this.error("error desc.");

      // 在输出html代码的时候，可视化元素要用 <section></section> 包装，以方便全局动效组件正确处理
      // 可以使用 tools.safeHTML 来对输出的html代码进行安全编码
      // 设置cmd属性并引用 app 后可以在内嵌app时调用 cmd命令（如果项目支持的话）
      return '<section><a style="' + css + '"' + (data.cmd ? ' cmd="' + data.cmd + '"' : '') +
        ' href="' + tools.safeHTML(data.link) + '">' + tools.safeHTML(data.text) + "</a></section>";
    }
  });
});
