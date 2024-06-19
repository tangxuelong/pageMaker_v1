'use strict';

/**
 * 通用轻服务器配置
 * 
 * configs 配置对象如下：
 *  name: 服务的英文名称
 *  Name: 服务的中文名称
 *  port: 端口
 *  root: 程序根目录
 *  statics: {  静态资源配置
 *      path: file_or_fileArray
 *  }
 *  dbRoot: 数据库主目录，一般是程序标志
 *  engin: 模板引擎名称
 *  views: 模板目录
 *	middlewares: (app, configs) || [appUsePara1, appUsePara2, ...] 中间件处理函数
 *  routes: (mainRouter, configs) || [routeConf1, routeConf2, ...] 业务路由处理函数
 * 		routeConf：{path: string, router: routerObject}
 * 		routeConf处理方式：mainRouter.use(routeConf.path, routeConf.router);
 *  
 *  //更多配置
 *  globalVarName: "NFOP" 全局变量名称
 *  moreGlabalVars: {} 附加的全局变量
 *  trustProxy: true  是否信任前置代理
 *  xPoweredBy: "nfop" 驱动声明
 *  pageLimit: '50mb' 页面最大容量限制
 * 
 *  //以下是默认添加的全局变量，默认挂接在 golbal.NFOP 上
 *  name: 服务的英文名称,
 *	Name: 服务的中文名称,
 *	root: 程序根目录,
 *	event: 全局事件实例
 *		触发使用 NFOP.event.emit(eventName, para1, para2)
 * 		订阅使用 NFOP.event.on(eventName, function(para1, para2){})
 * 		更多方法请参考 http://nodejs.cn/doc/node_4/events.html
 *	openId: openId模块,
 *	messenger: messenger模块
 *	popo: popo模块,
 *	serverIP: 服务器ip地址
 *	getMyConsole: console模块
 *	isCronServer: 是否为定时任务机器（主机器）
 */
const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const path = require('path');
const dataBase = require('./fileDB');
// const openId = require("./openId");
const popo = require('./popo');
const notify = require('./notify');
const is = require('./utils').is;
const mainDomain = "nfop.ms.netease.com";
const event = new require('events').EventEmitter();

module.exports = function (configs) {
  //========= 处理配置信息 ============
  let Config = Object.assign({
    root: __dirname,
    trustProxy: true,
    globalVarName: "NFOP",
    moreGlabalVars: {},
    xPoweredBy: "nfop",
    pageLimit: "50mb"
  }, configs || {});

  // 处理服务器配置
  let app = initAppConf(Config);

  // 处理全局变量
  initGlobalVar(Config);

  // 处理通用路由
  let mainRouter = initMainRouter(Config);

  // 自定义中间件
  if (is.function(Config.middlewares)) {
    Config.middlewares(app, Config);
  } else if (is.array(Config.middlewares)) {
    Config.middlewares.forEach(function (usePara) {
      usePara && app.use(usePara);
    });
  }

  // 自定义业务路由
  if (is.function(Config.routes)) {
    Config.routes(mainRouter, Config);
  } else if (is.array(Config.routes)) {
    Config.routes.forEach(function (routeConf) {
      if (routeConf && routeConf.router) {
        mainRouter.use(routeConf.path, routeConf.router);
      }
    });
  }

  // 绑定
  app.use(mainRouter);

  // //设置500内部错误，似乎从来没有走到这个流程过。
  // app.use(function (err, req, res, next) {
  // 	console.error(err.stack);
  // 	res.status(500).send('服务器异常！');
  // });
  // 启动服务器
  require('http').createServer(app).listen(Config.port || "8888");

  // 输出启动日志
  let msg = Config.name + " running at " + NFOP.serverIP + ":" + Config.port + ". " + (new Date()).toLocaleString();
  console.log(msg);
};

function initAppConf(Config) {
  let app = require('express')();

  // 设置模板引擎
  Config.engine && app.set('view engine', Config.engine);
  Config.views && Config.root && app.set('views', path.join(Config.root, Config.views));

  // 信任前置nigix代理
  Config.trustProxy && app.set('trust proxy', 1);

  // 设置power-by
  if (Config.xPoweredBy) {
    app.use(function (req, res, next) {
      res.setHeader('X-Powered-By', Config.xPoweredBy);
      next();
    });
  }

  // 设置最大页面和url的容量
  if (Config.pageLimit) {
    app.use(bodyParser.json({
      limit: Config.pageLimit
    }));
    app.use(bodyParser.urlencoded({
      limit: Config.pageLimit,
      extended: true
    }));
  }

  // 使用cookie
  app.use(cookieParser());

  // 设置Session配置，此处不允许自定义配置修改
  app.use(cookieSession({
    name: 'nfop.sess',
    secret: 'some-secret-key-dot-not-change-forever',
    maxAge: 4 * 3600000
  }));
  app.use(function (req, res, next) {
    // 动态修改cookie-sesson写入的域名
    // 根据项目需要处理
    // var host = req.hostname.toLowerCase();
    // if (host.substr(-1 * mainDomain.length) === mainDomain) {
    // 	req.sessionOptions.domain = mainDomain;
    // }
    next();
  });

  // 统一设置登录信息
  app.use(function (req, res, next) {
    res.locals.User = {
      name: "chaoma",
      user: "chaoma@corp.netease.com"
    };
    next();
  });
  return app;
}

function initGlobalVar(Config) {
  // 全局变量和模块引用
  let G = global[Config.globalVarName] = require('./global')(Object.assign({
    name: Config.name,
    Name: Config.Name,
    root: Config.root,
    event: event,
    openId: '',
    notify: notify,
    popo: popo,
    getDataBase: dataBase
  }, Config.moreGlabalVars || {}));

  //创建数据库对象实例，并放入全局对象中
  if (Config.dbRoot) {
    G.myDB = dataBase(Config.dbRoot);
  };
}

function initMainRouter(Config) {
  let mainRouter = express.Router();

  //强制排除服务器端用的数据文件目录和日志目录
  mainRouter.use(['/files/data', '/logs'], function (req, res) {
    res.status(404).send('404');
  });

  // 注册静态资源路径
  if (Config.statics && Config.statics.constructor === Object) {
    let Root = Config.root;
    for (let urlPath in Config.statics) {
      let filePath = Config.statics[urlPath];
      //指定绝对路径指定访问路径
      if (urlPath !== "*") {
        if (is.array(filePath)) {
          filePath.forEach(function (fpath) {
            mainRouter.use(urlPath, express.static(path.join(Root, fpath)));
          });
        } else {
          mainRouter.use(urlPath, express.static(path.join(Root, filePath)));
        }
      } else {
        //否则不指定访问路径
        if (is.array(filePath)) {
          filePath.forEach(function (fpath) {
            mainRouter.use(express.static(path.join(Root, fpath)));
          });
        } else {
          mainRouter.use(express.static(path.join(Root, filePath)));
        }
      }
    }
  }

  return mainRouter;
}
