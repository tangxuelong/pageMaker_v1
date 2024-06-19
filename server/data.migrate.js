// 旧版数据迁移
'use strict';
const path = require('path');
const serverPush = require('../core.node/serverPush');

module.exports = {
  // 迁移旧版配置文件中的 files/upload/xxx 文件
  uploadFiles(configData, publishData) {
    // 在json文件中查找所有的待上传文件
    let uploadFileKeys = publishData.json.match(/\/files\/upload\/[^"']+/g);
    if (!uploadFileKeys) {
      return Promise.resolve();
    }
    // 对待上传文件进行排重
    let pathToKey = {};
    let waitUpload = [];
    uploadFileKeys.forEach(key => {
      let filePath = path.join(NFOP.root, "../", key);
      if (!pathToKey[filePath]) {
        pathToKey[filePath] = key;
        waitUpload.push(filePath);
      }
    });
    // 兼容处理的图片不再做任何处理，直接原图上传
    let SP = serverPush(configData.upload.ftp);
    // 创建要推送的文件目录，增加特殊标识
    let now = new Date();
    let target = now.getFullYear() + ("00" + (now.getMonth() + 1)).slice(-2) + "migrate";
    // 开始推送，第三个参数表示上传成功后删除源文件
    // 暂时并不能删除源文件：因为有可能将现有页面发布到一个测试地址
    return SP.pushFiles(waitUpload, target /*,true*/)
      .then(function (resultInfo) {
        // console.log("迁移结果：", resultInfo)
        // - success: [fileInfoObject] 上传成功的文件信息列表，没有固定顺序
        // - failed: [fileInfoObject] 上传失败的文件信息列表，没有固定顺序
        // - urlMap: {filePath: visitUrl}
        // 迁移失败的文件报警处理，但不影响后续流程
        if (resultInfo.failed && resultInfo.failed.length) {
          console.warn([
            '人员：', publishData.userDesc, '<br>',
            '事件：文件迁移错误：<br>',
            '目录：', configData.id, '(', configData.NAME, ')', publishData.fld, '<br>',
            '信息：', JSON.stringify(resultInfo.failed)
          ].join(''));
        }
        let pathToUrl = resultInfo.urlMap;
        let fixedJson = publishData.json;
        let fixedHtml = publishData.html;
        for (let filePath in pathToUrl) {
          let key = pathToKey[filePath].replace(/\//g, "\\/");
          let url = pathToUrl[filePath];
          if (url) {
            fixedJson = fixedJson.replace(new RegExp(key, "g"), url);
            fixedHtml = fixedHtml.replace(new RegExp(key, "g"), url);
          }
        }
        return {
          json: fixedJson,
          html: fixedHtml
        };
      });
  }
}
