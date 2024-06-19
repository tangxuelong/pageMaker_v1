/*
 * pageMaker
 */
'use strict';

const pkConfig = require('./package.json');
const release = require('./release');

// 通过启动脚本参数修改环境变量
process.env.NODE_ENV = process.argv.indexOf("--production") > 0 ? 'production' : 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 在线环境自动启动编译
if (isProduction) {
  release.start();
}

// 全配置化启动服务器，详细参数见 commonServer.js 顶部注释
require("./core.node/commonServer")({
  "name": pkConfig.name,
  "Name": pkConfig.description,
  "port": 8018,
  "root": __dirname,
  "statics": {
    "/public": isProduction ? ['./dist', './public'] : "./public",
    "/online": "./online",
    "/files": "./files",
    "*": isProduction ? ['./dist', "./core.public", "./public"] : ["./core.public", "./public"]
  },
  "dbRoot": "pageMaker",
  "middlewares": function (app, configs) {},
  "routes": function (mainRouter, configs) {
    // 接口路由
    mainRouter.use("/api", require("./server/routes.api")(configs));
    // 页面路由
    mainRouter.use(require("./server/routes.page")(configs));
  },
  "engine": "ejs",
  "views": "./server"
});
