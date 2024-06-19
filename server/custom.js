'use strict';
/**
 * 私有组件发布
 */
const path = require('path');
const fs = require('fs');
const fileSavePath = path.join(NFOP.root, "../files/data/custom-code/");
const needle = require('needle');
const waterfall = require('../core.node/utils').waterfall;
const MD5 = require('md5');
const dir = require('../core.node/tools.dir');
const UglifyJS = require("uglify-js");
const SUPER_KEY = MD5("anykey");

// 获取私有模块的js
module.exports.getJS = function (req, res, oldFile, ext) {
  let item = req.params.item;
  let project = req.CONFIG.id;
  let fileExt = ext || ".js";
  if (!item) {
    res.status(404).send('can not find files');
    return;
  }
  let jsFile = path.join(fileSavePath, project + "@" + item + "/x" + fileExt);
  if (oldFile) {
    jsFile = path.join(fileSavePath, item + "/x" + fileExt);
  }
  if (!fs.existsSync(jsFile)) {
    res.status(404).send('console.log("can not find file:' + item + fileExt + '");');
    return;
  }
  res.sendFile(jsFile);
};

// 获取私有组件模板
module.exports.getTmpl = function (req, res) {
  var jsFile = path.join(NFOP.root, "public/custom/tmpl.js");
  if (!fs.existsSync(jsFile)) {
    res.status(404).send('console.log("can not find tmpl file.");');
    return;
  }
  // 修改header防止被当做js模块解析
  res.setHeader("Content-Type", "application/octet-stream");
  res.sendFile(jsFile);
};

// 获取私有组件内容
module.exports.getCode = function (req, callback) {
  let name = req.query.name;
  let project = req.CONFIG.id;
  if (!name) {
    return callback({
      err: 1,
      desc: "参数错误"
    })
  }
  // 新旧版私有组件路径检测
  // 旧版路径：/open/pageMaker/customCode/xxx.js
  // 新版路径：/customCode/xxx.js
  if (/^\/open\/pageMaker\/customCode\/(.+?)\.js$/.test(name)) {
    name = RegExp.$1;
  }
  if (/^\/customCode\/(.+?)\.js$/.test(name)) {
    name = RegExp.$1;
  }

  // 检查是否是为url地址
  let remotejs;
  let json;
  switch (true) {
    // 先处理绝对路径的情况
    case /^https*:\/\//i.test(name):
      remotejs = name;
      break;
    case /^\/\//.test(name):
      remotejs = "http:" + name;
      break;
    default:
      json = path.join(fileSavePath, project + "@" + name + "/x.json");
      // 新版组件不存在，则查找旧版组件
      if (!fs.existsSync(json)) {
        json = path.join(fileSavePath, name + "/x.json");
        if (!fs.existsSync(json)) {
          json = null;
        }
      }
  }
  if (!remotejs && !json) {
    return callback({
      err: 2,
      desc: "错误的组件名称，无法找到源码或配置。"
    });
  }

  // 如果有json文件，表示是内部代码，直接处理
  if (json) {
    var data = fs.readFileSync(json).toString();
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = null;
    }
    if (!data) {
      return callback({
        err: 3,
        desc: "配置数据错误，无法导入！"
      });
    }
    // 兼容旧版json配置: 数组 [{k, c: {fulljs, ...}, lastUpdate}, ...]
    // 新版格式 {code, NAME, lastUpdate}
    return callback({
      err: 0,
      data: Array.isArray(data) ? data[0].c.fulljs : data.code
    })
  }
  // 获取远程js内容
  needle.get(remotejs, (err, res) => {
    if (err) {
      return callback({
        err: 4,
        desc: "组件加载失败（" + res.statusCode + "）"
      });
    }
    callback({
      err: 0,
      data: res.body.toString()
    });
  });
};

// 预览 & 发布
module.exports.pusblish = function (req, user, name, callback) {
  waterfall(next => {
    // 准备参数
    var para = {
      project: req.CONFIG.id,
      name: req.body.name.toLowerCase(),
      NAME: req.body.NAME,
      code: req.body.code,
      preview: req.body.preview === "true"
    };
    if (!para.code || !para.name || !para.NAME) {
      return next(1, "参数错误");
    }
    // 严格检查name的格式
    if (!/^\w+-[\w-]+$/.test(para.name)) {
      return next(1, "组件名称格式错误或含有非法字符");
    }
    // 如果是正式发布
    if (!para.preview) {
      para._key = req.body.key;
      para.key = MD5(req.body.key);
      para.newkey = req.body.newkey;
      if (!para.key) {
        return next(1, "参数错误");
      }
      // 拼接json内容
      para.json = {
        NAME: para.NAME,
        code: para.code,
        lastUpdate: [user, name, Number(new Date())]
      };
    }
    // 继续下一步
    next(null, para);
  }, (para, next) => {
    // 检查发布口令
    if (para.preview) {
      return next(null, para);
    }
    // 检查新旧版私有组件
    // 旧版组件不含有项目信息，需要保持原有路径以保持可用可更新
    let oldFileFld = path.join(fileSavePath, para.name + "/");
    // 新版私有组件目录，增加项目前缀，以相互隔离私有组件
    let newFileFld = path.join(fileSavePath, para.project + "@" + para.name + "/");
    // 如果旧组件目录存在，则继续按照旧组件方式编写
    if (fs.existsSync(oldFileFld)) {
      para.isOld = true;
      para.codeFld = oldFileFld;
    } else {
      para.codeFld = newFileFld;
      // 创建目录
      dir.mkdirsSync(para.codeFld);
    }
    next(null, para);
  }, (para, next) => {
    // 检查发布口令
    if (para.preview) {
      return next(null, para);
    }
    var keyFile = path.join(para.codeFld, "x.key");
    if (!fs.existsSync(keyFile)) {
      // 首次提交创建口令
      fs.writeFileSync(keyFile, para.key);
      return next(null, para);
    }
    // 校验口令
    if (fs.readFileSync(keyFile).toString() === para.key || SUPER_KEY === para.key) {
      // 检查新口令是否设置
      if (!para.newkey) {
        return next(null, para);
      }
      para._key = para.newkey;
      fs.writeFileSync(keyFile, MD5(para.newkey));
      return next(null, para);
    }
    next(2, "口令错误，请重试");
  }, (para, next) => {
    // 保存json文件
    if (para.preview) {
      return next(null, para);
    }
    fs.writeFileSync(path.join(para.codeFld, "x.json"), JSON.stringify(para.json));
    next(null, para);
  }, (para, next) => {
    // 保存code文件，预览保存的地址为临时目录
    if (para.preview) {
      let fileTmpSavePath = "../files/tmp/custom-code/";
      let tmpJS = "fe-" + user.replace(/@.+$/g, "").toLowerCase() + ".js";
      // 检查目录并创建
      dir.mkdirsSync(path.join(NFOP.root, fileTmpSavePath));
      // 写入文件
      fs.writeFileSync(path.join(NFOP.root, fileTmpSavePath + tmpJS), para.code);
      // 返回可访问路径(添加随机参数)
      para.codeFile = "/files/tmp/custom-code/" + tmpJS + "?" + Math.random().toString(36).slice(2);
      return next(null, para);
    }
    // 正式发布保存混淆压缩后的code
    fs.writeFileSync(path.join(para.codeFld, "x.js"), UglifyJS.minify(para.code).code);
    // 返回资源路径地址
    if (para.isOld) {
      para.codeFile = "/open/pageMaker/customCode/" + para.name + ".js";
    } else {
      para.codeFile = "/customCode/" + para.name + ".js";
    }
    next(null, para);
  }, (err, paraOrDesc) => {
    if (!err) {
      // 发送popo消息，不处理通知结果
      if (!paraOrDesc.preview) {
        setTimeout(function () {
          NFOP.popo(user, "[pageMaker][customCode] " + paraOrDesc.name + "(" + paraOrDesc._key + ")");
        }, 100);
      }
      // ajax完成
      return callback({
        err: 0,
        data: paraOrDesc.codeFile
      });
    }
    callback({
      err: err,
      desc: paraOrDesc
    });
  });
};

// 组件列表
module.exports.list = function (req, callback) {
  let project = req.CONFIG.id;
  let pubItems = [];
  let priItems = [];
  fs.readdir(fileSavePath, function (e, files) {
    files.forEach(function (fldName) {
      var filePath = path.join(fileSavePath, fldName, "/x.json");
      if (fs.existsSync(filePath)) {
        var info = JSON.parse(fs.readFileSync(filePath).toString());
        // 补充最近更新信息
        info.lastUpdate = info.lastUpdate || (function () {
          let info = fs.statSync(path.join(fileSavePath, fldName, "/x.key"));
          // 返回文件最后一次修改时间
          return ["", "", Number(new Date(info.mtime))]
        })();
        if (fldName.indexOf("@") < 0) {
          // 没有指定项目的组件被当做公共组件
          pubItems.push({
            name: fldName,
            NAME: info.NAME,
            lastUpdate: info.lastUpdate
          });
        } else if (fldName.indexOf(project + "@") === 0) {
          // 检查是否为当前项目的私有组件
          priItems.push({
            name: fldName.split("@")[1],
            NAME: info.NAME,
            lastUpdate: info.lastUpdate
          });
        }
      }
    });
    callback({
      private: priItems,
      public: pubItems
    });
  });
};

// 删除组件
module.exports.del = function (req, user, name, callback) {
  let item = req.params.name;
  let sure = req.query.yes;
  // 硬编码写死，只能一个人控制私有组件删除权限
  if (!item || user !== "chaoma@corp.netease.com") {
    return callback({
      err: 1,
      desc: "权限不足或参数错误"
    })
  }
  let fld = path.join(fileSavePath, item);
  if (!fs.existsSync(fld)) {
    return callback({
      err: 2,
      desc: "参数错误"
    })
  }
  // 查看js文件信息
  let info = fs.statSync(path.join(fld, "/x.js"));
  if (sure === undefined) {
    return callback({
      err: 0,
      data: info
    });
  }
  // 确定要删除
  dir.rmdirSync(fld);
  callback({
    err: 0
  });
};
