define([
  "jquery", 'tools', "Class", "com/panel", "LS", "custom/set", "./gconf", "dialog", "item/all"
], function ($, tools, Class, Panel, LS, custom, gConf, dialog, allItems) {
  'use strict';
  // 将js名引用转化为js文件路径
  // 支持一个js名对应多个js文件，包括依赖和补丁
  function defaultJSPath(jsName) {
    return /^\/\/|^https*:\/\//.test(jsName) ? jsName : '/online/' + jsName + ".js"
  }
  // 获取js模块对应的js文件
  function getJSPath(jsName) {
    // 为了兼容旧版私有组件中对appcore的引用
    // 后面迁移完毕后，再进行私有组件改造，去掉appcore的使用
    if (jsName === "appcore") {
      return [
        getJSPath("zepto"),
        gConf.item.share.jsFile,
        defaultJSPath('share'),
        gConf.item.app.jsFile,
        defaultJSPath('app')
      ]
    }
    // 特殊的分享组件
    if (jsName === 'share') {
      return [
        getJSPath("zepto"),
        gConf.item.share.jsFile,
        defaultJSPath('share')
      ]
    }
    // 特殊的app组件
    if (jsName === "app") {
      return [
        getJSPath("zepto"),
        gConf.item.app.jsFile,
        defaultJSPath('app')
      ]
    }
    // 其他文件映射
    return gConf.commonFile[jsName + ".js"] || defaultJSPath(jsName);
  }
  // 计算css路径
  function getCssPath(cssName) {
    return '/online/css/' + cssName + ".css"
  }
  // 当一个组件被移除，检查剩余的组件是否只有META组件，如果是，则展开META组件
  Panel.msg.bindMsg("panel.remove", function () {
    let meta = Panel.get("pageMetaInfo");
    if ($(gConf.mainWrap).find(".panel").length === 1) {
      meta && meta.expand();
    }
  });

  return {
    // 异步读取所有组件的配置
    readFromPage() {
      return new Promise(function (resolve, reject) {
        var jobs = [];
        // 遍历配置面板，全部改成异步面板获取get内容
        $(gConf.mainWrap).find(".panel").each(function () {
          var id = this.id;
          var obj = Panel.get(id);
          var content;
          if (obj && obj.get) {
            // 调用get前首先重置一下错误缓存
            obj.error && obj.error(null);
            content = obj.get() || '';
            if ($.isFunction(content.then)) {
              // 保存obj信息到promise结果
              jobs.push(new Promise(function (resolve, reject) {
                content.then(function (htmlStr) {
                  resolve({
                    obj: obj,
                    html: htmlStr
                  });
                }, function (err) {
                  resolve({
                    obj: obj,
                    html: '',
                    err: err
                  });
                });
              }));
            } else if (typeof content === 'string') {
              // 同步任务
              jobs.push(Promise.resolve({
                obj: obj,
                html: content
              }));
            } else {
              // meta组件返回一个json对象，没有直接的内容输出
              jobs.push(Promise.resolve({
                obj: obj,
                html: 'nohtml'
              }));
            }
          }
        });
        // 全部组件的get方法完成后遍历结果
        Promise.all(jobs).then(function (retArr) {
          var dependJS = [];
          var dependCss = [];
          var errorInfo = [];
          var html = [];
          // 强制引入 postMessage 组件的入口判断文件，以自动适应 iframe 通讯需要
          dependJS.push(getJSPath("_pm"));
          $.each(retArr, function (i, ret) {
            var obj = ret.obj;
            var content = ret.html;
            // 处理依赖的js
            if (content && $.isArray(obj.dependJS)) {
              $.each(obj.dependJS, function (i, js) {
                // 计算当前js的访问路径，支持一个js名对应多个js文件
                var f = getJSPath(js);
                if ($.isArray(f)) {
                  $.each(f, function (i, ff) {
                    if (ff && $.inArray(ff, dependJS) < 0) {
                      dependJS.push(ff);
                    }
                  });
                } else if ($.inArray(f, dependJS) < 0) {
                  dependJS.push(f);
                }
              });
            }
            // 处理依赖的css
            if (content && $.isArray(obj.dependCss)) {
              $.each(obj.dependCss, function (i, css) {
                var f = getCssPath(css);
                if ($.inArray(f, dependCss) < 0) {
                  dependCss.push(f);
                }
              });
            }
            // 合并html代码
            if (content && content !== "nohtml") {
              html.push(content);
            }
            // 收集错误信息
            if (obj.errorNum || ret.err) {
              errorInfo.push({
                name: obj.NAME,
                num: obj.errorNum || 1
              });
            }
          });
          // 如果设置了兼容PC，则增加兼容代码
          if (gConf.func.careForPC) {
            dependJS.push(getJSPath("careForPC"));
          }
          // 合并结果并返回
          resolve({
            pageContent: html.join(""),
            dependJS: dependJS,
            dependCss: dependCss,
            error: errorInfo
          });
        }).catch(function (e) {
          // 出现错误则重置页面内容给予提示
          resolve({
            pageContent: 'Page Error!<br>' + e,
            dependJS: [],
            dependCss: [],
            error: [{
              name: "js-code-error",
              num: 1
            }]
          });
        });
      });
    },

    // 加载指定的配置内容
    load(conf, init) {
      if (!$.isArray(conf)) {
        return Promise.reject();
      }
      // 清空已有的配置
      this.clear(true);
      // 载入新的配置
      var allJob = Promise.resolve();
      $.each(conf, function (i, cfg) {
        // 异步串行每个配置组件的加载
        allJob = allJob.then(function () {
          return new Promise(function (resolve) {
            // 格式错误的话，直接忽略，然后继续
            if (!cfg.k || !cfg.c) {
              return resolve();
            }
            // 从组件列表中查找组件
            var cls = Class.Page[cfg.k.toUpperCase()];
            // 检查并动态加载私有组件（如果需要）
            (function (next) {
              if (cls && cls.create) {
                return next(cls)
              }
              // 支持私有组件的则动态加载
              if (gConf.func.customItem && cfg.f) {
                allItems.loadCustomItem(cfg.f).then(function (cls) {
                  if (cls && cls.create) {
                    custom.add(cfg.f);
                    return next(cls);
                  } else if (cls.err) {
                    dialog.toast(cls.err);
                  }
                  resolve();
                });
                return;
              }
              resolve();
            })(function (cls) {
              var com = cls.create();
              if (com.load) {
                com.load(cfg.c);
                if (init && com.name !== "meta") {
                  com.collapse();
                }
              }
              resolve();
            });
          });
        });
      });
      return allJob;
    },

    // 获取页面中的配置内容
    save() {
      var conf = [];
      var Panel = Class.Page.Panel;
      var meta = Panel.get("pageMetaInfo");
      // meta特殊处理
      conf[0] = {
        k: meta.name,
        c: meta.save()
      };
      $(gConf.mainWrap).find(".panel").each(function () {
        var id = this.id;
        var obj = Panel.get(id);
        if (obj && obj.save && id !== "pageMetaInfo") {
          conf.push({
            k: obj.name,
            c: obj.save(),
            // 检查私有组件的代码路径
            f: obj.customFile
          });
        }
      });
      return conf;
    },

    // 保存为字符串配置
    saveString() {
      return JSON.stringify(this.save());
    },

    // 清理配置区域
    clear(keepNull) {
      window._preview_myLastY = 0;
      Class.Page.Panel.each(function (i, obj) {
        obj.del(true);
      });
      // 初始化页面Meta配置
      if (!keepNull) {
        Class.Page.META.create();
      }
    }
  }
});
