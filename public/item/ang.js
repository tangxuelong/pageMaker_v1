define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 无双铺码组件
   */
  return Panel.extend({
    icon: "pie-chart",
    name: "ang",
    NAME: "无双铺码",
    group: "adv",
    init: function () {
      this.callSuper({
        id: "ang"
      });
    },
    tmpl: [{
      label: "*铺码标识",
      content: [{
        type: "input",
        name: "sid",
        holder: "比如 AG_771471_IEQA",
        value: ""
      }]
    }, {
      label: "*站点信息",
      content: [{
        type: "input",
        name: "site",
        holder: "比如 $some.site.com$",
        value: ""
      }]
    }, {
      label: "控制选项",
      content: [{
        type: "checkbox",
        name: "trackPv",
        checked: true,
        text: "trackPv"
      }]
    }],
    get: function () {
      var data = this.save();

      if (!data.sid || !data.site) {
        return this.error("需要设置铺码标志、站点信息!")
      }

      var js = ['(function(a,b,c,d){',
        'a[c]=function(){a[c]["ar"]=a[c]["ar"]||[];a[c]["ar"].push(arguments);};',
        'var s=b.createElement("script");s.async = 1;s.src="//t.agrantsem.com/js/agt.js";',
        'var r=b.getElementsByTagName("script")[0];r.parentNode.insertBefore(s,r);',
        '})(window,document,"_agtjs","script");',
        "_agtjs('init','" + data.sid + "','" + data.site + "');",
        data.trackPv ? "_agtjs('trackPv');" : ""
      ];
      return '<script>' + js.join("") + '</' + 'script>';
    }
  });
});
