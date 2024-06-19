'use strict';

const Jimp = require('jimp');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminOptipng = require('imagemin-optipng');

// 按照较小的buffer进行resolve
function resolveMinBuffer(resolve, buffer1, buffer2) {
  if (buffer1.length < buffer2.length) {
    resolve(buffer1);
  } else {
    resolve(buffer2);
  }
}

// 图片缩放，并以文件体积为优先考虑
// 仅仅处理 jpg/jpeg/png
// 仅仅处理 buffer 对象
function scaleBufferImage(buffer, maxWidth, maxHeight) {
  return new Promise(function (resolve, reject) {
    if (!Buffer.isBuffer(buffer)) {
      return reject("参数buffer格式错误");
    }
    Jimp.read(buffer, function (err, image) {
      if (err) {
        return resolve(buffer);
      }
      maxWidth = maxWidth || Infinity;
      maxHeight = maxHeight || Infinity;
      // 先检查图片尺寸是否不需要处理
      if (image.bitmap.width <= maxWidth && image.bitmap.height <= maxHeight) {
        return resolve(buffer);
      }
      // 等比缩放
      image.scaleToFit(maxWidth, maxHeight)
        .getBuffer(Jimp.AUTO, function (err, newBuffer) {
          // 压缩出现错误，则返回原始的buffer
          if (err) {
            return resolve(buffer);
          }
          // 强制进行一次无损压缩
          minBufferImage(newBuffer).then(function (minBuffer) {
            resolveMinBuffer(resolve, minBuffer, buffer);
          }).catch(function () {
            resolveMinBuffer(resolve, newBuffer, buffer);
          });
        });
    });
  });
}

// 无损压缩jpg/png
function minBufferImage(buffer, noReject) {
  return new Promise(function (resolve, reject) {
    if (!Buffer.isBuffer(buffer)) {
      return reject("参数buffer格式错误");
    }
    Jimp.read(buffer, function (err, image) {
      if (err) {
        return resolve(buffer);
      }
      let mime = image.getMIME();
      // 使用 imagemin 进行无损压缩
      switch (mime) {
        // 压缩png图片
        case Jimp.MIME_PNG:
          imagemin.buffer(buffer, {
            use: [
              imageminOptipng({
                optimizationLevel: 1
              })
            ]
          }).then(function (newBuffer) {
            resolveMinBuffer(resolve, newBuffer, buffer);
          }).catch(e => noReject ? resolve(buffer) : reject(e));
          break;
          // 压缩jpg图片
        case Jimp.MIME_JPEG:
          imagemin.buffer(buffer, {
            use: [
              imageminJpegtran({
                progressive: true
              })
            ]
          }).then(function (newBuffer) {
            resolveMinBuffer(resolve, newBuffer, buffer);
          }).catch(e => noReject ? resolve(buffer) : reject(e));
          break;
        default:
          // 不识别的格式不处理
          resolve(buffer);
      }
    });
  });
}

module.exports = {
  scaleBufferImage,
  minBufferImage,
  getDataURI(buffer) {
    return new Promise(function (resolve, reject) {
      if (!Buffer.isBuffer(buffer)) {
        return reject("参数buffer格式错误");
      }
      Jimp.read(buffer, function(err, image) {
        if (err) {
          return reject('加载buffer出错');
        }
        resolve("data:" + image.getMIME() + ";base64," + buffer.toString('base64'));
      });
    });
  }
}
