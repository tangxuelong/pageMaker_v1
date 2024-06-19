'use strict';

/**
 * pageMaker发布日志相关模块
 */
const path = require("path");
const fs = require('fs');
const maxLog = 5000;
// 读取日志目录
const dbCache = {};
// 获取一个数据库对象
function loadDB(dbName, def) {
  let db = dbCache[dbName];
  if (!db) {
    // 此处是兼容数据迁移代码，即：一旦启用新程序，就在初始化的时候迁移一次老日志数据
    // 等所有老项目下线后，就可以删除这个逻辑
    let newLogFile = path.join(NFOP.root, "../files/data/pageMaker/" + dbName + ".log");
    let oldLogFile = path.join(NFOP.root, "../files/data/pageMaker-log/" + dbName + ".json");
    if (!fs.existsSync(newLogFile) && fs.existsSync(oldLogFile)) {
      def = JSON.parse(fs.readFileSync(oldLogFile).toString());
    }
    // 读取日志内容
    db = dbCache[dbName] = NFOP.myDB.loadSync(dbName + ".log", def);
  }
  return db;
}

// 导出日志写入方法
module.exports = function (configData, publishData) {
  if (!configData || !publishData) {
    return;
  }
  // 测试页面不记录发布日志
  if (publishData.fld.indexOf("test") === 0) {
    return;
  }
  // 准备日志数据
  let logData = {
    userDesc: publishData.userDesc,
    pubFld: publishData.fld,
    isCoverOldFile: publishData.isCoverOldFile,
    backupKey: publishData.backupKey,
    hasKey: Boolean(publishData.pubpsw || publishData.cfmpsw),
    isNewKey: Boolean(publishData.newpsw),
    time: publishData.__finishTime,
    repub: publishData.repub
  };

  // ======= 用户发布日志 ===========
  let logdb = loadDB(configData.id, []);
  let logjson = logdb.get().splice(0, 0, logData);
  logjson.length = Math.min(maxLog, logjson.length);
  logdb.storeSync();

  // ========= 时间日志统计 ===========
  (function () {
    let db = loadDB(configData.id + "_time", {});
    let timeLog = db.get();
    let today = new Date();
    let timeKey = [today.getFullYear(), today.getMonth() + 1, today.getDate()].join("-");
    let hours = today.getHours();
    let week = today.getDay();
    // 记录今天发布的目录
    timeLog[timeKey] = timeLog[timeKey] || [];
    timeLog[timeKey].push(publishData.fld);
    // 记录星期、时段发布的数量
    timeLog.week = timeLog.week || [0, 0, 0, 0, 0, 0, 0];
    timeLog.week[week]++;
    timeLog.hours = timeLog.hours || (function () {
      // var arr = "0".repeat(24).split("");
      var arr = [];
      for (var i = 0; i < 24; i++) {
        arr.push(0);
      }
      return arr;
    })();
    timeLog.hours[hours]++;
    // 2017-05-25 马超增加weekHours数据，以进一步细化数据时间分布
    if (!timeLog.weekHours) {
      timeLog.weekHours = (function () {
        var w = [];
        var h;
        for (let i = 0; i < 7; i++) {
          h = [];
          for (let j = 0; j < 24; j++) {
            h.push(0);
          }
          w.push(h);
        }
        return w;
      })();
    }
    timeLog.weekHours[week][hours]++;
    // 保存
    db.storeSync();
  })();

  // ========= 组件使用统计 ===========
  // 2017-1-1 马超 增加
  (function () {
    let db = loadDB(configData.id + "_item", {});
    let itemLog = db.get();
    let json = JSON.parse(publishData.json);
    // 检查配置文件
    json && json.forEach && json.forEach(function (data) {
      itemLog[data.k] = itemLog[data.k] || 0;
      itemLog[data.k]++;
    });
    db.storeSync();
  })();

  // ========= 页面信息统计 ===========
  (function () {
    let db = loadDB(configData.id + "_page", {});
    let pageLog = db.get();
    let json = JSON.parse(publishData.json);
    // 检查配置文件
    if (!json || !json.forEach) {
      return;
    }
    var info = pageLog[publishData.fld] = {};
    info.img = configData.upload.maxImageWidth;
    info.items = {};
    json.forEach(function (data) {
      if (data.k === "meta") {
        info.title = data.c.title || data.c.keywords || data.c.description;
        info.author = publishData.userDesc;
        info.time = Number(publishData.backupKey);
      } else {
        info.items[data.k] = (info.items[data.k] || 0) + 1;
      }
    });
    db.storeSync();
  })();
};

// 获取日志数据
module.exports.getProjectLog = function (configData) {
  let db = loadDB(configData.id, []);
  return {
    maxLog: maxLog,
    data: db.getCopy()
  };
};

// 当前项目的所有页面的信息
module.exports.getPageInfoData = function (configData, fld) {
  if (!configData || !configData.id || !fld) {
    return;
  }
  let db = loadDB(configData.id + "_page", {});
  return db.getCopy(fld);
};

// 根据条件查询发布页面
module.exports.searchPageLog = function (configData, queryBody) {
  let db = loadDB(configData.id + "_page", {});
  let allPageInfo = db.get();
  // 兼容处理参数
  queryBody.startTime = new Date(queryBody.startTime || "2000-1-1");
  queryBody.endTime = new Date(queryBody.endTime || Number(new Date()));
  if (queryBody.repubItem && !Array.isArray(queryBody.repubItem)) {
    queryBody.repubItem = [queryBody.repubItem];
  }
  queryBody.repubItem = queryBody.repubItem || "*";
  queryBody.logicOR = queryBody.logic === "or";
  // 查询
  return new Promise((resolve, reject) => {
    let list = [];
    for (let page in allPageInfo) {
      let info = allPageInfo[page];
      let pubTimeString = String(info.time);
      let pubTime = new Date(
        pubTimeString.slice(0, 4),
        Number(pubTimeString.slice(4, 6)) - 1,
        pubTimeString.slice(6, 8),
        pubTimeString.slice(8, 10),
        pubTimeString.slice(10, 12),
        pubTimeString.slice(12, 16)
      );
      let pageObj = {
        title: info.title,
        author: info.author,
        time: Number(pubTime),
        fld: page
      };
      if (pubTime >= queryBody.startTime && pubTime <= queryBody.endTime) {
        if (queryBody.repubItem === "*") {
          list.push(pageObj);
        } else if (queryBody.logicOR) {
          let ok = false;
          queryBody.repubItem.forEach(function (item) {
            if (info.items[item]) {
              ok = true;
            }
          });
          ok && list.push(pageObj);
        } else {
          let ok = true;
          queryBody.repubItem.forEach(function (item) {
            if (!info.items[item]) {
              ok = false;
            }
          });
          ok && list.push(pageObj);
        }
      }
    }
    // 返回
    list.length ? resolve(list.sort((a, b) => b.time - a.time)) : reject("没有查询匹配的页面信息。");
  });
};
