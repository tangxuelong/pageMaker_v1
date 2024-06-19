'use strict';

// 发布模块
const coreData = require('./data');
const publishCore = require('./publish.core');
const logCore = require('./log.core');
const console = NFOP.getMyConsole("publish");
const waterfall = require('../core.node/utils').waterfall;

module.exports = function (configData, publishData, user, name) {
  if (!configData || !publishData || !publishData.html || !publishData.json || !publishData.fld) {
    return Promise.reject("发布参数错误！");
  }
  let now = new Date();
  return new Promise((resolve, reject) => {
    waterfall(next => {
      console.log("====", now.toLocaleString(), "====");
      console.log(configData.id + "/" + publishData.fld, "by", name, publishData.repub ? " AUTO-REPUB" : "");
      // ======= 准备各个步骤之间传递的数据 ======
      let para = Object.assign(publishData, {
        // 统一用户信息描述
        userDesc: name + "(" + user + ")",
        // 备份码
        backupKey: now.getFullYear() + fillZ(now.getMonth() + 1) + fillZ(now.getDate()) +
          fillZ(now.getHours()) + fillZ(now.getMinutes()) + fillZ(now.getSeconds()),
        // 是否在覆盖时进行警告
        warn: publishData.warn === "1"
      });
      next(null, para);
    }, (para, next) => {
      // 检查发布的用户权限
      // 此处略
      next(null, para);
    }, (para, next) => {
      if (publishData.repub) {
        para.isCoverOldFile = true;
        next(null, para);
        return;
      }
      console.log("check path...");
      // ======= 检查发布目录是否存在 ======
      coreData.checkPath(
        configData, para.fld
      ).then(() => {
        console.log("check path ok...");
        next(null, para);
      }).catch(() => {
        console.log("check path already here...");
        if (para.warn) {
          next(1, "发布目录已经存在，若要覆盖请选择“强制发布”");
        } else {
          para.isCoverOldFile = true;
          next(null, para);
        }
      });
    }, (para, next) => {
      if (publishData.repub) {
        next(null, para);
        return;
      }
      console.log("check page key...");
      // ======= 检查发布口令 ======
      coreData.checkPageKey(configData,
        para.fld, para.cfmpsw, para.pubpsw || para.newpsw
      ).then(() => {
        console.log("check page key ok...");
        // 校验通过并更新了密码
        next(null, para);
      }).catch(e => {
        // 校验失败
        console.log("check page key error, send page info...");
        var curPageInfo = logCore.getPageInfoData(configData, para.fld);
        if (!curPageInfo) {
          return next(2, "发布口令错误。<br>若口令实在无法找回，可以联系管理员重置口令。");
        }
        // 给予页面发布信息提示
        next(4, [
          "发布口令错误。" +
          "最近一次正确发布：",
          curPageInfo.author + " 于 " +
          (function (time) {
            return [
              time.substr(0, 4),
              time.substr(4, 2),
              time.substr(6, 2)
            ].join("-") + " " + [
              time.substr(-6, 2),
              time.substr(-4, 2),
              time.substr(-2)
            ].join(":")
          })(String(curPageInfo.time))
        ].join("<br>"));
      });
    }, (para, next) => {
      console.log("start publish core ...");
      // ======= 发布推送 ======
      publishCore(configData, para)
        .then(url => {
          console.log("publish finish:", url);
          para.__pubIndexPage = url;
          next(null, para);
        }).catch(e => {
          console.log("publish error:", e);
          next(3, "发布失败：<br>" + e);
        });
    }, (para, next) => {
      // ======= POPO通知以及日志记录 ======
      setTimeout(function () {
        NFOP.popo(user, [
          "【pageMaker】",
          "线上地址：" + para.__pubIndexPage,
          "时光机车票：" + para.fld + "#" + para.backupKey
        ].join("\r\n"));
        // 记录日志
        logCore(configData, publishData);
      }, 100);
      next(null, para);
    }, (err, paraOrDesc) => {
      console.log("publish result-err:", err, err ? paraOrDesc : '');
      if (err) {
        reject(paraOrDesc);
      } else {
        resolve({
          url: paraOrDesc.__pubIndexPage,
          cover: paraOrDesc.isCoverOldFile,
          json: paraOrDesc.__jsonChange ? paraOrDesc.json : undefined
        })
      }
    });
  });
}

function fillZ(a) {
  return ("0" + a).slice(-2)
}
