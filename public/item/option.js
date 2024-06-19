define([
  "jquery", "tools", "com/panel"
], function ($, tools, Panel) {
  /**
   * 选项列表
   */
  return Panel.extend({
    icon: "list2",
    name: "option",
    NAME: "选项列表",
    group: "adv",
    init: function () {
      this.did = "s" + String.random();
      this.callSuper();
    },
    tmpl: [{
      label: "功能说明",
      content: [{
        type: "text",
        text: "本组件仅仅输出一组选项列表，需要配合 JSCSS 组件进行部分脚本编程。"
      }]
    }, {
      label: "选项配置",
      content: [{
        type: "text",
        text: "配置两条以上方可生效  <a href='#group-add'>+增加选项</a>"
      }, {
        type: "inputGroup",
        name: "opval",
        addon: "选项值",
        groupCss: "group_first",
        holder: "选项的value值，用于提交数据。"
      }, {
        type: "inputGroup",
        name: "optxt",
        addon: "文　本",
        groupCss: "group_last",
        holder: "选项的文本描述，用于向用户展示。"
      }, {
        type: "text",
        css: "btmAddLink",
        text: "<a href='#group-add'>+增加选项</a>"
      }]
    }, {
      label: "补充选项",
      content: [{
        type: "input",
        name: "note",
        holder: "补充输入框占位说明文字，如果不填就不启用补充选项"
      }]
    }, {
      label: "字号",
      content: [{
        type: "radio",
        name: "size",
        text: "大",
        value: 3
      }, {
        type: "radio",
        name: "size",
        text: "中",
        value: 2,
        checked: true
      }, {
        type: "radio",
        name: "size",
        text: "小",
        value: 1
      }]
    }, {
      label: "选项类型",
      content: [{
        type: "radio",
        name: "type",
        value: "radio",
        text: "单选"
      }, {
        type: "radio",
        name: "type",
        value: "checkbox",
        checked: true,
        text: "多选"
      }]
    }, {
      label: "触发方式",
      content: [{
        type: "text",
        text: "脚本调用：<code class='jsDemo'></code> 返回值参考 online/option.js"
      }]
    }],
    dependCss: ["option"],
    dependJS: ["zepto", "option"],
    updateCallMethod: function () {
      $(".jsDemo", this.wrap).text('$.getOption("' + this.did + '")');
    },
    load: function (data) {
      this.callSuper(data);
      this.did = data.did || this.did;
      this.updateCallMethod();
    },
    save: function () {
      var data = this.callSuper();
      data.did = this.did;
      return data;
    },
    initEvent: function () {
      this.updateCallMethod();
    },
    get: function () {
      var data = this.save();
      var N = $.isArray(data.optxt) ? data.optxt.length : 1;
      var i = 0;
      var html = [];
      var val, txt;
      var ok = 0;
      if (N < 2) {
        return;
      }
      html.push('<section class="optionList fs' + data.size + '" id="option-' + data.did + '"><ul>');
      for (i; i < N; i++) {
        val = data.opval[i];
        txt = data.optxt[i];
        if (val && txt) {
          html.push(['<li><label><input type="', data.type,
            '" name="', data.did,
            '" value="', $.safeHTML(val),
            '"/><span>', $.safeHTML(txt), '</span></label></li>'
          ].join(""));
          ok++;
        }
      }
      if (!ok) {
        return;
      }
      if (data.note) {
        html.push('<li><textarea maxlength="140" name="note" placeholder="' + $.safeHTML(data.note) + '"></textarea></li>');
      }
      html.push('</ul></section>');
      // 返回
      return html.join("");
    }
  });
});
