define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 品众铺码组件
   */
  return Panel.extend({
    icon: "pie-chart",
    name: "pzoom",
    NAME: "品众铺码",
    group: "adv",
    init: function () {
      this.callSuper({
        id: "pzoom"
      });
    },
    tmpl: [{
      label: "*sid",
      content: [{
        type: "input",
        name: "sid",
        holder: "铺码标识",
        value: ""
      }]
    }, {
      label: "控制选项",
      content: [{
        type: "checkbox",
        name: "trackAll",
        checked: true,
        text: "trackAll"
      }, {
        type: "checkbox",
        name: "trackDownload",
        checked: true,
        text: "监听<code>APP下载</code>组件"
      }]
    }],
    get: function () {
      var data = this.save();
      if (!data.sid) {
        return this.error("需要设置 sid！");
      }
      if (data.trackDownload) {
        this.dependJS = ["zepto"];
      }

      var js = ['var _fxcmd=window._fxcmd||[];',
        '_fxcmd.sid="', data.sid, '";',
        '_fxcmd.trackAll=', data.trackAll, ';',
        'document.URL.indexOf("/open/pageMaker")<0&&(function(){',
        // 加载铺码js
        'var _pzfx=document.createElement("script");',
        '_pzfx.type="text/javascript";',
        '_pzfx.async=true;',
        '_pzfx.src="//static.w3t.cn/fx/1/1/fx.js";',
        'var sc=document.getElementsByTagName("script")[0];',
        'sc.parentNode.insertBefore(_pzfx,sc);',
        // 监听app下载
        data.trackDownload ? ['(window.Zepto||window.jQuery)(document.body).bind("pageMaker.download",',
          'function(){',
          'window._fxcmd&&_fxcmd.push(["trackEvent","event","download","download","1"])',
          '});'
        ].join("") : '',
        '})();'
      ];
      return '<script>' + js.join("") + '</' + 'script>';
    }
  });
});
