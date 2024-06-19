'use strict';

// 上传模块
const Busboy = require('busboy');
const path = require('path');
const serverPush = require('../core.node/serverPush');
const notifyCore = require('../core.node/notify');
const image = require('./image');
// 最大上传文件限制，单位 M
const maxFileSize = 5;
// 小文件直接使用dataURI，单位 K
const smallFilleSize = 1.5;

// 检测文件类型: img / doc / page / media / unknown
function getFileType(filename) {
  var name = filename.toLowerCase();
  return /\.(?:png|gif|jpg|jpeg)$/.test(name) ? "img" : /\.(?:mp3)$/.test(name) ? "media" : /\.(?:txt|doc|docx|md)$/.test(name) ? "doc" : /\.(?:js|css|json|html|htm)$/.test(name) ? "page" : "unknown";
}
const mimeTypeMap = {
  png: 'image/png',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
};

module.exports = function (configData, req, user, name) {
  let busboy = new Busboy({
    headers: req.headers
  });
  let userDesc = name + "(" + user + ")";
  // 返回一个promise
  return new Promise(function (resolve, reject) {
    // 保存上传结果信息
    let fileBufferArray = [];
    let errInfo = [];

    // busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    //   console.log('字段 [' + fieldname + ']', val);
    // });

    // 接收上传的文件流
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let type = getFileType(filename);
      // console.log("文件 [" + fieldname + "]", filename)
      let ext = path.extname(filename);
      // 检测文件名，只允许图片和多媒体上传
      if (type !== "img" && type !== "media") {
        if (filename) {
          errInfo.push("不能处理的文件类型(" + ext + ")。");
        }
        file.resume();
        return;
      }
      let chunks = [];
      let uploadLen = 0;
      // 文件数据传输ing
      file.on('data', function (data) {
        chunks.push(data);
        uploadLen += data.length;
        if (uploadLen > maxFileSize * 1024 * 1024) {
          chunks.length = 0;
          file.resume();
        }
      });
      // 文件传输over
      file.on("end", function () {
        // 文件为空或体积超限
        if (chunks.length === 0 || uploadLen <= 0) {
          errInfo.push("上传文件不能为空且不能超过" + maxFileSize + "M。");
          return;
        }
        // 上传的文件buffer
        fileBufferArray.push({
          fieldname: fieldname,
          buffer: Buffer.concat(chunks),
          extname: ext,
          type: type
        });
        // 释放内存
        chunks.length = 0;
      });
    });

    // 上传结束，开始处理文件buffer
    // 然后上传服务器
    busboy.on('finish', function () {
      // 没有文件上传成功，直接reject
      if (fileBufferArray.length === 0) {
        return reject(errInfo.join('<br>'));
      }
      Promise.resolve()
        // 先进行图片预处理
        .then(() => dealImage(req, configData, fileBufferArray))
        // 再推送服务器
        .then(() => pushServer(configData, fileBufferArray))
        .then(resolve)
        .catch(e => {
          reject("文件推送错误：", e);
          // 报警通知
          notifyCore(configData.upload.alert, [
            "人员：", userDesc, '<br>',
            "事件：上传失败", '<br>',
            "描述：", e
          ].join(''), {
            type: "upload-error",
            data: {
              err: "上传文件失败",
              user: userDesc,
              desc: e
            }
          });
        });
    });
    // 上传接收启动
    req.pipe(busboy);
  });
}

function dealImage(req, configData, fileBufferArray) {
  let jobs = Promise.resolve();
  // 限制图片的最大尺寸
  let tmpSizeLimit = req.query.size || '';
  let sizeLimit = tmpSizeLimit === 'free' ? 0 : parseInt(tmpSizeLimit.replace(/\D/g, "") || configData.upload.maxImageWidth, 10);
  if (sizeLimit > 0) {
    fileBufferArray.forEach(function (obj) {
      if (obj.type === 'img') {
        // 进行尺寸缩放，只限制最大宽度，不限制最大高度
        jobs = jobs.then(() => image
          .scaleBufferImage(obj.buffer, sizeLimit, Infinity)
          .then(function (buffer) {
            obj.buffer = buffer
          })
        );
      }
    });
  }
  // 对图片进行无损压缩
  if (configData.upload.loseless) {
    fileBufferArray.forEach(function (obj) {
      if (obj.type === 'img') {
        // 压缩图片，第二个参数是 noReject，保证返回resovle可以让后续任务继续
        jobs = jobs.then(() => image
          .minBufferImage(obj.buffer, true)
          .then(function (buffer) {
            obj.buffer = buffer
          })
        );
      }
    });
  }
  return jobs;
}

function pushServer(configData, fileBufferArray) {
  let uploadResult = {};
  // 文件太小的放弃上传，直接修改为dataURI返回
  return Promise.resolve().then(function () {
    let waitUpload = [];
    fileBufferArray.forEach(obj => {
      // 小图片转化为dataURI
      let mime = mimeTypeMap[obj.extname.slice(1)];
      if (mime && obj.buffer.length < smallFilleSize * 1024) {
        uploadResult[obj.fieldname] = "data:" + mime + ";base64," + obj.buffer.toString('base64');
      } else {
        waitUpload.push(obj);
      }
    });
    // 扔到下个步骤进行上传
    return waitUpload;
  }).then(waitUpload => {
    // 执行推送任务
    let SP = serverPush(configData.upload.ftp);
    // 创建要推送的文件目录
    let now = new Date();
    let target = now.getFullYear() + ("00" + (now.getMonth() + 1)).slice(-2);
    // 开始推送
    return SP.pushBuffers(waitUpload, target)
      .then(function (retArr) {
        waitUpload.forEach((obj, index) => {
          uploadResult[obj.fieldname] = retArr[index];
        });
        // 处理完毕结果数据
        return uploadResult;
      });
  });
}
