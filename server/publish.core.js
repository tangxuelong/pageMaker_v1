'use strict';
/**
 * 上传发布核心模块
 */
const path = require('path');
const fs = require('fs');
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");
const serverPush = require('../core.node/serverPush');
const notifyCore = NFOP.notify;
const migrate = require('./data.migrate');
const console = NFOP.getMyConsole("publish.core");
const safeRegStr = require('../core.node/utils').safeRegStr;
// 创建压缩器
const cleanCss = new CleanCSS();

// 对外发布接口
module.exports = function (configData, publishData) {
  // 老版本数据兼容和迁移
  console.log("start migrate ...");
  return migrate.uploadFiles(configData, publishData)
    .then(fixedData => {
      if (fixedData && fixedData.json && fixedData.html) {
        publishData.json = fixedData.json;
        publishData.html = fixedData.html;
        publishData.__jsonChange = true;
      }
      console.log("migrate over ...");
      return pubCore(configData, publishData);
    });
};

// 发布核心函数
function pubCore(configData, publishData) {
  return new Promise((resolve, reject) => {
    // 处理html代码，全局变量替换
    let htmlFile = replaceGolbalVars(publishData.html, publishData);
    console.log("replace gvar over ...");

    // 分析html，合并js和css资源
    htmlFile = concatResource(htmlFile);
    console.log("concatResource over ...");

    // 将内嵌的CSS和JS进行压缩
    htmlFile = minifyInlineResource(htmlFile);
    console.log("minifyInlineResource over ...");

    // 分析资源合并列表
    let HolderID = 1;
    let allJob = [];
    htmlFile = htmlFile.replace(/<link rel="stylesheet" href="(\/online\/[^"]+)"\/>/g, function (m, css) {
      // 删除css引用后的参数，并转化为数组
      let arr = css.replace(/\.css\?[^,$]+/g, ".css").split(",");
      let key = "comboCSS" + HolderID++;
      if (configData.func.inlineCss) {
        // 创建上传任务
        allJob.push(makeOneInlineCssJob(configData, arr, key, publishData.userDesc));
        // 返回占位码
        return '<style>{' + key + '}</style>';
      } else {
        // 创建上传任务
        allJob.push(makeOneUploadJob(configData, arr, key, ".css", publishData.userDesc));
        // 返回占位码
        return '<link rel="stylesheet" href="{' + key + '}"/>';
      }
    });
    htmlFile = htmlFile.replace(/script src="(\/online\/[^"]+)"/g, function (m, js) {
      // 删除js引用后的参数，并转化为数组
      let arr = js.replace(/\.js\?[^,$]+/g, ".js").split(",");
      let key = "comboJS" + HolderID++;
      // 创建上传任务
      allJob.push(makeOneUploadJob(configData, arr, key, ".js", publishData.userDesc));
      // 返回占位码
      return 'script src="{' + key + '}"';
    });

    // 等所有子任务完成后
    console.log("start upload cdn files ...");
    Promise.all(allJob)
      .then(rets => {
        console.log("all cdn files upload over ...");
        // 全部资源上传完毕后修改html代码
        rets.forEach(ret => {
          htmlFile = htmlFile.replace(new RegExp("\\{" + ret.key + "\\}", "g"), ret.url || ret.data);
        });
        console.log("html is ready ...");
        // 写回参数对象
        publishData.html = htmlFile;
        // 立即开始发布
        console.log("start push ...");
        return publishNow(configData, publishData)
          .then(url => resolve(url));
      }).catch(e => {
        console.log("cdn files upload error:", e);
        // 文件合并或上传出错或发布出错
        reject(e);
      });
  })
};

// 处理全局变量
function replaceGolbalVars(htmlFile, publishData) {
  return htmlFile
    .replace(/\$pubFld\$/g, publishData.fld)
    .replace(/\$pubKey\$/g, publishData.backupKey);
}

// 拼接js和css
function concatResource(htmlFile) {
  // 分析html，合并js和css资源，所有的online资源都在online目录下
  // 已经推送到ftp的资源不再处理保持原样
  let cssReplaceReg = /rel="stylesheet" href="(\/online\/[^"]+)"\/><link rel="stylesheet" href="\/online\//;
  let jsReplaceReg = /script src="(\/online\/[^"]+)"><\/script><script src="\/online\//;
  // 查找相邻的js和css
  // 这里合并文件的前提是：css文件都确定在同一个目录
  // 这个合并逻辑不具有通用性，仅仅适用当前业务
  while (cssReplaceReg.test(htmlFile)) {
    htmlFile = htmlFile.replace(cssReplaceReg, 'rel="stylesheet" href="$1,/online/');
  }
  while (jsReplaceReg.test(htmlFile)) {
    htmlFile = htmlFile.replace(jsReplaceReg, 'script src="$1,/online/');
  }
  return htmlFile;
}

// 压缩内嵌样式和脚本
function minifyInlineResource(htmlFile) {
  return htmlFile.replace(/<style mini>([\d\D]+?)<\/style>/g, function (str, css) {
    let miniStyle = cleanCss.minify(css).styles;
    return miniStyle ? "<style>" + miniStyle + '</style>' : str;
  }).replace(/<script mini>([\d\D]+?)<\/script>/g, function (str, js) {
    let miniCode = UglifyJS.minify(js).code;
    return miniCode ? "<script>" + miniCode + '</script>' : str;
  });
}

// 上传样式表引用的内嵌文件（比如字体文件）
function uploadFilesInCssFile(configData, cssCode, needReplease) {
  // 分析CSS文件中引用的相对路径的资源
  let waitUpload = [];
  cssCode.replace(/url\(['"]*([^)]+)['"]*\)/, function (str, file) {
    if (/^(data:|http:|https:|\/)/.test(file)) {
      return;
    }
    // 固定目录下查找css文件相关资源
    let filePath = path.join(NFOP.root, "online/css", file.replace(/\?.*$/, ""));
    if (!fs.existsSync(filePath)) {
      return;
    }
    waitUpload.push({
      key: file,
      filename: path.basename(filePath),
      target: path.dirname(file),
      buffer: fs.readFileSync(filePath)
    });
  });
  // 没有需要处理的
  if (!waitUpload.length) {
    return Promise.resolve(cssCode);
  }
  // 如果是内嵌样式（即修改CSS内容）则需要将CSS文件上传到主服务器上
  if (needReplease) {
    return serverPush(configData.publish.ftp)
      .pushBuffers(waitUpload, "static-css")
      .then(function (retArr) {
        // console.log("uploadFilesInCssFile over ...");
        retArr.forEach((url, i) => {
          cssCode = cssCode.replace(new RegExp(safeRegStr(waitUpload[i].key), "g"), url)
        });
        return cssCode
      }, e => {
        // console.log("uploadFilesInCssFile err ...");
        return cssCode
      });
  }
  // 提取文件上传到CDN，不修改CSS源码
  return serverPush(configData.upload.ftp)
    .pushBuffers(waitUpload, "static-css")
    .then(function (retArr) {
      return cssCode
    }, e => {
      return cssCode
    });
}

// 创建一个子任务，用于将CSS文件内嵌
function makeOneInlineCssJob(configData, fileList, key, userDesc) {
  return new Promise((resolve, reject) => {
    // 读取所有文件
    let combofileContent = [];
    let errors = [];
    fileList.forEach(function (onlineFile) {
      let filePath = path.join(NFOP.root, onlineFile.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        return errors.push("资源文件" + onlineFile + "未找到");
      }
      combofileContent.push(fs.readFileSync(filePath).toString());
    });
    if (errors.length) {
      combofileContent.length = 0;
      // 系统错误报警
      console.warn([
        "人员：", userDesc, '<br>',
        '事件：online样式表丢失', '<br>',
        "信息：", errors.join("、")
      ].join(''));
      return reject(errors.join("、"));
    }
    // 压缩CSS文件
    let cssCode = cleanCss.minify(combofileContent.join('')).styles;
    uploadFilesInCssFile(configData, cssCode, true)
      .then(function (cssCode) {
        // 返回
        resolve({
          key: key,
          data: cssCode
        });
      });
  });
}

// 创建一个子任务，用于将指定的文件合并、上传
function makeOneUploadJob(configData, fileList, key, extname, userDesc) {
  var jobID = Math.random().toString(16).slice(-4);
  return new Promise((resolve, reject) => {
    // 读取所有文件
    let combofileContent = [];
    let errors = [];
    fileList.forEach(function (onlineFile) {
      let filePath = path.join(NFOP.root, onlineFile.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        return errors.push("资源文件" + onlineFile + "未找到");
      }
      combofileContent.push(fs.readFileSync(filePath).toString());
    });
    if (errors.length) {
      combofileContent.length = 0;
      // 系统错误报警
      console.warn([
        "人员：", userDesc, '<br>',
        '事件：合并online文件丢失', '<br>',
        "信息：", errors.join("、")
      ].join(''));
      return reject(errors.join("、"));
    }
    // 进行合并压缩
    let waitUpload = [];
    switch (extname) {
      case ".css":
        // 压缩CSS文件
        let cssCode = cleanCss.minify(combofileContent.join('')).styles;
        waitUpload.push({
          extname: extname,
          buffer: new Buffer(cssCode)
        });
        // 分析CSS文件中引用的相对路径的资源
        cssCode.replace(/url\(['"]*([^)]+)['"]*\)/, function (str, file) {
          if (/^(data:|http:|https:|\/)/.test(file)) {
            return;
          }
          // 固定目录下查找css文件相关资源
          let filePath = path.join(NFOP.root, "online/css", file.replace(/\?.*$/, ""));
          if (!fs.existsSync(filePath)) {
            errors.push("资源文件/online/css/" + file + "未找到");
            return;
          }
          // 由于资源文件基本上不会修改，所以
          // 上传的资源文件不修改名称和路径
          // 这样可以保持css文件内容不做修改
          waitUpload.push({
            filename: path.basename(filePath),
            target: path.dirname(file),
            buffer: fs.readFileSync(filePath)
          });
        });
        if (errors.length) {
          combofileContent.length = 0;
          // 系统错误报警
          console.warn([
            "人员：", userDesc, '<br>',
            '事件：CSS文件引用的资源丢失', '<br>',
            "信息：", errors.join("、")
          ].join(''));
          return reject(errors.join("、"));
        }
        break;
      case ".js":
        // 压缩JS文件
        let jsCode = UglifyJS.minify(combofileContent.join(";")).code;
        waitUpload.push({
          extname: extname,
          buffer: new Buffer(jsCode)
        });
        break;
    }
    // 静态资源立刻上传服务器
    // 上传到固定目录以最大化利用缓存
    serverPush(configData.upload.ftp)
      .pushBuffers(waitUpload, "static-" + extname.slice(1))
      .then(function (retArr) {
        resolve({
          key: key,
          url: retArr[0]
        });
      }).catch(e => {
        reject("上传文件失败：<br>" + e);
        // 报警通知
        notifyCore(configData.publish.alert, [
          "人员：", userDesc, '<br>',
          "事件：发布失败", '<br>',
          "错误：文件上传失败", '<br>',
          "描述：", e
        ].join(''), {
          type: "publish-uploadError",
          data: {
            err: "上传文件失败",
            user: userDesc,
            desc: e
          }
        });
      });
  });
}

// 发布推送
function publishNow(configData, publishData) {
  // 发布服务器
  let SP = serverPush(configData.publish.ftp);

  // 需要发布的数据：三个文件
  const publishBufferData = [{
    // 入口文件
    filename: "index.htm",
    buffer: new Buffer(publishData.html)
  }, {
    // 配置文件
    filename: "index.json",
    buffer: new Buffer(publishData.json)
  }, {
    // 备份配置文件
    filename: "index-" + publishData.backupKey + ".json",
    buffer: new Buffer(publishData.json)
  }];

  // 上传
  return SP.pushBuffers(publishBufferData, publishData.fld)
    .then(function (retArr) {
      publishData.__finishTime = Number(new Date());
      // 发布完成通知
      setTimeout(function () {
        publishNotify(configData, publishData);
      }, 100);
      // 仅仅返回入口文件的访问地址即可
      return retArr[0];
    });
}

// 发布通知
function publishNotify(configData, publishData) {
  let hasKey = Boolean(publishData.pubpsw || publishData.cfmpsw);
  notifyCore(configData.publish.notify, [
      "人员：", publishData.userDesc, "<br>",
      "地址：", publishData.__pubIndexPage + "<br>",
      "特征：", [
        publishData.isCoverOldFile ? "覆盖发布" : "新页面发布",
        hasKey ? "有密码" : "无密码"
      ].join("、")
    ].join(""), {
      type: "publish-ok",
      data: {
        user: publishData.userDesc,
        url: publishData.__pubIndexPage,
        isCoverOldFile: publishData.isCoverOldFile,
        hasKey: hasKey,
        isNewKey: Boolean(publishData.newkey),
        time: publishData.__finishTime
      }
    },
    // 如果通知出现错误，则报警
    function (err, desc) {
      // 如果报警通知错误不再继续跟踪
      notifyCore(configData.publish.alert, [
        "事件：发布通知错误",
        "错误：", err,
        "描述：", desc
      ].join(""), {
        type: 'publish-notifyError',
        data: {
          err: err,
          desc: desc
        }
      })
    });
}
