'use strict';
const express = require("express");
const router = express.Router();
const dataCore = require('./data');
const logCore = require('./log.core');
const custom = require('./custom');
const CONFIG = require('../config.json');

const user = "chaoma@corp.netease.com";
// 检查部分关键字段的格式
["upload", "publish"].forEach(function(key) {
  CONFIG[key].ftp.publicPathPrefix = CONFIG[key].ftp.publicPathPrefix.replace(/[/\\]+$/g, "") + "/";
});

// 为浏览器准备配置数据包含初始化common文件的过程
// 所以需要异步处理
function prepareConfigData(callback) {
  return (req, res) => {
    dataCore.getConfigForBrowser(req.CONFIG)
        .then(config => callback(req, res, config, user, name))
        .catch(e => {
          res.status(500).render('view/error', {
            error: "Wo Cao",
            desc: e || "服务器出现异常错误，暂时无法访问。"
          });
        });
  }
}

// 导出路由
module.exports = function (configs) {
  // 增加全局项目标志引用
  router.use(function (req, res, next) {
    req.project = CONFIG.id;
    req.CONFIG = CONFIG;
    next();
  });

  // 浏览器不支持
  router.get("/please/update", function (req, res) {
    res.render('view/error', {
      error: '请升级',
      desc: 'PageMaker所需要的一些浏览器特性，您当前的浏览器并未支持。<br>请升级浏览器或更换最新版Chrome浏览器。',
      home: false
    });
  });

  // 兼容老版本私有组件访问路径
  router.get("/open/pageMaker/customCode/:item.js", function (req, res) {
    custom.getJS(req, res, true);
  });
  router.get("/customCode/:item.js", function (req, res) {
    custom.getJS(req, res);
  });

  // 后续的接口定义都需要登录校验，不需要登录校验的写到上面
  // 初始化项目公共文件
  router.get('/reload', function (req, res, next) {
    dataCore.checkCommonFile(req.CONFIG, true).then(function () {
      res.redirect("/");
    }, function () {
      res.redirect("/");
    });
  });
  // 项目主页
  router.get('/', function (req, res) {
    prepareConfigData((req, res, config, user, name) => {
      res.render("view/index", {
        config: config
      });
    })(req, res);
  });

  // 发布日志页面
  router.get('/log', prepareConfigData((req, res, config) => {
    res.render("view/log", Object.assign(
      logCore.getProjectLog(req.CONFIG), {
        NAME: req.CONFIG.NAME
      }
    ));
  }));

  // 在线编写私有组件
  router.get('/custom', prepareConfigData((req, res, config) => {
    res.render("view/custom", {
      config: config
    });
  }));

  // 404错误页
  router.all('/*', function (req, res) {
    res.status(404).render('view/error.ejs');
  });

  // 返回主路由
  return router;
}
