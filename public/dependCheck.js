'use strict';
// 同步检查浏览器特性
var JUMP_ERR_PAGE = function () {
  window.location.replace('/please/update');
}
if (!window.Promise || !window.Promise.all ||
  !window.JSON || !window.FormData ||
  !Date.now || !Array.prototype.map
) {
  JUMP_ERR_PAGE();
}
