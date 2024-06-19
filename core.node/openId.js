'use strict';

/**
 * 网易OpenId登陆验证模块
 *
 * [参考文档]
 * https://login.netease.com/download/ntes_openid_dev.pdf
 *
 * 终极偷懒方案：
 * 省略第一步，第二步直接发起认证请求，其中openid.assoc_handle请设置为空值
 * OpenID Server返回后，校验openid.mode是否为id_res 及 openid.identity是否以https://login.netease.com/openid/开始后，
 * 修改openid.mode为check_authentication，并将所有数据POST给OpenID Server（做check_authentication）。
 *
 * [接口使用]
 * //通常情况下，使用commoneSever创建的服务，默认入口在  NFOP.openId
 * var openId = require('./openId');
 * 
 * openId.isLogin(req)  传入req参数，检查session是否登录
 * openId.getLoginUser(req)  传入req参数，返回当前登录用户的用户名
 * openId.checkLogin(req, res, type, callback)
 * 		处理业务逻辑前，检查登录状态：
 * 		type: 'page' 如果类型为page，则未登录时直接跳转登录
 * 		type: 'ajax' 如果类型为ajax，则未登录时返回空的user和name
 * 		callback为非跳转登录时的回调，传入两个参数：user/name，分别表示openId和姓名
 */
const https = require('https');
const querystring = require("querystring");
const EventEmitter = require('events');
const event = new EventEmitter();
const openidServer = {
	hostname: 'login.netease.com',
	path: '/openid/',
};

const httpsPost = function (data, callback) {
	var post_data = querystring.stringify(data);
	var reqHttps = https.request({
		hostname: openidServer.hostname,
		path: openidServer.path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post_data.length
		}
	}, function (serverFeedback) {
		var code = serverFeedback.statusCode,
			body = "";
		if (code == 200) {
			serverFeedback.on('data', function (data) {
					body += data;
				})
				.on('end', function () {
					callback(true, 200, body);
				});
		} else {
			callback(false, code, "登陆数据校验错误");
		}
	}).on("error", function (e) {
		callback(false, 500, "认证服务器错误");
	});
	reqHttps.write(post_data);
	reqHttps.end();
};

const LOGIN = {
	checkLogin: function (req, res, type, callback) {
		if (!req || !res) {
			return;
		}
		//类型： page / ajax
		type = type || "page";
		if (LOGIN.isLogin(req)) {
			callback && callback(req.session.user, req.session.name);
		} else {
			if (type === "ajax") {
				callback();
			} else {
				LOGIN.startLogin(req, res);
			}
		}
	},

	isLogin: function (req) {
		return !!(req && req.session && req.session.user);
	},

	getLoginUser: function (req) {
		if (!req) {
			console.error("getLoginUser 需要传入 req 参数！");
			return
		}
		return req.session ? req.session.user || null : null;
	},

	startLogin: function (req, res) {
		//保存请求登录的url地址
		req.session.backTo = req.originalUrl;

		//省略第一步关联，直接发起认证请求
		var para = {
			"openid.ns": "http://specs.openid.net/auth/2.0",
			"openid.ns.sreg": "http://openid.net/extensions/sreg/1.1",
			"openid.claimed_id": "http://specs.openid.net/auth/2.0/identifierselect",
			"openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
			"openid.mode": "checkid_setup",
			"openid.assoc_handle": "",
			"openid.return_to": "http://" + req.headers.host + "/login",
			"openid.realm": "http://" + req.headers.host,
			"openid.sreg.required": "nickname,email,fullname"
		};
		var url = "https://" + openidServer.hostname + openidServer.path + "?",
			data = [];
		for (var key in para) {
			data.push(key + "=" + encodeURIComponent(para[key]));
		}
		res.redirect(url + data.join("&"));
	},

	finishLogin: function (req, res, userData) {
		// 获取返回地址
		let go = req.session.backTo || "/";
		req.session.backTo = undefined;
		//写入session
		if (userData) {
			let user = req.session.user = userData.user;
			let name = req.session.name = userData.name;
			//通知外部模块
			event.emit("login_success", user, name);
		}
		//返回
		res.redirect(go);
	}
};

//注册路由
exports.addRouter = function (router) {

	//登录成功返回的签名校验页，必须有完整的验证参数才可以
	router.get('/login', function (req, res, next) {
		// 检查要返回的地址
		var backTo = req.query.url || req.query.back;
		req.session.backTo = backTo || req.session.backTo || "/";

		//检查是否已经登陆
		if (req.session.user) {
			LOGIN.finishLogin(req, res);
			return;
		}

		var dataErrTip = "登陆数据校验错误，请从原始站点访问。";

		//基本数据校验，缺少数据或错误，则重新登陆
		if (req.query["openid.mode"] !== "id_res" || req.query["openid.identity"].indexOf("https://login.netease.com/openid/") !== 0) {
			req.url = "/";
			LOGIN.startLogin(req, res);
			return;
		}
		//获取用户信息
		var userData = {
			user: req.query["openid.sreg.email"],
			name: req.query["openid.sreg.fullname"] || req.query["openid.sreg.nickname"]
		};

		//直接 check_authentication
		req.query["openid.mode"] = "check_authentication";

		//发送https请求
		httpsPost(req.query, function (ok, code, data) {
			if (!ok) {
				res.send(dataErrTip);
			} else {
				//检查data是否正确
				if (data.indexOf("is_valid:true") >= 0) {
					LOGIN.finishLogin(req, res, userData);
				} else {
					res.send(dataErrTip);
				}
			}
		});
	});

	// 退出登录
	router.get('/logout', function (req, res, next) {
		req.session = null;
		var ref = req.headers.referer || "";
		var back = req.query.url || req.query.back || ref;
		if (ref.indexOf(req.headers.host) > 0 && ref.indexOf("/login") == -1 && ref.indexOf("/logout") == -1) {
			res.redirect(back);
		} else {
			res.redirect("/");
		}
	});
};

//导出外部接口
exports.isLogin = LOGIN.isLogin;
exports.checkLogin = LOGIN.checkLogin;
exports.getLoginUser = LOGIN.getLoginUser;

//事件处理句柄
exports.event = event;
