(function ($) {
  function getRndId() {
    return "qrcode" + Math.random().toString(16).slice(6);
  }
  window.makeQrCode = function (holderID, conf) {
    $(document).ready(function () {
      var id = getRndId();
      var holder = $("#" + holderID);
      if (!holder[0]) {
        return;
      }
      var size = holder.width();
      holder.after('<div id="' + id + '"></div>');
      if (window.QRCode) {
        /* eslint-disable */
        new QRCode(id, {
          text: conf.text || document.URL,
          width: size,
          height: size,
          colorDark: conf.dark,
          colorLight: conf.light
        });
        holder.remove();
      }
    });
  };
  window.makeQrCode2 = function (conf, preview) {
    var id = getRndId();
    var size = conf.size || 200;
    document.write('<div id="' + id + '"></div>');
    if (window.QRCode) {
      new QRCode(id, {
        text: conf.text || document.URL,
        width: size,
        height: size,
        colorDark: conf.dark,
        colorLight: conf.light
      });
      if (conf.info) {
        $("#" + id).append('<span style="color:' + conf.dark + '" class="qrcode-info">' + conf.info + '</span>');
      }
      if (preview) {
        $("#" + id).closest("section").show();
      }
    }
  };
})(window.Zepto || window.jQuery);
