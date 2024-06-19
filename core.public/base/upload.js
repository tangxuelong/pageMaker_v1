/**
 * js上传模块
 */
define(["jquery"], function($) {
	//指定input[type=file]启动上传
	$.fn.upload = function(fileType, callback, options ) {
		var fileInput = this[0],
			file = fileInput.value,
			ext = file.replace(/.+\.([^\.\/\\]+)$/, "$1").toLowerCase();
		if (fileInput.type !== "file") {
			return this;
		}
		if (!window.FormData) {
			alert("您的浏览器不支持FormData，请更换chrome/firefox等浏览器");
			return this;
		}
		if (fileType.indexOf(ext) < 0) {
			alert("错误的文件类型！");
			callback(1);
			return this;
		}
		var formData = new FormData();
		formData.append("f", fileInput.files[0]);
		$.ajax({
			url: "/open/upload",
			type: 'POST',
			data: formData,
			/**   
			 * 必须false才会避开jQuery对 formdata 的默认处理
			 * XMLHttpRequest会对 formdata 进行正确的处理
			 */
			processData: false,
			/**   
			 *必须false才会自动加上正确的Content-Type
			 */
			contentType: false,
			/**
			 * 监听上传进度
			 */
			// xhrFields: {
			//     onsendstart: function() {
			//         //this是指向XHR
			//         this.upload.addEventListener('progress', progress || $.noop, false);
			//     }
			// },
			success: function(ret) {
				callback(0, ret.f);
			},
			error: function(ret) {
				callback(2, ret.f);
			}
		});

		return this;
	};

	//绑定按钮容器
	$.fn.bindUpload = function(fileType, callback, acting) {
		return this.each(function() {
			var me = $(this),
				position = me.css("position");
			if ({
					"absolute": 1,
					"relative": 1,
					"fixed": 1
				}[position] !== 1) {
				me.css("position", "relative");
			}
			var init = function() {
				me.find(".auto_upload_file").remove();
				var w = me.outerWidth(),
					h = me.outerHeight();
				me.append("<input type='file' class='auto_upload_file'/>");
				//在微信内不隐藏上传框
				var opacity = 0;
				if(navigator.userAgent.toLocaleLowerCase().indexOf("micromessenger") > 0){
					opacity = 0.01;
				}
				me.find(".auto_upload_file").css({
					position: "absolute",
					left: 0,
					top: 0,
					opacity: opacity,
					width: w,
					height: h,
					zIndex: 99
				}).bind("change", function() {
					acting && acting.call(me[0], 1);
					$(this).upload(fileType, function(err, json) {
						acting && acting.call(me[0], 2);
						if (err) {
							return;
						}
						if (json.ok) {
							callback && callback.call(me[0], json);
						} else {
							alert(json.des);
						}
						init();
					});
				});
			};
			init();
		});
	};
});
