define(["jquery", "LS", "com/set", "com/gconf"], function ($, LS, SET, gConf) {
  // 如果不支持私有组件，则不显示私有组件
  if (!gConf.func.customItem) {
    return {
      load: function() {
        return Promise.resolve([]);
      },
      loadAll: function () {
        return Promise.resolve([]);
      }
    }
  }
  var slice = Array.prototype.slice;
  return {
    load: function (items, onlyGetOKItem) {
      return new Promise(function (resolve) {
        if (!items || !items.length) {
          return resolve([]);
        }
        require(items, function () {
          var okItems = [];
          var allItems = [];
          $.each(slice.call(arguments, 0), function (i, Item) {
            var prop = Item ? Item.prototype : null;
            if (!prop || !prop.name) {
              console.error(Item && Item.err ? "" : "私有模块错误：", Item || items[i]);
              allItems.push({
                err: "私有组件(" + items[i] + ")格式错误！"
              });
              return;
            }
            // 强制转化为小写，并替换问题字符
            prop.name = prop.name.toLowerCase().replace(/\./g, "-");
            // 检查命名是否包含命名空间
            if (!/^\w+-[\w-]+$/.test(prop.name)) {
              console.error("私有模块命名错误(" + prop.name + ")，请添加前缀，格式：project-itemName");
              allItems.push({
                err: "私有模块命名(" + prop.name + ")缺乏前缀！"
              });
              return;
            }
            // 强制设置为私有模块
            prop.group = "cus";
            // 兼容处理图标设置
            prop.icon = prop.icon.replace(/^icon-/i, "");
            // 添加私有标志
            prop.customFile = items[i];
            // 返回
            allItems.push(Item);
            okItems.push(Item);
          });
          // 按照要求返回不同的内容
          resolve(onlyGetOKItem ? okItems : allItems);
        }, function (err) {
          // requirejs 加载失败的文件，比如 404 之类的
          // 仅仅打印出来，不再继续处理
          console.error("加载模块错误：", err.toString(), err.requireModules || []);
        });
      });
    },
    loadAll: function () {
      // 读取用户配置的私有组件
      var itemsConf = SET.get("items");
      var items = itemsConf ? itemsConf.split('\n') : [];
      var previewJS = LS.get("customPreview");
      var lib = this;
      return new Promise(function (resolve, reject) {
        lib.load(items, true).then(function (allItems) {
          if (!previewJS) {
            return resolve(allItems);
          }
          lib.load([previewJS], true).then(function (parr) {
            var previewItem = parr[0];
            var prop = previewItem.prototype;
            if (!prop.isPreviewItem) {
              prop.isPreviewItem = true;
              prop.name += "-PRE";
            }
            allItems.push(previewItem);
            // 返回所有组件
            resolve(allItems);
          });
        });
      });
    }
  };

});
