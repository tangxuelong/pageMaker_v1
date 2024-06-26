(function(factory){
    define(["jquery"], function($){
        return factory($);
    });
})(function(e) {
    var t = function() {
        var t = 65,
            n = '<div class="colorpicker"><div class="colorpicker_color"><div><div></div></div></div><div class="colorpicker_hue"><div></div></div><div class="colorpicker_new_color"></div><div class="colorpicker_current_color"></div><div class="colorpicker_hex"><label for="hex">#</label><input type="text" maxlength="6" size="6" id="hex" /></div><div class="colorpicker_rgb_r colorpicker_field"><label for="rbg_r">R</label><input type="text" maxlength="3" size="3" id="rgb_r" /><span></span></div><div class="colorpicker_rgb_g colorpicker_field"><label for="rbg_g">G</label><input type="text" maxlength="3" size="3" id="rgb_g" /><span></span></div><div class="colorpicker_rgb_b colorpicker_field"><label for="rbg_b">B</label><input type="text" maxlength="3" size="3" id="rgb_b" /><span></span></div><div class="colorpicker_hsb_h colorpicker_field"><label for="hsb_h">H</label><input type="text" maxlength="3" size="3" id="hsb_h" /><span></span></div><div class="colorpicker_hsb_s colorpicker_field"><label for="hsb_s">S</label><input type="text" maxlength="3" size="3" id="hsb_s" /><span></span></div><div class="colorpicker_hsb_b colorpicker_field"><label for="hsb_b">B</label><input type="text" maxlength="3" size="3" id="hsb_b" /><span></span></div><div class="colorpicker_submit"></div></div>',
            r = {
                eventName: "click",
                onShow: function() {},
                onBeforeShow: function() {},
                onHide: function() {},
                onChange: function() {},
                onSubmit: function() {},
                color: "ff0000",
                livePreview: !0,
                flat: !1
            },
            i = function(t, n) {
                var r = HSBToRGB(t);
                e(n).data("colorpicker").fields.eq(1).val(r.r).end().eq(2).val(r.g).end().eq(3).val(r.b).end()
            },
            s = function(t, n) {
                e(n).data("colorpicker").fields.eq(4).val(t.h).end().eq(5).val(t.s).end().eq(6).val(t.b).end()
            },
            o = function(t, n) {
                e(n).data("colorpicker").fields.eq(0).val(HSBToHex(t)).end()
            },
            u = function(t, n) {
                e(n).data("colorpicker").selector.css("backgroundColor", "#" + HSBToHex({
                    h: t.h,
                    s: 100,
                    b: 100
                }));
                e(n).data("colorpicker").selectorIndic.css({
                    left: parseInt(150 * t.s / 100, 10),
                    top: parseInt(150 * (100 - t.b) / 100, 10)
                })
            },
            a = function(t, n) {
                e(n).data("colorpicker").hue.css("top", parseInt(150 - 150 * t.h / 360, 10))
            },
            f = function(t, n) {
                e(n).data("colorpicker").currentColor.css("backgroundColor", "#" + HSBToHex(t))
            },
            l = function(t, n) {
                e(n).data("colorpicker").newColor.css("backgroundColor", "#" + HSBToHex(t))
            },
            c = function(n) {
                var r = n.charCode || n.keyCode || -1;
                if (r > t && r <= 90 || r === 32) return !1;
                var i = e(this).parent().parent();
                i.data("colorpicker").livePreview === !0 && h.apply(this)
            },
            h = function(t) {
                var n = e(this).parent().parent(),
                    r;
                this.parentNode.className.indexOf("_hex") > 0 ? n.data("colorpicker").color = r = HexToHSB(fixHex(this.value)) : this.parentNode.className.indexOf("_hsb") > 0 ? n.data("colorpicker").color = r = fixHSB({
                    h: parseInt(n.data("colorpicker").fields.eq(4).val(), 10),
                    s: parseInt(n.data("colorpicker").fields.eq(5).val(), 10),
                    b: parseInt(n.data("colorpicker").fields.eq(6).val(), 10)
                }) : n.data("colorpicker").color = r = RGBToHSB(fixRGB({
                    r: parseInt(n.data("colorpicker").fields.eq(1).val(), 10),
                    g: parseInt(n.data("colorpicker").fields.eq(2).val(), 10),
                    b: parseInt(n.data("colorpicker").fields.eq(3).val(), 10)
                }));
                if (t) {
                    i(r, n.get(0));
                    o(r, n.get(0));
                    s(r, n.get(0))
                }
                u(r, n.get(0));
                a(r, n.get(0));
                l(r, n.get(0));
                n.data("colorpicker").onChange.apply(n, [r, HSBToHex(r), HSBToRGB(r)])
            },
            p = function(t) {
                var n = e(this).parent().parent();
                n.data("colorpicker").fields.parent().removeClass("colorpicker_focus")
            },
            d = function() {
                t = this.parentNode.className.indexOf("_hex") > 0 ? 70 : 65;
                e(this).parent().parent().data("colorpicker").fields.parent().removeClass("colorpicker_focus");
                e(this).parent().addClass("colorpicker_focus")
            },
            v = function(t) {
                var n = e(this).parent().find("input").focus(),
                    r = {
                        el: e(this).parent().addClass("colorpicker_slider"),
                        max: this.parentNode.className.indexOf("_hsb_h") > 0 ? 360 : this.parentNode.className.indexOf("_hsb") > 0 ? 100 : 255,
                        y: t.pageY,
                        field: n,
                        val: parseInt(n.val(), 10),
                        preview: e(this).parent().parent().data("colorpicker").livePreview
                    };
                e(document).on("mouseup", r, g);
                e(document).on("mousemove", r, m)
            },
            m = function(e) {
                e.data.field.val(Math.max(0, Math.min(e.data.max, parseInt(e.data.val + e.pageY - e.data.y, 10))));
                e.data.preview && h.apply(e.data.field.get(0), [!0]);
                return !1
            },
            g = function(t) {
                h.apply(t.data.field.get(0), [!0]);
                t.data.el.removeClass("colorpicker_slider").find("input").focus();
                e(document).off("mouseup", g);
                e(document).off("mousemove", m);
                return !1
            },
            b = function(t) {
                var n = {
                    cal: e(this).parent(),
                    y: e(this).offset().top
                };
                n.preview = n.cal.data("colorpicker").livePreview;
                e(document).on("mouseup", n, E);
                e(document).on("mousemove", n, w)
            },
            w = function(e) {
                h.apply(e.data.cal.data("colorpicker").fields.eq(4).val(parseInt(360 * (150 - Math.max(0, Math.min(150, e.pageY - e.data.y))) / 150, 10)).get(0), [e.data.preview]);
                return !1
            },
            E = function(t) {
                i(t.data.cal.data("colorpicker").color, t.data.cal.get(0));
                o(t.data.cal.data("colorpicker").color, t.data.cal.get(0));
                e(document).off("mouseup", E);
                e(document).off("mousemove", w);
                return !1
            },
            S = function(t) {
                y = e(this).offset().top;
                preview = t.data.cal.data("colorpicker").livePreview;
                h.apply(t.data.cal.data("colorpicker").fields.eq(4).val(parseInt(360 * (150 - Math.max(0, Math.min(150, t.pageY - y))) / 150, 10)).get(0), [preview])
            };
        downSelector = function(t) {
            var n = {
                cal: e(this).parent(),
                pos: e(this).offset()
            };
            n.preview = n.cal.data("colorpicker").livePreview;
            e(document).on("mouseup", n, upSelector);
            e(document).on("mousemove", n, moveSelector);
            e(".colorpicker_color").one("click", n, moveSelector)
        }, moveSelector = function(e) {
            h.apply(e.data.cal.data("colorpicker").fields.eq(6).val(parseInt(100 * (150 - Math.max(0, Math.min(150, e.pageY - e.data.pos.top))) / 150, 10)).end().eq(5).val(parseInt(100 * Math.max(0, Math.min(150, e.pageX - e.data.pos.left)) / 150, 10)).get(0), [e.data.preview]);
            return !1
        }, upSelector = function(t) {
            var n = {
                cal: e(this).parent(),
                pos: e(this).offset()
            };
            i(t.data.cal.data("colorpicker").color, t.data.cal.get(0));
            o(t.data.cal.data("colorpicker").color, t.data.cal.get(0));
            e(document).off("mouseup", upSelector);
            e(document).off("mousemove", moveSelector);
            return !1
        }, enterSubmit = function(t) {
            e(this).addClass("colorpicker_focus")
        }, leaveSubmit = function(t) {
            e(this).removeClass("colorpicker_focus")
        }, clickSubmit = function(t) {
            var n = e(this).parent(),
                r = n.data("colorpicker").color;
            n.data("colorpicker").origColor = r;
            f(r, n.get(0));
            n.data("colorpicker").onSubmit(r, HSBToHex(r), HSBToRGB(r), n.data("colorpicker").el, n.data("colorpicker").parent)
        }, show = function(t) {
            var n = e("#" + e(this).data("colorpickerId"));
            n.data("colorpicker").onBeforeShow.apply(this, [n.get(0)]);
            var r = e(this).offset(),
                i = getViewport(),
                s = r.top + this.offsetHeight,
                o = r.left;
            s + 176 > i.t + i.h && (s -= this.offsetHeight + 176);
            o + 356 > i.l + i.w && (o -= 356);
            n.css({
                left: o + "px",
                top: s + "px"
            });
            n.data("colorpicker").onShow.apply(this, [n.get(0)]) != 0 && n.show();
            e(document).on("mousedown", {
                cal: n
            }, hide);
            return !1
        }, hide = function(t) {
            if (!isChildOf(t.data.cal.get(0), t.target, t.data.cal.get(0))) {
                t.data.cal.data("colorpicker").onHide.apply(this, [t.data.cal.get(0)]) != 0 && t.data.cal.hide();
                e(document).off("mousedown", hide)
            }
        }, isChildOf = function(e, t, n) {
            if (e === t) return !0;
            if (e.contains) return e.contains(t);
            if (e.compareDocumentPosition) return !!(e.compareDocumentPosition(t) & 16);
            var r = t.parentNode;
            while (r && r !== n) {
                if (r === e) return !0;
                r = r.parentNode
            }
            return !1
        }, getViewport = function() {
            var e = document.compatMode == "CSS1Compat";
            return {
                l: window.pageXOffset || (e ? document.documentElement.scrollLeft : document.body.scrollLeft),
                t: window.pageYOffset || (e ? document.documentElement.scrollTop : document.body.scrollTop),
                w: window.innerWidth || (e ? document.documentElement.clientWidth : document.body.clientWidth),
                h: window.innerHeight || (e ? document.documentElement.clientHeight : document.body.clientHeight)
            }
        }, fixHSB = function(e) {
            return {
                h: Math.min(360, Math.max(0, e.h)),
                s: Math.min(100, Math.max(0, e.s)),
                b: Math.min(100, Math.max(0, e.b))
            }
        }, fixRGB = function(e) {
            return {
                r: Math.min(255, Math.max(0, e.r)),
                g: Math.min(255, Math.max(0, e.g)),
                b: Math.min(255, Math.max(0, e.b))
            }
        }, fixHex = function(e) {
            var t = 6 - e.length;
            if (t > 0) {
                var n = [];
                for (var r = 0; r < t; r++) n.push("0");
                n.push(e);
                e = n.join("")
            }
            return e
        }, HexToRGB = function(e) {
            e = parseInt(e.indexOf("#") > -1 ? e.substring(1) : e, 16);
            return {
                r: e >> 16,
                g: (e & 65280) >> 8,
                b: e & 255
            }
        }, HexToHSB = function(e) {
            return RGBToHSB(HexToRGB(e))
        }, RGBToHSB = function(e) {
            var t = {
                    h: 0,
                    s: 0,
                    b: 0
                },
                n = Math.min(e.r, e.g, e.b),
                r = Math.max(e.r, e.g, e.b),
                i = r - n;
            t.b = r;
            t.s = r != 0 ? 255 * i / r : 0;
            t.s != 0 ? e.r === r ? t.h = (e.g - e.b) / i : e.g === r ? t.h = 2 + (e.b - e.r) / i : t.h = 4 + (e.r - e.g) / i : t.h = -1;
            t.h *= 60;
            t.h < 0 && (t.h += 360);
            t.s *= 100 / 255;
            t.b *= 100 / 255;
            return t
        }, HSBToRGB = function(e) {
            var t = {},
                n = Math.round(e.h),
                r = Math.round(e.s * 255 / 100),
                i = Math.round(e.b * 255 / 100);
            if (r == 0) t.r = t.g = t.b = i;
            else {
                var s = i,
                    o = (255 - r) * i / 255,
                    u = (s - o) * (n % 60) / 60;
                n === 360 && (n = 0);
                if (n < 60) {
                    t.r = s;
                    t.b = o;
                    t.g = o + u
                } else if (n < 120) {
                    t.g = s;
                    t.b = o;
                    t.r = s - u
                } else if (n < 180) {
                    t.g = s;
                    t.r = o;
                    t.b = o + u
                } else if (n < 240) {
                    t.b = s;
                    t.r = o;
                    t.g = s - u
                } else if (n < 300) {
                    t.b = s;
                    t.g = o;
                    t.r = o + u
                } else if (n < 360) {
                    t.r = s;
                    t.g = o;
                    t.b = s - u
                } else {
                    t.r = 0;
                    t.g = 0;
                    t.b = 0
                }
            }
            return {
                r: Math.round(t.r),
                g: Math.round(t.g),
                b: Math.round(t.b)
            }
        }, RGBToHex = function(t) {
            var n = [t.r.toString(16), t.g.toString(16), t.b.toString(16)];
            e.each(n, function(e, t) {
                t.length === 1 && (n[e] = "0" + t)
            });
            return n.join("")
        }, RGBstringToHex = function(e) {
            function n(e) {
                return ("0" + parseInt(e, 10).toString(16)).slice(-2)
            }
            if (!e) return "#FFFFFF";
            var t = e.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            return t ? "#" + n(t[1]) + n(t[2]) + n(t[3]) : e
        }, HSBToHex = function(e) {
            return RGBToHex(HSBToRGB(e))
        }, restoreOriginal = function() {
            var t = e(this).parent(),
                n = t.data("colorpicker").origColor;
            t.data("colorpicker").color = n;
            i(n, t.get(0));
            o(n, t.get(0));
            s(n, t.get(0));
            u(n, t.get(0));
            a(n, t.get(0));
            l(n, t.get(0))
        };
        return {
            init: function(t) {
                t = e.extend({}, r, t || {});
                if (typeof t.color == "string") t.color.substring(0, 4) == "rgb(" ? t.color = HexToHSB(RGBstringToHex(t.color)) : t.color = HexToHSB(t.color);
                else if (t.color.r !== undefined && t.color.g !== undefined && t.color.b !== undefined) t.color = RGBToHSB(t.color);
                else {
                    if (t.color.h === undefined || t.color.s === undefined || t.color.b === undefined) return this;
                    t.color = fixHSB(t.color)
                }
                return this.each(function() {
                    if (!e(this).data("colorpickerId")) {
                        var r = e.extend({}, t);
                        r.origColor = t.color;
                        var m, g = 0;
                        m = e("#colorpicker_" + g).length === 0;
                        while (!m) {
                            g = parseInt(Math.random() * 1e4);
                            m = e("#colorpicker_" + g).length === 0
                        }
                        var y = "colorpicker_" + g;
                        e(this).data("colorpickerId", y);
                        r.parent = e(this);
                        var w = e(n);
                        w.attr("id", y).attr("data-parent", e(this).attr("id"));
                        r.flat ? w.appendTo(this).show() : w.appendTo(document.body);
                        r.fields = w.find("input").on("keyup", c).on("change", h).on("blur", p).on("focus", d);
                        w.find("span").on("mousedown", v).end().find(">div.colorpicker_current_color").on("click", restoreOriginal);
                        r.selector = w.find("div.colorpicker_color").on("mousedown", downSelector);
                        r.selectorIndic = r.selector.find("div div");
                        r.el = this;
                        r.hue = w.find("div.colorpicker_hue div");
                        w.find("div.colorpicker_hue").on("mousedown", b);
                        w.find("div.colorpicker_hue").on("click", {
                            cal: w
                        }, S);
                        r.newColor = w.find("div.colorpicker_new_color");
                        r.currentColor = w.find("div.colorpicker_current_color");
                        w.data("colorpicker", r);
                        w.find("div.colorpicker_submit").on("mouseenter", enterSubmit).on("mouseleave", leaveSubmit).on("click", clickSubmit);
                        i(r.color, w.get(0));
                        s(r.color, w.get(0));
                        o(r.color, w.get(0));
                        a(r.color, w.get(0));
                        u(r.color, w.get(0));
                        f(r.color, w.get(0));
                        l(r.color, w.get(0));
                        r.flat ? w.css({
                            position: "relative",
                            display: "block"
                        }) : e(this).on(r.eventName, show)
                    }
                })
            },
            showPicker: function() {
                return this.each(function() {
                    e(this).data("colorpickerId") && show.apply(this)
                })
            },
            hidePicker: function() {
                return this.each(function() {
                    e(this).data("colorpickerId") && e("#" + e(this).data("colorpickerId")).hide()
                })
            },
            setColor: function(t) {
                if (typeof t == "string") t.substring(0, 4) == "rgb(" ? t = HexToHSB(RGBstringToHex(t)) : t = HexToHSB(t);
                else if (t.r !== undefined && t.g !== undefined && t.b !== undefined) t = RGBToHSB(t);
                else {
                    if (t.h === undefined || t.s === undefined || t.b === undefined) return this;
                    t = fixHSB(t)
                }
                return this.each(function() {
                    if (e(this).data("colorpickerId")) {
                        var n = e("#" + e(this).data("colorpickerId"));
                        n.data("colorpicker").color = t;
                        n.data("colorpicker").origColor = t;
                        i(t, n.get(0));
                        s(t, n.get(0));
                        o(t, n.get(0));
                        a(t, n.get(0));
                        u(t, n.get(0));
                        f(t, n.get(0));
                        l(t, n.get(0))
                    }
                })
            }
        }
    }();
    e.fn.extend({
        ColorPicker: t.init,
        ColorPickerHide: t.hidePicker,
        ColorPickerShow: t.showPicker,
        ColorPickerSetColor: t.setColor
    })
});
