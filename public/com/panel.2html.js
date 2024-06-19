define([
  'jquery', "com/set", "format", "tools"
], function ($, SET) {
  'use strict';
  var Conf = SET.get();
  var _json2html = {
    guid: 1,
    wrap: ['<div class="panel panel-{panelCss} panel_{name}" id="{id}">',
      '<div class="panel-heading">',
      '<span class="conf-group-name"{titleEdited}>{NAME}</span>&nbsp;',
      '<div class="conf-group-togg"><span class="caret"></span></div>',
      '<div class="conf-group-ctrl">',
      '<span class="glyphicon glyphicon-move move-panel"></span>',
      '<a href="javascript:;" class="glyphicon glyphicon-duplicate copy-panel" title="点击复制当前面板"></a>',
      '<a href="javascript:;" class="glyphicon glyphicon-flash deft-panel" title="点击设置默认值，长按重置"></a>',
      '<a href="javascript:;" class="glyphicon glyphicon-trash del-panel" title="删除面板"></a>',
      '</div>',
      '</div>',
      '<div class="panel-body form-{formCss}" role="form">{formBody}</div>',
      '</div>'
    ].join(""),
    group: ['<div class="form-group{css}">',
      '<label class="col-sm-2 control-label{mustCss}">{groupName}</label>',
      '<div class="col-sm-10{formInline}">{groupHTML}</div>',
      '</div>'
    ].join(""),
    getGroupHTML: function (json) {
      if (!json || !json.label || !json.content) {
        return "";
      }
      /*  {label:"*项目", content:[]}   */
      var data = {
        mustCss: json.label.substr(0, 1) === "*" ? " needed" : "",
        groupName: json.label.replace(/^\*/, ""),
        css: json.css ? " " + json.css : "",
        formInline: json.inline ? " form-inline" : "",
        groupHTML: (function (content) {
          var html = [];
          var guid = _json2html.guid++;
          $.each(content, function (i, obj) {
            html.push(_json2html.getItemHTML(obj, guid))
          });
          return html.join("")
        })(json.content)
      };
      return $.format(_json2html.group, data);
    },
    itemTmpl: (function () {
      var conf = {
        radio: '<label class="radio-inline"><input type="radio" name="{name}" value="{value}"{checked}>{text}</label>',
        checkbox: '<label class="checkbox-inline"><input type="checkbox" name="{name}"{checked}>{text}</label>',
        input: '<input autocomplete="off" class="form-control text" name="{name}" value="{value}" placeholder="{holder}" {style}>',
        cmd: '<input autocomplete="off" class="form-control cmd" name="{name}" value="{value}" placeholder="{holder}" {style}>',
        color: '{text}<input autocomplete="off" class="form-control color" name="{name}" value="{value}" type="{type}">',
        image: '<span class="fileUploadWrap"><i data-size="{size}" data-type="jpg,jpeg,png,gif"></i><input class="form-control image" name="{name}" value="{value}" placeholder="{holder}"></span>',
        media: '<span class="fileUploadWrap"><i data-type="{dataType}"></i><input class="form-control medias" name="{name}" value="{value}" placeholder="{holder}"></span>',
        video: '<span class="videoConfWrap"><i></i><input class="form-control medias" name="{name}" value="{value}" placeholder="{holder}"><input type="hidden" name="{name}_net_video" value=""/></span>',
        url: '<input autocomplete="off" class="form-control url" name="{name}" value="{value}" placeholder="{holder}">',
        percent: '<input autocomplete="off" class="form-control percent" name="{name}" value="{value}" maxlength="3">%',
        number: '{before}<input autocomplete="off" class="form-control number" name="{name}" value="{value}" maxlength="3">{after}',
        textarea: '<textarea autocomplete="off" class="form-control" name="{name}" placeholder="{holder}">{value}</textarea>',
        text: '<p class="form-control-static {css}"> {text}</p>',
        link: '<a class="{css}" href="{href}">{text}</a>',
        background: '<div class="input-group background-group"><div class="input-group-addon"><input autocomplete="off" type="{type}" name="{colorName}" value="{colorValue}" class="form-control color"/></div><span class="fileUploadWrap"><i data-size="{size}" data-type="jpg,jpeg,png,gif"></i><input autocomplete="off" class="form-control image" name="{imageName}" placeholder="{holder}"></span></div>'
      };
      $.each(["input", "color", "image", "url", "textarea", "cmd"], function (i, key) {
        conf[key + "Group"] = '<div class="input-group {groupCss}"><div class="input-group-addon">{addon}</div>' + conf[key] + "</div>";
        if (key === "input" || key === "textarea" || key === "cmd") {
          conf[key + "Group2"] = '<div class="input-group {groupCss}">' + conf[key] + '<div class="input-group-addon">{addon}</div></div>';
        }
      });
      conf.radioGroup = '<div class="input-group {groupCss}"><div class="input-group-addon">{addon}</div><div class="form-control">{radioHTML}</div></div>';
      return conf;
    })(),
    getItemHTML: function (json, guid) {
      if (!json || !json.type) {
        return ""
      }
      var tmpl = _json2html.itemTmpl[json.type] || "";
      var extData = {};
      var getExtendInfo = function (data) {
        var ext = [];
        if (data.info) {
          ext.push("<span class='glyphicon glyphicon-info-sign' title='" + $.safeHTML(data.info) + "'></span>");
        }
        if (data.alert) {
          ext.push("<span class='glyphicon glyphicon-exclamation-sign' title='" + $.safeHTML(data.alert) + "'></span>");
        }
        return ext.join("");
      };
      switch (json.type) {
        case "radio":
          extData = {
            name: json.name + "__" + guid,
            checked: json.checked ? " checked" : "",
            text: json.text + getExtendInfo(json)
          };
          break;
        case "radioGroup":
          extData.radioHTML = (function () {
            var html = [];
            var tmpl = _json2html.itemTmpl.radio;
            if (json.radios && json.radios.length) {
              $.each(json.radios, function (i, obj) {
                html.push($.format(tmpl, $.extend({}, obj, {
                  name: json.name + "__" + guid,
                  checked: obj.checked ? " checked" : "",
                  text: obj.text + getExtendInfo(obj)
                })));
              });
            }
            return html.join("")
          })();
          break;
        case "checkbox":
          extData = {
            checked: json.checked ? " checked" : "",
            text: json.text + getExtendInfo(json)
          };
          break;
        case "input":
        case "cmd":
          if (json.demo) {
            tmpl = _json2html.itemTmpl[json.type + "Group2"];
            json.addon = '<a class="demo" href="#" data-info="' + $.safeHTML(json.demo) + '">示例</a>';
          }
          if (json.help) {
            tmpl = _json2html.itemTmpl[json.type + "Group2"];
            json.addon = '<a class="help" href="#" data-info="' + $.safeHTML(json.help) + '">说明</a>';
          }
        case "inputGroup":
        case "inputGroup2":
          extData = {
            value: $.safeHTML(json.value || ""),
            style: json.width ? ' style="width:' + json.width + '"' : ''
          };
          break;
        case "link":
          extData = {
            href: json.href || "#"
          };
          break;
        case "textarea":
          if (json.demo) {
            tmpl = _json2html.itemTmpl.textareaGroup2;
            json.addon = '<a class="demo" href="#" data-info="' + $.safeHTML(json.demo) + '">示例</a>';
          }
        case "textareaGroup":
        case "textareaGroup2":
          extData = {
            value: $.safeHTML(json.value || "")
          };
          break;
        case "number":
          extData.after = json.after || "";
          extData.before = json.before || "";
          break;
        case "color":
          extData.text = json.text ? '<p class="form-control-static inlineBlock"> ' + json.text + '</p>' : "";
        case "background":
        case "colorGroup":
          extData.size = json.size || "";
          extData.type = !Conf.colorPicker || Conf.colorPicker === "0" ? "color" : "text";
          break;
        case "image":
          extData.size = json.size || "";
          break;
        case "text":
        case "url":
        case "percent":
          break;
      }
      // 默认值
      extData.groupCss = json.groupCss || "";
      extData.addon = json.addon || "";
      extData.holder = extData.holder || json.holder || "";
      extData.value = extData.value || (json.value === 0 ? "0" : json.value || "");
      extData.css = extData.css || json.css || "";
      // 扩展并返回html代码
      return $.format(tmpl, $.extend({}, json, extData));
    }
  };

  // json数据转化为html代码
  return function (ops, content) {
    if (!ops || !ops.name || !content) {
      return "";
    }
    if (!content.length) {
      content.push({
        label: "说明",
        content: [{
          type: "text",
          text: "本组件无需任何配置，创建后即可使用。"
        }]
      });
    }
    var data = $.extend({
      panelCss: "default",
      formCss: "horizontal",
      NAME: "元素"
    }, ops, {
      titleEdited: ops.titleEdited === false ? "" : " contentEditable=true",
      formBody: (function () {
        var html = [];
        $.each(content, function (i, obj) {
          html.push(_json2html.getGroupHTML(obj));
        });
        return html.join("");
      })()
    });
    return $.format(_json2html.wrap, data);
  }
});
