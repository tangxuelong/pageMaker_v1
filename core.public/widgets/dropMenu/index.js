define(["jquery"], function($){
    var guid = 1,
        getHTML = function( list ) {
            var id = "dropdownMenu" + guid++;
            //插入dom
            var html = ["<div id='", id, "' class='dropdownMenu'>"];
            $.each(list, function(i, obj) {
                
            });
            html.push("</div>");
            $(document.body).append(html.join(""));
            return $("#" + id);
        };

    $.fn.dropMenu = function() {
        return this.each(function() {
            if (this._dropMenuBind) {
                return;
            }
            this._dropMenuBind = true;
            var myMenu, timer, input = $(this);
            $(this).focus(function() {
                timer && window.clearTimeout(timer);
                if (!myMenu) {
                    myMenu = getHTML(this.value);
                }
                var pos = $(this).offset();
                myMenu.css({
                    left: pos.left,
                    top: pos.top + $(this).outerHeight() + 3
                }).delegate(".colorItem", "click", function() {
                    var color = $(this).data("color");
                    input.val(color).trigger("input");
                });
            }).blur(function() {
                timer = window.setTimeout(function() {
                    myMenu && myMenu.remove()
                    myMenu = null;
                    timer = 0;
                }, 200);
            });
        });
    };
});
