'use strict';

//全局变量
module.exports = (extDataObject) => {
	let gvars = require('./global.var');
	return Object.assign({}, gvars, extDataObject || {});
};
