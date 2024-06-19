'use strict';

// 主功能页面数据
const commonFileDB = NFOP.myDB.loadSync("commonFile.json", {});
const path = require('path');
const fs = require('fs');
const commonFilePath = path.join(NFOP.root, "online/common");
const serverPush = require('../core.node/serverPush');
const needle = require('needle');
const pageKeyDB = NFOP.myDB.loadSync("pageKey.json", {});
const bossKey = "zhimakaimen";
const MD5 = require('md5');
const is = require('../core.node/utils').is;

// 分拣公共文件
const pickCommonFiles = function () {
  // 遍历所有公共文件，并根据文件名进行分类处理上传
  // 以下划线开头的文件需要等其他文件上传完毕后，然后动态修改内容后再上传
  var files = fs.readdirSync(commonFilePath);
  var arr1 = [];
  var arr2 = [];
  files.forEach(function (file, index) {
    var filePath = path.join(commonFilePath, file);
    if (fs.statSync(filePath).isFile()) {
      // 文件必须有文件名和文件类型后缀，否则不处理
      // 以下划线开头的文件属于动态脚本，需要在其他脚本完成上传后动态修改内容
      if (file.indexOf("_") === 0) {
        arr2.push({
          buffer: fs.readFileSync(filePath),
          basename: file,
          extname: path.extname(file)
        });
      } else {
        arr1.push(filePath);
      }
    }
  });
  return [arr1, arr2];
}

// 导出数据
module.exports = {
  // 检查初始化文件
  checkCommonFile(configData, reload) {
    if (!configData) {
      return Promise.reject();
    }
    // 检查是否已经有缓存了
    let cf = commonFileDB.get(configData.id);
    if (cf && reload !== true) {
      return Promise.resolve(cf);
    }
    // 没有缓存则立即上传commonFile
    let SP = serverPush(configData.upload.ftp);
    let commonfileArr = pickCommonFiles();

    // 先上传普通common文件
    return SP.pushFiles(commonfileArr[0], "common")
      .then(function (ret) {
        let commonFile = {};
        // 以文件名作为key保存文件对应的访问url地址
        ret.success.forEach(obj => {
          commonFile[path.basename(obj.file)] = obj.url;
        });
        return commonFile;
      })
      // 再上传动态common文件
      .then(function (commonFile) {
        // 替换文件内容并以buffer进行上传
        commonfileArr[1].forEach(function (obj) {
          obj.buffer = new Buffer(obj.buffer.toString().replace(/{{([^}]+)}}/g, function (f, file) {
            return commonFile[file] || "";
          }));
        });
        // 上传
        return SP.pushBuffers(commonfileArr[1], "common")
          .then(function (ret) {
            commonfileArr[1].forEach(function (obj, i) {
              commonFile[obj.basename] = ret[i];
            });
            // 保存结果到数据库
            commonFileDB.save(configData.id, commonFile);
            // 完成数据准备！！
            return commonFile;
          });
      })
      .catch(e => {
        console.warn([
          "事件：项目初始化文件失败", "<br>",
          "项目：", configData.id, " ", configData.NAME, "<br>",
          "描述：", JSON.stringify(e)
        ].join(""));
        return "项目初始化文件上传失败！";
      });
  },

  // 准备给首页浏览器用的配置数据
  getConfigForBrowser(configData) {
    return this.checkCommonFile(configData)
      .then(function (commonFile) {
        let pubConf = configData.publish.ftp;
        return {
          commonFile: commonFile,
          id: configData.id,
          name: configData.name,
          NAME: configData.NAME,
          func: configData.func,
          item: configData.item,
          publishPrefix: pubConf.publicPathPrefix
        };
      });
  },

  // 拉取线上配置
  loadOnlineConfig(path, key, req) {
    return new Promise(function (resolve, reject) {
      if (!/^https*:\/\//.test(path)) {
        return reject("参数错误，无法加载配置。");
      }
      // 拼接json文件地址
      let jsonFile = path.replace(/\/+$/g, "") + "/index" + (key ? "-" + key : "") + ".json";
      needle("get", jsonFile)
        .then(function (res) {
          let json = res.body;
          if (Buffer.isBuffer(res.body)) {
            json = res.body.toString();
          }
          if (typeof json !== "string") {
            json = JSON.stringify(json);
          }
          // 是数组形式的内容
          if (/^\[[\d\D]+\]$/.test(json)) {
            resolve(json);
          } else {
            reject({
              "404": "找不到在线配置，导入失败。",
              "500": "服务器错误，读取配置失败。"
            }[res.statusCode] || "加载配置失败。");
          }
        }).catch(e => {
          reject(e.message || e.toString())
        });
    })
  },

  // 检查目录是否存在，返回是否可以使用
  checkPath(configData, fld, req) {
    return new Promise(function (resolve, reject) {
      // 检查配置中是否可以预知发布后的路径
      let publishPrefix = configData.publish.ftp.publicPathPrefix;
      if (!publishPrefix) {
        return resolve();
      }
      let url = publishPrefix + fld + "/index.htm";
      if (/^\/\//.test(url)) {
        url = "http:" + url;
      }
      // 可以访问到，则说明目录不可用
      // 访问不到，说明目录可用
      // 使用head方法以加快探测速度
      needle("head", url)
        .then(function (res) {
          let statusCode = res.statusCode;
          if (statusCode === 200 || (statusCode > 300 && statusCode < 400)) {
            return reject();
          }
          resolve();
        })
        .catch(resolve);
    });
  },

  // 检查页面密码
  // 新版密码存在pageMaker系统中
  // 老版密码文件存在cdn上，直接不兼容处理了，需要设置密码的可以发布时再次设置即可
  // 这样可以极大减少不划算的兼容代码，提高发布速度
  checkPageKey(configData, fld, key, newKey) {
    return new Promise(function (resolve, reject) {
      if (!configData || !configData.id || !fld) {
        return reject("参数错误，无法校验口令！")
      }
      // 获取当前项目的口令数据
      let allKeys = pageKeyDB.get(configData.id) || {};
      let pageKey = allKeys[fld];
      // 检查口令是否设置正确，正确的话，则检查新口令设置
      if (
        key === bossKey ||
        (!pageKey && !key) ||
        pageKey === MD5(key || "")
      ) {
        // 是否删除或修改口令
        if (newKey) {
          allKeys[fld] = newKey === 'null' ? undefined : MD5(newKey);
          pageKeyDB.save(configData.name, allKeys);
          pageKeyDB.storeSync();
        }
        return resolve();
      }
      // 口令错误
      reject("发布口令错误。");
    });
  }
}
