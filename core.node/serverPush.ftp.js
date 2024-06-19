'use strict';
/**
 * 服务器端ftp推送文件模块，返回promise，不再使用回调
 * 
 * ftpConfig:
 *  host: ftp地址 *
 *  port: 端口，默认 21
 *  user: 用户名
 *  passwrod: 密码
 *  dir: 目录，默认 空，即ftp根目录
 *  timeout: 连接超时（单位：秒），默认 10
 *  publicPathPrefix: 上传后的访问路径前缀 *
 *  secure: 是否采用 sftp 上传，默认 false
 *  secureOptions: 采用 sftp 上传追加的额外配置参数，默认 {}
 * 
 *  === 使用方法 ===
 *  let ftp = require('./serverPush.ftp')(ftpConfig);
 *  // 如果必要参数缺失，则返回 undefined。
 *  
 *  // 批量上传文件
 *  ftp.pushFiles(fileList, target, deleteFileAfterUpload);
 *    - fileList: 待上传的文件全路径列表，或文件描述列表，fileInfo 对象如下
 * 				- path: 文件全路径
 * 				- filename: 文件名，若不提供，则使用文件的MD5值作为文件名，后缀从 path 信息中获取
 * 				- target: 上传的子目录，从函数参数target算起
 *    - target: 要上传到的服务器目录，从 ftpConfig.dir 开始计算，默认空
 *    - deleteFileAfterUpload: 成功上传后是否删除原文件，默认false
 *    - return promise
 *        ftp连接或其他操作错误，则 reject(errDesc)
 *        ftp连接正确并上传，则 resolve(resultInfo)
 *        resolve 返回上传结果描述信息对象 resultInfo：
 *            - success: [fileInfoObject] 上传成功的文件信息列表，没有固定顺序
 *            - failed: [fileInfoObject] 上传失败的文件信息列表，没有固定顺序
 *            - urlMap: {filePath: visitUrl}
 *        fileInfoObject 格式如下：
 *            - file: 原文件路径地址
 *            - url: 上传后的访问地址，上传失败则为空
 * 
 *  // 批量上传文件Buffer
 *  ftp.pushBuffers(bufferList, target);
 *    - bufferList: 待上传的buffer列表，元素 bufferData 对象如下：
 *        - buffer: Buffer对象实例
 *        - extname: 文件类型后缀，比如 '.js'
 * 				- filename: 文件名，若不提供，则使用文件的MD5值 + extname
 * 				- target: 上传的子目录，从函数参数target算起
 *    - target: 要上传到的服务器目录，从 ftpConfig.dir 开始计算
 *    - return promise
 *        ftp连接或其他操作错误，则 reject(errDesc)
 *        ftp连接正确并上传，则 resolve(urlArray)
 *        resolve 返回上传结果数组[url]。元素对应bufferList的数据顺序。
 *  
 */
const FTP = require("ftp");
const console = require('./console')("serverPush.ftp");
const path = require('path');
const fs = require('fs');
const MD5 = require('md5');
const ftpCache = {};

function myFTP(ftpConfig, cacheKey) {
  if (!ftpConfig || !ftpConfig.host || !ftpConfig.publicPathPrefix) {
    return;
  }
  this.__cacheKey = cacheKey;
  this.__config = ftpConfig;
  this.__ftp = new FTP();
  this.__prefix = ftpConfig.publicPathPrefix.replace(/\/*$/, "") + "/";
}

module.exports = function (ftpConfig) {
  // 根据链接信息进行缓存
  let cacheKey = "ftp" + MD5(JSON.stringify(ftpConfig));
  // 有缓存命中，则使用缓存，防止连接数过多导致服务器拒绝
  if (ftpCache[cacheKey]) {
    console.log("find ftp cache ...", ftpConfig.host);
    return ftpCache[cacheKey];
  }
  return ftpCache[cacheKey] = new myFTP(ftpConfig, cacheKey);
};

Object.assign(myFTP.prototype, {
  ready() {
    return this.__ready = this.__ready || new Promise((resolve, reject) => {
      let cfg = this.__config;
      let clear = () => {
        // 如果被自动断开链接，则清除 __ready 状态和缓存
        ftpCache[this.__cacheKey] = null;
        this.__ready = null;
      };
      this.__ftp.on('ready', () => {
        console.log("ftp ready ...", cfg.host);
        resolve();
      });
      this.__ftp.on('error', err => {
        console.log("ftp error ...", err);
        reject("FTP连接失败：" + err);
      });
      this.__ftp.on('end', () => {
        console.log("ftp ended ......", cfg.host);
        clear();
      });
      this.__ftp.on('close', () => {
        console.log("ftp closed ......", cfg.host);
        clear();
      });
      console.log("ftp connect:", cfg.host);
      this.__ftp.connect({
        host: cfg.host,
        port: cfg.port || 21,
        user: cfg.user || undefined,
        password: cfg.password || undefined,
        connTimeout: (cfg.timeout || 10) * 1000,
        // keepalive: 30000,
        secure: cfg.secure,
        secureOptions: cfg.secure ? cfg.secureOptions : undefined
      });
      // 定时清理FTP缓存和链接
      setTimeout(() => {
        try {
          this.__ftp.end();
          clear();
        } catch (e) {
          clear();
        }
      }, 1 * 60 * 1000);
    });
  },
  mkdir(target) {
    return new Promise((resolve, reject) => {
      // 合并上传的目录，并修改为linux分隔符以兼容window下的开发
      target = path.join(this.__config.dir || "", target || "").replace(/\\/g, "/");
      // 创建目录
      this.__ftp.mkdir(target, true, function (err) {
        err ? reject("FTP目录创建失败（" + target + "）。") : resolve(target);
      });
    });
  },
  getFullUrl(target, filename) {
    return this.__prefix + (target ? target.replace(/\/*$/, "") + "/" : "") + filename;
  },
  pushFiles(fileList, target, deleteFileAfterUpload) {
    return this.ready()
      .then(() => this.mkdir(target))
      .then(fullTarget => new Promise((resolve, reject) => {
        // 检查必要的参数
        if (!fileList) {
          return reject("缺少文件列表，无法推送FTP。");
        }
        // 转化为对象描述的列表
        let fileObjList = fileList.map(file => {
          if (typeof file === "string") {
            return {
              path: file
            };
          }
          return file;
        });
        // 开始推送
        const result = {
          success: [],
          failed: [],
          urlMap: {}
        };
        const finishOne = (file, url, err) => {
          if (url) {
            result.success.push({
              file,
              url
            });
          } else {
            result.failed.push({
              file,
              err
            });
          }
          result.urlMap[file] = url;
          if (url && deleteFileAfterUpload) {
            fs.unlinkSync(file);
          }
        }
        // 串联promise
        let job = Promise.resolve();
        // 遍历文件列表，逐个上传
        fileObjList.forEach(fileData => {
          job = job.then(() => new Promise((resolve, reject) => {
            // 检测文件是否存在
            if (!fs.existsSync(fileData.path)) {
              console.warn('待上传的文件不存在：', fileData.path);
              finishOne(fileData.path, "", "文件不存在");
              return resolve();
            }
            // 对文件进行 md5 改名
            if (!fileData.filename) {
              fileData.filename = MD5(fs.readFileSync(fileData.path)).slice(0, 16) + path.extname(fileData.path);
            }
            // 检查并创建子路径
            (fileData.target ?
              this.mkdir(path.join(target, fileData.target)) :
              Promise.resolve(fullTarget)
            ).then(fullTarget => {
              // 上传文件
              this.__ftp.put(fileData.path, fullTarget + "/" + fileData.filename, err => {
                // 保存上传结果
                finishOne(fileData.path, err ? '' : this.getFullUrl(target, fileData.filename), err);
                // 无论上传成功或失败，都是 resolve，方便下个文件继续上传
                resolve();
              });
            });
          }));
        });
        // 所有文件处理完毕后，本次上传任务结束
        job.then(() => resolve(result))
          .catch(desc => reject("FTP上传出错：<br>" + desc));
      }));
  },
  pushBuffers(bufferList, target) {
    return this.ready()
      .then(() => this.mkdir(target))
      .then(fullTarget => new Promise((resolve, reject) => {
        // 检查必要的参数
        if (!bufferList) {
          return reject("缺少上传数据，无法推送FTP。");
        }
        // 开始推送
        const urlArr = [];
        const finishOne = (index, url) => {
          urlArr[index] = url;
        }
        // 串联promise
        let job = Promise.resolve();
        // 遍历文件列表，逐个上传
        bufferList.forEach((fileData, index) => {
          job = job.then(() => new Promise((resolve, reject) => {
            // 对文件进行 md5 改名
            if (!fileData.filename) {
              fileData.filename = MD5(fileData.buffer.toString()).slice(0, 16) + fileData.extname;
            }
            //检查并创建子路径
            (fileData.target ?
              this.mkdir(path.join(target, fileData.target)) :
              Promise.resolve(fullTarget)
            ).then(fullTarget => {
              // 上传文件，允许指定单独的子目录层级信息
              this.__ftp.put(fileData.buffer, fullTarget + "/" + fileData.filename, err => {
                // 保存上传结果
                finishOne(index, err ? '' : this.getFullUrl(path.join(target, fileData.target || ""), fileData.filename));
                // 无论上传成功或失败，都是 resolve，方便下个文件继续上传
                resolve();
              });
            });
          }));
        });
        // 所有文件处理完毕后，本次上传任务结束
        // 重新整理上传结果信息给予返回
        job.then(() => resolve(urlArr))
          .catch(desc => reject("FTP上传出错：<br>" + desc));
      }));
  }
});
