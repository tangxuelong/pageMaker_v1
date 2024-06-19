define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 百度统计
   */
  return Panel.extend({
    icon: "pie-chart",
    name: "baidu",
    NAME: "百度统计",
    group: "adv",
    init: function () {
      this.callSuper();
    },
    tmpl: [{
      label: "*id",
      content: [{
        type: "input",
        name: "sid",
        holder: "铺码标识，就是hm.js?后面那串字符串",
        value: ""
      }]
    }],
    get: function () {
      var data = this.save();
      if (!data.sid) {
        return this.error("需要设置 id 字符串！");
      }

      var js = ['var _hmt=_hmt||[];',
        'document.URL.indexOf("/open/pageMaker")<0&&(function(){',
        'var hm=document.createElement("script");',
        'hm.src = "https://hm.baidu.com/hm.js?', data.sid, '";',
        'var s=document.getElementsByTagName("script")[0];',
        's.parentNode.insertBefore(hm,s);',
        '})();'
      ];
      return '<script>' + js.join("") + '</' + 'script>';
    }
  });
});
