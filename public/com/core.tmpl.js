define([
  'jquery', 'com/gconf'
], function ($, gConf) {
  'use strict';
  // 返回一个字符串模板
  return [
    '<!DOCTYPE HTML>',
    '<html><head>',
    '<meta charset="utf-8"/>',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>',
    '<meta http-equiv="pragma" content="no-cache">',
    '<meta http-equiv="expires" content="0">',
    '<meta http-equiv="cache-control" content="no-cache">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,minimal-ui"/>',
    '<meta name="apple-mobile-web-app-capable" content="yes"/>',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black"/>',
    '<meta content="telephone=no" name="format-detection"/>',
    '<meta name="keywords" content="{keywords}"/>',
    '<meta name="description" content="{description}"/>',
    '<title>{title}</title>',
    '{cssFiles}{moreStyle}',
    '</head>',
    // ontouchstart="" 设置是为了修复IOS下 :active伪类不生效的bug
    '<body ontouchstart=""><noscript><div id="noScript">请开启浏览器的Javascript功能，或使用支持javascript的浏览器访问</div></noscript>',
    // '<div id="_page_loading" class="pagebg"></div>',
    '{jsFiles}{moreScript}',
    '<div id="_"><div>{pageContent}</div></div>',
    // '<script>document.addEventListener("DOMContentLoaded",function(){',
    // 'document.body.removeChild(document.getElementById("_page_loading"))',
    // '},false)</', 'script>',
    '</body></html>'
  ].join("");
});
