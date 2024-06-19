define(["com/set"], function (SET) {
  return {
    parse: function (text) {
      // 删除空格、多余的换行等
      var conf = text.replace(/\r/g, "\n")
        .replace(/\n[\n\s\xa0\u3000]*\n/g, "\n")
        .replace(/(?:^\n+|\n+$)/, "");
      if (!conf) {
        return "";
      }
      // 排重
      var files = conf.split("\n");
      var ok = [];
      var map = {};
      var n = files.length;
      var i = 0;
      for (; i < n; i++) {
        if (files[i] && !map[files[i]]) {
          ok.push(files[i]);
          map[files[i]] = true;
        }
      }
      return ok.join("\n");
    },
    add: function (file) {
      if (!file) {
        return;
      }
      var org = SET.get("items");
      var data = [file];
      if (org) {
        data = org.split("\n");
        // 检查是否已经包含了要添加的内容，如果有，就返回
        if (data.indexOf(file) >= 0) {
          return;
        }
        data.push(file);
      }
      SET.save({
        items: this.parse(data.join("\n"))
      });
      return true;
    }
  }
})
