'use strict';

/**
 * 文件数据库 fileDB
 * 
 * 对文件存储进行二次包装，简化使用和管理。
 * 
 * 创建数据库空间（目录）
 * let DataBase = require('./fileDB')("pageMaker");
 *
 * 创建或加载数据文件：
 * 		defaultInitValue：设定初始化默认值：支持对象或数组，默认 {}；
 *		aesKey: 设置Aes256对称加密密钥，用于读取和写入数据
 * let Data = DataBase.loadSync('pageMaker.log', defaultInitValue, aesKey);
 *
 * 读取数据，返回原始数据引用，即内部缓存数据。
 * Data.get(key);
 * Data.get(0);
 * Data.get();
 *
 * 读取副本数据。功能跟get一样，只不过数据是新创建的一个副本数据，而不是原始数据。
 * Data.getCopy(key); 
 *
 * 更新/添加数据
 * Data.save(key, value);
 *
 * 对象型数据进行批量更新/添加数据，数据型数据则进行追加操作，类型不匹配的不处理
 * Data.save(data);
 *
 * 删除数据
 * Data.remove(key); 等同于 Data.save(key, undefined);
 * Data.remove(keysArr);
 *
 * 立即写回文件
 * Data.storeSync();
 *
 * 定时持久化，设置为0则停止自动任务，设置为true，则实时存储（伴随save/remove等方法）
 * 默认3秒自动存储
 * Data.autoStore(3000);
 *
 * TODO: 以后可以升级通过 Object.defineProperty 来实现数据变化监控，而不是必须通过 save/remove 方法
 **/

let path = require('path');
let fs = require('fs');
let mkdirsSync = require('./tools.dir').mkdirsSync;
let Secret = require('./tools.aes256');
let is = require('./utils').is;
let MD5 = require('md5');
let console = require('./console')("fileDataBase");

//文件实际存储的目录
const fileDBBasePath = path.join(__dirname, "../files/data/");
mkdirsSync(fileDBBasePath);

//数据缓存和私有变量名
const DataCache = {};
const privateKeys = {
	aesKey: Symbol("aesKey"),
	filePath: Symbol("filePath")
};

// 创建入口函数
function main(fld) {
	if (!fld) {
		console.error("init 参数缺失或错误！");
		return;
	}
	// 创建目录
	let folder = path.join(fileDBBasePath, fld || ".tmp");
	mkdirsSync(folder);
	// 返回一个加载器
	return {
		loadSync: function (fileName, defaultInitValue, aesKeyStr) {
			return new Data(folder, fileName, defaultInitValue, aesKeyStr);
		}
	};
}

// Data对象
function Data(folder, fileName, defaultInitValue, aesKeyStr) {
	this.init(folder, fileName, defaultInitValue, aesKeyStr);
	return this;
}

Data.isSupportData = (data) => is.object(data) || is.array(data);

//定义Data原型
Object.assign(Data.prototype, {
	//同步加载数据
	init: function (folder, fileName, defaultInitValue, aesKeyStr) {
		if (!fileName) {
			console.error("loadSync 方法需要指定fileName参数！");
			return;
		}

		//处理并保存参数
		this.fileName = fileName;
		let aesKey = this[privateKeys.aesKey] = "" + (aesKeyStr || "") || null;
		let filePath = this[privateKeys.filePath] = path.join(folder, fileName);
		let defaultInitValueCopy = JSON.parse(JSON.stringify(defaultInitValue));

		//初始化值
		if (!fs.existsSync(filePath)) {
			if (!Data.isSupportData(defaultInitValueCopy)) {
				console.error("defaultInitValue 初始化值错误！");
				return;
			}
			this.save(null, defaultInitValueCopy).storeSync();
		}

		//同步读取一次全量数据并创建缓存数据
		if (!DataCache[filePath]) {
			this.loadFromFile();
		}

		//默认每3秒存一次数据
		this.autoStore(3000);

		//返回对象本身继续链式操作
		return this;
	},

	// 从文件更新缓存
	loadFromFile() {
		let filePath = this[privateKeys.filePath];
		let fileContent = fs.readFileSync(filePath);
		let aesKey = this[privateKeys.aesKey];
		//解密
		if (aesKey) {
			fileContent = Secret.decode(fileContent, aesKey);
		}
		//更新缓存
		DataCache[filePath] = JSON.parse(fileContent);
	},

	// 实时监控数据文件变化，以应对其他程序更新数据
	// 一般用于非原装程序调用数据库副本使用，会增加系统资源消耗
	watch: function () {
		let filePath = this[privateKeys.filePath];
		fs.watchFile(filePath, {
			persistent: true,
			interval: 2007
		}, () => {
			// console.log("find file change...")
			if (this.__updateFromMySelf) {
				// console.log("fired in myself")
				delete this.__updateFromMySelf;
				return
			}
			// console.log("reload from file...")
			this.loadFromFile();
		});
	},

	//读取数据
	get: function (key) {
		let filePath = this[privateKeys.filePath];
		let jsonData = DataCache[filePath];

		if (!jsonData) {
			console.warn("get 方法调用前需要先load数据文件！");
			return null;
		}

		//处理请求：无参数的请求，则返回整个数据引用。
		if (key === undefined) {
			return jsonData;
		}

		//如果指定了key则返回指定key的内容
		return jsonData[key + ""];
	},

	//读取副本数据
	getCopy: function (key) {
		let data = this.get(key);
		return data ? JSON.parse(JSON.stringify(data)) : data;
	},

	//保存数据
	save: function (key, value) {
		let filePath = this[privateKeys.filePath];

		//全量替换保存，用于初始化
		if (key === null && Data.isSupportData(value)) {
			DataCache[filePath] = value;
			this.__checkWhenDataChange();
			return this;
		}

		//取回缓存数据
		let cache = DataCache[filePath];

		//如果是字符串key和value，则直接设置
		if (is.string(key)) {
			cache[key] = value;
			this.__checkWhenDataChange();
			return this;
		}

		//首参作为复合参数，数据类型不支持的，不处理
		if (!Data.isSupportData(key)) {
			console.error("save 批量设置参数类型不支持！");
			return this;
		}

		//检查数据类型和缓存是否一致
		let cacheType = is.type(cache);
		let paraType = is.type(key);

		//不一致不处理
		if (cacheType !== paraType) {
			console.error("save 批量设置参数跟原始数据类型不一致！");
			return this;
		}

		switch (paraType) {
			case "Object":
				//如果key是对象，则遍历逐条操作
				for (var k in key) {
					if (key.hasOwnProperty(k)) {
						cache[k] = key[k];
					}
				}
				break;
			case "Array":
				//如果是数组，则进行追加操作
				cache.push.apply(cache, key);
				break;
		}
		this.__checkWhenDataChange();
		return this;
	},

	//删除数据
	remove: function (key) {
		let filePath = this[privateKeys.filePath];
		let cache = DataCache[filePath];
		if (!key) {
			return this;
		}
		if (is.array(cache) && !isNaN(key)) {
			alert("newbi")
			let index = parseInt(key, 10);
			if (index >= 0 && index < cache.length) {
				cache.splice(index, 1);
			} else {
				console.warn("remove 参数key格式错误！");
			}
		} else {
			try {
				delete cache[key];
			} catch (e) {
				cache[key] = undefined;
			}
		}
		this.__checkWhenDataChange();
		return this;
	},

	//保存到文件
	storeSync: function () {
		let filePath = this[privateKeys.filePath];
		let cache = DataCache[filePath];
		let aesKey = this[privateKeys.aesKey];
		let fileContent = JSON.stringify(cache);
		let contentMD5 = MD5(fileContent);

		//数据有变化的时候存入文件
		if (contentMD5 !== this.__content) {
			//加密内容
			if (aesKey) {
				fileContent = Secret.encode(fileContent, aesKey);
			}
			this.__updateFromMySelf = true;
			fs.writeFileSync(filePath, fileContent, {
				encoding: "utf-8"
			});
			this.__storeTime = new Date();
		}

		//存入当前的时间和内容MD5值
		this.__content = contentMD5;
		return this;
	},

	//检查定时任务
	__checkWhenDataChange: function () {
		if (this.liveStore) {
			this.storeSync();
		} else {
			if (this.__waitTimer) {
				return;
			}
			let idleTime = new Date() - this.__storeTime;
			let me = this;
			if (idleTime >= this.__intervalTime) {
				this.storeSync();
			} else {
				this.__waitTimer = setTimeout(function () {
					delete me.__waitTimer;
					me.storeSync();
				}, this.__intervalTime - idleTime);
			}
		}
	},

	//自动保存到文件
	autoStore: function (time) {
		//如果设置为true，则实时保存
		if (time === true) {
			this.liveStore = true;
			return this.storeSync();
		}

		//其他情况为定时保存
		this.liveStore = false;
		this.__intervalTime = parseInt(time, 10) || 3000;
	}
});

//导出的控制接口
module.exports = main;
