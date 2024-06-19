/**
 * 列表选项
 */
(function ($) {
  $.getOption = function (boxId) {
    var box = $("#option-" + boxId);
    var ret = {
      checked: [],
      note: ''
    };
    if (!box[0]) return ret;
    box.find("[name='" + boxId + "']").each(function () {
      this.checked && ret.checked.push(this.value);
    });
    ret.note = box.find("[name=note]").val();
    return ret;
  };
})(window.Zepto || window.jQuery);
