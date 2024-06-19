//全局变量
const serverIP = (function() {
	var interfaces = require('os').networkInterfaces();
	for (var devName in interfaces) {
		var iface = interfaces[devName];
		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
				return alias.address;
			}
		}
	}
	return "";
})();
const getMyConsole = require('./console');

module.exports = {
	//服务器IP地址
	serverIP,

	//自定义console
	getMyConsole
};
