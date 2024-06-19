// 控制左侧组件菜单显示
define([
  "jquery", "Class"
], function ($, Class) {
  'use strict';

  function getItemLink(item) {
    var prop = item.prototype;
    return ["<a href='javascript:;' class='itemLink' data-type='", prop.name.toUpperCase(), "'>",
      prop.icon ? "<span class='icon-" + prop.icon + "'></span>" : "",
      prop.NAME + "</a>"
    ].join("");
  }
  return {
    initWrap: function (wrap) {
      var timer, clickHandler;
      this.wrap = $(wrap).empty().html('<menu></menu><section></section>')
        // 组件名称点击，则创建组件
        .delegate('a[data-type]', 'click', function (e) {
          var type = $(this).data("type");
          if (type) {
            if (!Class.Page[type]) {
              alert("该组件尚未定义或加载失败!");
            } else {
              Class.Page[type].create().expand(true);
            }
          }
          e.preventDefault();
          // 菜单分类点击，则切换组件显示
        }).delegate("menu h2", "click", clickHandler = function () {
          var $this = $(this);
          if ($this.hasClass("active")) {
            return;
          }
          $this.closest("div").find(".active").removeClass("active");
          $this.addClass("active");
          $("#" + $this.data("rel")).addClass("active");
          timer = 0;
          // 菜单移动上去即可切换，优化交互
        }).delegate("menu h2", "mouseenter", function () {
          timer && window.clearTimeout(timer);
          timer = window.setTimeout(clickHandler.bind(this), 300);
        }).delegate("menu h2", "mouseleave", function () {
          timer && window.clearTimeout(timer);
        });
      this.wrapMenu = this.wrap.find("menu");
      this.wrapSec = this.wrap.find("section");
      this.tab = {};
      return this;
    },
    initOneTab: function (tabId, tabName, items, active) {
      if (!this.wrap) {
        return console.error("组件菜单操作需要先设置容器！");
      }
      this.wrapMenu.append('<h2 data-rel="menuData' + tabId + '" class="groupTitle' + (active ? " active" : "") + (items.length ? "" : " hidden") + '">' + tabName + '</h2>');
      this.wrapSec.append('<div id="menuData' + tabId + '" class="' + (active ? "active" : "") + '">' + items.map(getItemLink).join("") + '</div>');
      // 保存一份分组组件的副本
      this.tab[tabId] = items.concat([]);
    },
    addItem2Tab: function (tabId, item) {
      if (!this.tab[tabId]) {
        return console.error("要操作的目标tab不存在：", tabId);
      }
      // 检查要插入的组件是否已经在列表中，直接使用对象全等
      if (this.tab[tabId].indexOf(item) >= 0) {
        return console.log("要添加的组件已经存在：", item);
      }
      var box = this.wrapSec.find('#menuData' + tabId);
      if (!box[0]) {
        return console.error("要操作的目标tab已经被意外删除：", tabId);
      }
      this.wrapMenu.find("[data-rel=menuData" + tabId + "]").removeClass("hidden");
      box.append(getItemLink(item));
    }
  }
});
