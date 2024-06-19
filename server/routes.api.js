'use strict';
const express = require("express");
const router = express.Router();
const dataCore = require('./data');
const upload = require('./upload');
const publish = require('./publish');
const logCore = require('./log.core');
const custom = require('./custom');
const CONFIG = require('../config.json');

const user = "chaoma@corp.netease.com";
const name = "chaoma@corp.netease.com";
// 导出API路由
module.exports = function (configs) {
  // 增加全局项目标志引用
  router.use(function (req, res, next) {
    req.project = CONFIG.id;
    req.CONFIG = CONFIG;
    next();
  });

  // 上传接口
  router.post("/upload", function (req, res) {
    upload(req.CONFIG, req, user, name).then(function (data) {
      res.json({
        err: 0,
        data: data
      });
    }).catch(e => {
      res.json({
        err: 1,
        desc: e
      })
    });
  });

  // 读取已有的配置，不需要登录
  router.get("/load/config", function (req, res) {
    dataCore.loadOnlineConfig(req.query.path, req.query.key, req)
      .then(bodyStr => {
        res.json({
          err: 0,
          data: bodyStr
        })
      }).catch(e => {
        res.json({
          err: 1,
          desc: e
        })
      });
  });

  // 检查目录是否已经被使用
  router.get('/check/path', function (req, res) {
    dataCore.checkPath(req.CONFIG, req.query.path, req)
      .then(() => {
        res.json({
          err: 0
        })
      }).catch(e => {
        res.json({
          err: 1,
          desc: "目录已经存在"
        })
      });
  });

  // 发布页面
  router.post('/publish', function (req, res) {
    publish(req.CONFIG, req.body, user, name)
        .then(data => {
          res.json({
            err: 0,
            data: data
          })
        }).catch(e => {
          res.json({
            err: 1,
            desc: e
          });
        })
  });

  // 查询已经发布的页面
  router.post('/search/page', function (req, res) {
    logCore.searchPageLog(req.CONFIG, req.body)
      .then(list => {
        res.json({
          err: 0,
          data: list
        })
      }).catch(desc => {
        res.json({
          err: 1,
          desc: desc
        })
      });
  });

  // 读取私有组件模板
  router.get('/custom/tmpl', function (req, res) {
    custom.getTmpl(req, res);
  });

  // 读取指定的私有组件内容
  router.get('/custom/code', function (req, res) {
    custom.getCode(req, ret => res.json(ret));
  });

  // 读取指定的私有组件列表
  router.get('/custom/list', function (req, res) {
    custom.list(req, ret => res.json(ret));
  });

  // 删除私有组件（非公开接口）
  router.get('/custom/del/:name', function (req, res) {
    custom.del(req, user, name, ret => res.json(ret));
  });

  // 发布私有组件
  router.post('/custom/publish', function (req, res) {
    custom.pusblish(req, user, name, ret => res.json(ret));
  });

  // 返回路由
  return router;
}
