define(["jquery"], function ($) {
  return {
    getCss: function (data) {
      var css = [];
      if (!data) return css;
      // 动画样式
      $.each(["aniOpac", "aniDown", "aniZoom"], function (i, key) {
        if (data[key]) {
          css.push(key);
        }
      });
      return css;
    },
    getConf: function (conf) {
      conf = conf || {};
      return {
        label: "点击响应",
        content: [{
          type: "checkbox",
          name: "aniOpac",
          checked: !!conf.aniOpac,
          text: "半透"
        }, {
          type: "checkbox",
          name: "aniDown",
          checked: !!conf.aniDown,
          text: "按下"
        }, {
          type: "checkbox",
          name: "aniZoom",
          checked: !!conf.aniZoom,
          text: "缩小"
        }]
      };
    }
  }
});
