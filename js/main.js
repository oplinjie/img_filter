/*
author: linjie
date: 2015/12/31
*/

$(function() {
	var filter = {
		canvas: document.querySelector('#canvas'), //使用原生接口
		$canvas: $('#canvas'), //使用zepto方法
		flag: 0, // 是否显示过底部
		imgdata: null,
		ctx: null,
		footerH: 0, //底部高度

		init: function() {
			filter.footerH = $('.Grayscale').height();
			$('.footer').css('height', filter.footerH);
			$('.save').css('padding-bottom', filter.footerH + 20);

			//居中
			var width = document.getElementById("form").clientWidth / 2;
			$('#form').css('margin-left', '-' + width + 'px');

			if (typeof FileReader == 'undefined') {
				$('.tips').InnerHTML = "<p>你的浏览器不支持FileReader接口！</p>";
				//使选择控件不可操作  
				input.setAttribute("disabled", "disabled");
			} else {
				$("#imgInp").change(function() {
					filter.readURL(this);
				});
			}
		},

		readURL: function(input) {
			if (input.files && input.files[0]) {
				var reader = new FileReader();
				//成功读取
				reader.onload = function(e) {
					// console.log(e.target.result);
					filter.createImage(e.target.result);
				};
				//将文件读取为DataURL
				reader.readAsDataURL(input.files[0]);
			}
		},

		createImage: function(src) {
			var img = new Image();
			img.src = src;
			img.addEventListener('load', function(e) {
				filter.imgdata = filter.getPixels(img);
				// console.log(filter.imgdata);
				if (filter.flag == 0) {
					filter.showCanvas();
				}
				filter.addEvent(img);
			});
		},

		getPixels: function(img) {
			filter.ctx = filter.canvas.getContext('2d');
			filter.canvas.height = img.height;
			filter.canvas.width = img.width;
			filter.ctx.drawImage(img, 0, 0, img.width, img.height);
			return filter.ctx.getImageData(0, 0, img.width, img.height);
		},

		showCanvas: function() {
			$('#form').css('margin-left', 0);
			$('.footer, #form, #canvas, .save').addClass('show');
			$('.text').html('Reselect a photo');
			filter.flag = 1;
		},

		addEvent: function(img) {
			var choices = ['Grayscale', 'Brighten', 'Sharpen', 'Blur'],
				choiceName, datas = [],
				delta = 0,
				blur = 0,
				dataLength,
				temp = ['origin', img],
				mix = 0;
			datas[0] = temp;

			$('.choice').each(function(idx) {
				$('.choice').eq(idx).tap(function() {

					$('.result').css({
						'bottom': '-20%'
					});

					var oImg = new Image();
					choiceName = $(this).parent().attr('class');

					if (choiceName == 'Grayscale') {
						oImg.src = filter.Grayscale();
						datas.push(['Grayscale', oImg]);
					} else if (choiceName == 'Brighten') {
						oImg.src = filter.Brighten(delta += 5);
						datas.push(['Brighten', oImg]);
					} else if (choiceName == 'Blur') {
						oImg.src = filter.Blur(blur += 2);
						datas.push(['Blur', oImg]);
					} else if (choiceName == 'Sharpen') {
						if (mix < 1) {
							oImg.src = filter.Sharpen(mix += 0.2);
							datas.push(['Sharpen', oImg]);
						}
					} else if (choiceName == 'Undo') {
						dataLength = datas.length;

						if (dataLength > 1) {
							temp = datas.pop();
							filter.ctx.drawImage(datas[dataLength - 2][1], 0, 0, img.width, img.height);
							filter.imgdata = filter.ctx.getImageData(0, 0, img.width, img.height);
							if (temp[0] == 'Sharpen') {
								mix -= 0.2
							} else if (temp[0] == 'Brighten') {
								delta -= 5;
								console.log(delta);
							}
						} else {
							$('.result').css({
								'bottom': filter.footerH
							});
						}

					}
				})
			});


			$('.save a').tap(function() {
				filter.save();
			})
		},

		Grayscale: function() {
			console.log('Grayscale');

			var d = filter.imgdata.data,
				w = filter.imgdata.width,
				h = filter.imgdata.height;

			for (var y = 0; y < h; y++) {
				for (var x = 0; x < w; x++) {
					var i = (y * 4) * w + x * 4;
					var avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
					d[i] = d[i + 1] = d[i + 2] = avg;
				}
			}
			filter.ctx.putImageData(filter.imgdata, 0, 0);
			// return filter.imgdata;
			// return filter.ctx.getImageData(0, 0, w, h);
			return filter.canvas.toDataURL();
		},

		Brighten: function(delta) {
			console.log('Brighten', delta);

			var d = filter.imgdata.data,
				w = filter.imgdata.width,
				h = filter.imgdata.height;

			for (var y = 0; y < h; y++) {
				for (var x = 0; x < w; x++) {
					var i = (y * 4) * w + x * 4;
					d[i] += delta;
					d[i + 1] += delta;
					d[i + 2] += delta;
				}
			}
			filter.ctx.putImageData(filter.imgdata, 0, 0);
			// return filter.imgdata;
			return filter.canvas.toDataURL();
		},

		Sharpen: function(mix) {
			console.log('Sharpen');

			var weights = [0, -1, 0, -1, 5, -1, 0, -1, 0], //对称的矩阵
				//不对称的话将得到一个 darker or a lighter image
				d = filter.imgdata.data,
				w = filter.imgdata.width,
				h = filter.imgdata.height,
				katet = Math.round(Math.sqrt(weights.length)),
				half = (katet * 0.5) | 0,
				dstData = filter.ctx.createImageData(w, h),
				dstBuff = dstData.data,
				srcBuff = d,
				y = h;
			// console.log(katet,half,dstData,dstBuff,srcBuff,y);

			while (y--) {
				x = w;
				while (x--) {
					var sy = y,
						sx = x,
						dstOff = (y * w + x) * 4,
						r = 0,
						g = 0,
						b = 0,
						a = 0;

					for (var cy = 0; cy < katet; cy++) {
						for (var cx = 0; cx < katet; cx++) {

							var scy = sy + cy - half;
							var scx = sx + cx - half;

							if (scy >= 0 && scy < h && scx >= 0 && scx < w) {

								var srcOff = (scy * w + scx) * 4;
								var wt = weights[cy * katet + cx];

								r += srcBuff[srcOff] * wt;
								g += srcBuff[srcOff + 1] * wt;
								b += srcBuff[srcOff + 2] * wt;
								a += srcBuff[srcOff + 3] * wt;
							}
						}
					}

					dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
					dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
					dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix)
					dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
					// console.log(y,x);
				}
			}

			filter.ctx.putImageData(dstData, 0, 0);
			return filter.canvas.toDataURL();
		},

		Blur: function(blur) {
			console.log('Blur');
			// filter.canvas.style.webkitFilter = "blur(" + blur + "px)";

			var d = filter.imgdata.data,
				w = filter.imgdata.width,
				h = filter.imgdata.height;
			for (var i = 0, n = d.length; i < n; i += 4) {

				iMW = 4 * w;
				iSumOpacity = iSumRed = iSumGreen = iSumBlue = 0;
				iCnt = 0;

				aCloseData = [
					i - iMW - 4, i - iMW, i - iMW + 4, // top pixels
					i - 4, i + 4, // middle pixels
					i + iMW - 4, i + iMW, i + iMW + 4 // bottom pixels
				];

				// 计算所有像素的总和
				for (e = 0; e < aCloseData.length; e += 1) {
					if (aCloseData[e] >= 0 && aCloseData[e] <= d.length - 3) {
						iSumOpacity += d[aCloseData[e]];
						iSumRed += d[aCloseData[e] + 1];
						iSumGreen += d[aCloseData[e] + 2];
						iSumBlue += d[aCloseData[e] + 3];
						iCnt += 1;
					}
				}

				// 平均值
				d[i] = iSumOpacity / iCnt;
				d[i + 1] = iSumRed / iCnt;
				d[i + 2] = iSumGreen / iCnt;
				d[i + 3] = iSumBlue / iCnt;
			}
			filter.ctx.putImageData(filter.imgdata, 0, 0);
			return filter.canvas.toDataURL();
		},

		save: function() {
			var image = filter.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
			// console.log(image);
			var w = window.open('about:blank', 'image from canvas');
			w.document.write("<img src='" + filter.canvas.toDataURL("image/png") + "' alt='from canvas'/>");
			// window.location.href = image;
		}
	}

	filter.init();
});