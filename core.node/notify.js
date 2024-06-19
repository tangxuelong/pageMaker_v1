// 通知模块包装

'use strict';
const needle = require('needle');

module.exports = function (config, popoStr, postData, errCallbck) {
	if (config.url && postData) {
		needle.post(config.url, postData, function (err, res) {
			if (err) {
				errCallbck && errCallbck("netError", "通知接口" + config.url + "调用错误");
				return;
			}
			// 状态码错误也算是错误
			let code = res.statusCode;
			if (code >= 400) {
				errCallbck && errCallbck(code, "通知接口" + config.url + "调用错误");
			}
		});
	}
}
