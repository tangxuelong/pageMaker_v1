define(["LS"], function (LS) {
  // 由后端直接输出的项目配置信息
  var gConf = window._project_;

  // 公共文件上传失败
  if (typeof gConf.commonFile === "string") {
    alert(gConf.commonFile);
  }

  const itemConfig = gConf.item;

  // 检查app模块和share模块是否引用同一份js代码
  itemConfig.app.jsFile = itemConfig.app.jsFile === '#' ? itemConfig.share.jsFile : itemConfig.app.jsFile;

  // 检查是否关闭功能
  itemConfig.share.close = !itemConfig.share.jsFile || itemConfig.share.jsFile === 'null' || itemConfig.share.initCode === 'null' || itemConfig.share.triggerCode === 'null';
  itemConfig.app.close = itemConfig.app.jsFile === 'null';

  // 更换js路径
  itemConfig.share.jsFile = itemConfig.share.close ? '' : itemConfig.share.jsFile;
  itemConfig.app.jsFile = itemConfig.app.close ? '' : itemConfig.app.jsFile;

  // 兼容私有组件中的读操作
  LS.set("appid", gConf.id);

  // 全局通用配置变量
  return Object.assign({
    mainWrap: "#pageConfBox",
    lsKey: "conf_" + gConf.id,
    id: "NULL",
    name: "NULL"
  }, gConf);
});
