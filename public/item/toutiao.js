define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 头条铺码组件
   */
  return Panel.extend({
    icon: "pie-chart",
    name: "toutiao",
    NAME: "头条铺码",
    group: "adv",
    init: function () {
      this.callSuper({
        id: "toutiao"
      });
    },
    tmpl: [{
      label: "*convert_id",
      content: [{
        type: "input",
        name: "cid",
        holder: "铺码标识",
        value: ""
      }]
    }, {
      label: "控制选项",
      content: [{
        type: "checkbox",
        name: "trackDownload",
        checked: true,
        text: "监听<code>APP下载</code>组件"
      }]
    }],
    get: function () {
      var data = this.save();
      if (!data.cid) {
        return this.error("需要设置 convert_id！");
      }
      if (data.trackDownload) {
        this.dependJS = ["zepto"];
      }

      var js = [
        '(function(root,$) {',
        'root._tt_config=true;',
        'var ta=document.createElement("script");',
        'ta.type="text/javascript";',
        'ta.async=true;',
        'ta.src=document.location.protocol+"//s3.pstatp.com/bytecom/resource/track_log/src/toutiao-track-log.js";',
        'ta.onerror=function(){',
        'var request=new XMLHttpRequest();',
        'var web_url=window.encodeURIComponent(window.location.href);',
        'var js_url=ta.src;',
        'var url="//ad.toutiao.com/link_monitor/cdn_failed?web_url="+web_url+"&js_url="+js_url+"&convert_id=', data.cid, '";',
        'request.open("GET",url,true);',
        'request.send(null);',
        '};',
        'var s=document.getElementsByTagName("script")[0];',
        's.parentNode.insertBefore(ta, s);',
        // 监听app下载
        data.trackDownload ? ['$(document.body).bind("pageMaker.download",',
          'function(){',
          'window._taq&&_taq.push({convert_id:"' + data.cid + '",event_type:"download_start"})',
          '});'
        ].join("") : '',
        '})(window,window.Zepto||window.jQuery);'
      ];
      return '<script>' + js.join("") + '</' + 'script>';
    }
  });
});
