/*
 * HTML5 制作工具类合集
 */
define([
  "jquery", "Class", "com/set", "custom/loader", "page/listMenu", "com/gconf",
  // 基础组件
  "item/meta", "item/title", "item/pic", "item/button", "item/p", "item/line",
  "item/audio", "item/video", "item/envjump", "item/entry", "item/btmFloat", "item/animate",
  // 扩展组件
  "item/gTitle", "item/floor", "item/anipic",
  "item/pics", "item/buttons", "item/textroll", "item/numroll", "item/news", "item/grid", "item/timeline",
  "item/timer", "item/dialog", "item/appdown",
  // 高级组件
  "item/qrcode", "item/pzoom", "item/ang", "item/toutiao", "item/baidu", "item/option", "item/code"
], function ($, Class, SET, customLoader, listMenu, gConf) {
  // meta组件不显示在组件列表中
  var items = Array.prototype.slice.call(arguments, 7);
  // 立即加载所有私有组件，并与普通组件合并
  var customLoadJob = customLoader.loadAll().then(function (cusItemsArr) {
    items = items.concat(cusItemsArr);
    return items;
  });
  // 所有组件的信息列表
  var allItemInfoList = [];
  // 组件分组
  var group = {
    base: [],
    ext: [],
    adv: [],
    cus: []
  };
  // 保存一个组件的信息
  function saveOneItem(obj) {
    var prop = obj.prototype;
    // 确保分类数据存在
    prop.group = prop.group || "ext";
    // 以大写组件名作为key保存全局缓存
    Class.Page[prop.name.toUpperCase()] = obj;
    // 分拣组件
    if (group[prop.group]) {
      group[prop.group].push(obj);
      allItemInfoList.push({
        type: prop.group,
        name: prop.name,
        NAME: prop.NAME,
        icon: "icon-" + prop.icon
      });
    }
  }

  // 分拣并输出组件
  function outputItems(items) {
    // 组件分拣
    items.forEach(function (obj) {
      var prop = obj ? obj.prototype : null;
      if (prop && prop.name) {
        saveOneItem(obj);
      }
    });
    // 组件输出
    listMenu.initOneTab("base", "基础组件", group.base, true);
    listMenu.initOneTab("ext", "扩展组件", group.ext);
    listMenu.initOneTab("adv", "高级组件", group.adv);
    listMenu.initOneTab("cus", "私有组件", group.cus);
  }

  return {
    init: function (wrap) {
      return customLoadJob.then(function (items) {
        listMenu.initWrap(wrap);
        outputItems(items);
      });
    },
    loadCustomItem: function (itemFile) {
      if (!itemFile) {
        return customLoader.loadAll();
      }
      return customLoader.loadOneFile(itemFile).then(function (item) {
        // 如果有同名的组件则直接替换，并警告提示
        var prop = item.prototype;
        var key = prop.name.toUpperCase();
        if (Class.Page[key] && Class.Page[key] !== item) {
          console.error("私有组件(" + prop.name + ")存在同名！！！");
        }
        // 修改缓存和界面菜单
        saveOneItem(item);
        // 修改界面
        listMenu.addItem2Tab("cus", item);
        return item;
      });
    },
    getList() {
      return allItemInfoList;
    }
  };
});
