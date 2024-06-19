/**
 * 服务器上传推送模块
 * 
 *  === 使用方法 ===
 *  let SP = require('./serverPush')(config);
 *  
 *  // 批量上传文件
 *  SP.pushFiles(fileList, target, deleteFileAfterUpload);
 *    - fileList: 待上传的文件全路径列表，或指定的文件目录（将上传目录下所有有文件名和类型后缀的文件）
 *    - target: 要上传到的服务器目录，从 ftpConfig.dir 开始计算，默认空， api类型下可能无效
 *    - deleteFileAfterUpload: 成功上传后是否删除原文件，默认false
 *    - return promise
 *        连接或其他操作错误，则 reject(errDesc)
 *        连接正确并上传，则 resolve(resultInfo)
 *        resolve 返回上传结果描述信息对象 resultInfo：
 *            - success: [fileInfoObject] 上传成功的文件信息列表，没有固定顺序
 *            - failed: [fileInfoObject] 上传失败的文件信息列表，没有固定顺序
 *            - urlMap: {filePath: visitUrl}
 *        fileInfoObject 格式如下：
 *            - file: 原文件路径地址
 *            - url: 上传后的访问地址，上传失败则为空
 * 
 *  // 批量上传文件Buffer
 *  SP.pushBuffers(bufferList, target);
 *    - bufferList: 待上传的buffer列表，元素 bufferData 对象如下：
 *        - buffer: Buffer对象实例
 *        - extname: 文件类型后缀，比如 '.js'
 *    - target: 要上传到的服务器目录，从 ftpConfig.dir 开始计算
 *    - return promise
 *        ftp连接或其他操作错误，则 reject(errDesc)
 *        ftp连接正确并上传，则 resolve(urlArray)
 *        resolve 返回上传结果数组[url]。元素对应bufferList的数据顺序。
 */
'use strict';

const getOneFTP = require('./serverPush.ftp');
const fs = require('fs');
const path = require('path');
const readFileList = function (fileFld) {
	var fileList = [];
	if (fs.existsSync(fileFld)) {
		var files = fs.readdirSync(fileFld);
		files.forEach(function (file, index) {
			var filePath = path.join(fileFld, file);
			if (fs.statSync(filePath).isDirectory()) {
				// 如果存在子目录不再深入遍历，以保持处理逻辑简单
			} else {
        // 文件必须有文件名和文件类型后缀，否则不处理
        let basename = path.basename(filePath);
				if (basename && basename.indexOf('.') !== 0 && path.extname(filePath)) {
					fileList.push(filePath);
				}
			}
		});
	}
	return fileList;
};

// 导出的接口
module.exports = function (config) {
	const handler = getOneFTP(config);
	return {
		pushFiles(fileList, target, deleteFileAfterUpload) {
			if (Array.isArray(fileList)) {
				return handler.pushFiles(fileList, target, deleteFileAfterUpload);
			} else if (fs.statSync(fileList).isDirectory()) {
				return handler.pushFiles(readFileList(fileList), target, deleteFileAfterUpload);
			}
		},
		pushBuffers(bufferList, target) {
			return handler.pushBuffers(bufferList, target);
		}
	}
};
