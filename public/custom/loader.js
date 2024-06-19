// 私有组件加载器
define([
  "LS", "com/set", "com/gconf"
], function (LS, SET, gConf) {
  var slice = Array.prototype.slice;
  var fixOneItem = function (fileUrl, itemObj) {
    var prop = itemObj ? itemObj.prototype : null;
    if (!prop || !prop.name || !prop.NAME) {
      console.error("私有模块缺少必要字段：", itemObj || fileUrl);
      return {
        err: "私有组件(" + fileUrl + ")格式错误！"
      };
    }
    // 强制转化为小写，并替换问题字符
    prop.name = prop.name.toLowerCase().replace(/\./g, "-");
    // 检查命名是否包含命名空间
    if (!/^\w+-[\w-]+$/.test(prop.name)) {
      console.error("私有模块命名错误(" + prop.name + ")，请添加前缀，格式：project-itemName");
      return {
        err: "私有模块命名(" + prop.name + ")缺少前缀！"
      };
    }
    // 强制设置为私有模块
    prop.group = "cus";
    // 兼容处理图标设置
    prop.icon = prop.icon.replace(/^icon-/i, "");
    // 添加私有标志
    prop.customFile = fileUrl;
    // 返回
    return itemObj;
  };
  // 是否支持私有组件
  var support = gConf.func.customItem;
  var noop = function (value) {
    return function() {
      return Promise.resolve(value);
    }
  };
  return {
    loadOneFile: !support ? noop("") : function (fileUrl) {
      return this.loadFiles([fileUrl]).then(function (itemArr) {
        return itemArr[0]
      });
    },
    loadFiles: !support ? noop([]) : function (items, onlyGetOKItem) {
      return new Promise(function (resolve) {
        if (!Array.isArray(items)) {
          console.error("loadFiles首位参数应该是数组，实际值是：", items);
          return resolve([]);
        }
        if (!items.length) {
          return resolve([]);
        }
        require(items, function () {
          var okItems = [];
          var allItems = [];
          slice.call(arguments, 0).forEach(function (obj, i) {
            var item = fixOneItem(items[i], obj);
            if (!item.err) {
              okItems.push(item);
            }
            allItems.push(item);
          });
          // 按照要求返回不同的内容
          resolve(onlyGetOKItem ? okItems : allItems);
        }, function (err) {
          resolve([]);
          // requirejs 加载失败的文件，比如 404 之类的
          // 仅仅打印出来，不再继续处理
          console.error("加载模块错误：", err.toString(), err.requireModules || []);
        });
      });
    },
    loadAll: !support ? noop([]) : function () {
      // 读取用户配置的私有组件
      var itemsConf = SET.get("items");
      var previewJS = LS.get("customPreview");
      var allItems;
      var lib = this;
      return this.loadFiles(itemsConf ? itemsConf.split('\n') : [])
        .then(function (ret) {
          allItems = ret;
          return previewJS ? lib.loadOneFile(previewJS) : Promise.resolve('');
        }).then(function (item) {
          item && allItems.push(item);
          return allItems;
        });
    }
  }
});
