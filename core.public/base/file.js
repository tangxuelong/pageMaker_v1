define(["jquery"], function($) {
	//利用html5新的file api在浏览器端获取文件的信息以及内容
	//避免一次服务器上传和下载
	$.fn.getFileInfo = function(fileType, callback) {
		var fileInput = this[0],
			file = fileInput.value,
			ext = file.replace(/.+\.([^\.\/\\]+)$/, "$1").toLowerCase();
		if (fileInput.type !== "file") {
			return this;
		}
		if (!window.File || !window.FileReader) {
			alert("您的浏览器不支持File操作，请更换chrome/firefox等浏览器")
			return this;
		}
		if (fileType.indexOf(ext) < 0) {
			alert("错误的文件类型！");
			callback(1);
			return this;
		}
		var reader = new FileReader(),
			fileObj = fileInput.files[0];
		reader.onload = function(e){
			callback({
				name : fileObj.name,
				size : fileObj.size,
				type : fileObj.type,
				err : e.target.error,
				content : e.target.result
			});
		};
		//根据后缀来读取文件
		switch(ext){
			case "txt":
			case "js":
			case "html":
			case "htm":
			case "css":
			case "json":
			case "md":
				reader.readAsText(fileObj);
				break;
			default:
				reader.readAsDataURL(fileObj);
				break
		}
	};

	//绑定文件信息读取元素
	$.fn.bindFileRead = function(fileType, callback, acting) {
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
				me.find(".auto_read_file").remove();
				var w = me.outerWidth(),
					h = me.outerHeight();
				me.append("<input type='file' class='auto_read_file'/>");
				me.find(".auto_read_file").css({
					position: "absolute",
					left: 0,
					top: 0,
					opacity: 0,
					width: w,
					height: h,
					zIndex: 99
				}).bind("change", function() {
					acting && acting.call(me[0], 1);
					$(this).getFileInfo(fileType, function(info) {
						acting && acting.call(me[0], 2);
						if (info.err) {
							return;
						}
						callback && callback.call(me[0], info);
						init();
					});
				});
			};
			init();
		});
	}
});
