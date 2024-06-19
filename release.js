// 简易编译脚本
// 对 js 进行压缩后复制，保持目录结构，其余不处理
'use strict';

const path = require('path');
const fs = require('fs');
const UglifyJS = require("uglify-es");
const Dir = require('./core.node/tools.dir');
const target = path.resolve('./dist');
const ignore = ["font", "lib", "widgets"];

// 如果目标目录存在，则清空
if (fs.existsSync(target)) {
  Dir.rmdirSync(target);
}

// 遍历文件进行处理
function buildFiles(fileFld, target) {
  if (!fs.existsSync(fileFld)) {
    return;
  }
  fs.readdirSync(fileFld).forEach(file => {
    let filePath = path.join(fileFld, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (ignore.indexOf(file) === -1) {
        buildFiles(filePath, path.join(target, file));
      }
      return;
    }
    let content;
    switch (path.extname(file)) {
      case ".js":
        content = UglifyJS.minify(fs.readFileSync(filePath).toString()).code;
        break;
    }
    if (content) {
      // 创建目录
      Dir.mkdirsSync(target);
      // 写入文件
      fs.writeFileSync(path.join(target, file), content, 'utf8');
    }
  });
}

// 导出控制接口给主程序调用
module.exports = {
  start: function () {
    try {
      buildFiles(path.resolve('./public'), target);
      buildFiles(path.resolve('./core.public'), target);
    } catch (e) {
      Dir.rmdirSync(target);
    }
  }
}
