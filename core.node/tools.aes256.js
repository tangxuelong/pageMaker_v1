'use strict';

//对称加密、解密工具
let crypto = require('crypto');
module.exports = {
	encode: function(text, key) {
		let cipher = crypto.createCipher('aes-256-cbc', key);
		let crypted = cipher.update(text || "", 'utf8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	},
	decode: function(crypted, key) {
		crypted = crypted + "";
		if (crypted.substr(0, 1) === "{" && crypted.slice(-1) === "}") {
			return crypted;
		}
		if (crypted.substr(0, 1) === "[" && crypted.slice(-1) === "]") {
			return crypted;
		}
		let decipher = crypto.createDecipher('aes-256-cbc', key);
		let dec = decipher.update(crypted, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return dec;
	}
};
