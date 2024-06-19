'use strict';

var fs = require('fs');
var path = require('path');
//同步创建文件夹
exports.mkdirsSync = function(dirname, mode) {
    if (mode === undefined) mode = 0x1ff ^ process.umask();
    var pathsCreated = [],
        pathsFound = [];
    var fn = dirname;
    while (true) {
        try {
            var stats = fs.statSync(fn);
            if (stats.isDirectory())
                break;
            throw new Error('Unable to create directory at ' + fn);
        } catch (e) {
            if (e.code === 'ENOENT') {
                pathsFound.push(fn);
                fn = path.dirname(fn);
            } else {
                throw e;
            }
        }
    }
    for (var i = pathsFound.length - 1; i > -1; i--) {
        var fn = pathsFound[i];
        fs.mkdirSync(fn, mode);
        pathsCreated.push(fn);
    }
    return pathsCreated;
};

//同步删除文件夹
function rmdirSync(dirname) {
    if (fs.existsSync(dirname)) {
        //清空目录下的所有文件后，才能删除文件夹
        var files = fs.readdirSync(dirname);
        files.forEach(function(file, index) {
            var filePath = path.join(dirname, file);
            if (fs.statSync(filePath).isDirectory()) {
                rmdirSync(filePath)
            } else {
                fs.unlinkSync(filePath);
            }
        });
        try{
            fs.rmdirSync(dirname);
        }catch(e){
            //防止在清空目录的时候，再次有其他程序写入文件
            //如果删除失败，就失败吧
        }
    }
};
exports.rmdirSync = rmdirSync;