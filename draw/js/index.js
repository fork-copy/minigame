//参考 http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
		//要改进， 蜡笔，橡皮擦鼠标样式 找一些其他图片 从本地选图片
		(function(){
			var clickX = [],
				clickY = [],
				clickDrag = [],
				clickColor = [],
				nowColor,
				clickSize = [],
				redoArr = [],
				nowSize,
				context,
				paint,
				nowPenType = "labi",
				penType = [],
				$Canvas,
				crayonTextureImage,
				outlineImage,
				curLoadResNum = 0,
				totalLoadResources = 2,
				config = {
					initColor: '#0f0',
					initPenSize:10,
					canvasHeight : 220,
					canvasWidth : 500,
					undoStep:5
				};
			 
			
			$(function(){
				initPenSizeSelector();
				initColorPicker();
				
				context = getCtx();
				$Canvas = $('#canvas');
				crayonTextureImage = new Image();
				crayonTextureImage.onload = function() { 
					resourceLoaded(); 
				};
				crayonTextureImage.src = "images/crayon-texture.png";
				
				outlineImage = new Image();
				outlineImage.onload = function() { 
					resourceLoaded(); 
				};
				outlineImage.src = "images/watermelon-duck-outline.png";
				
				$Canvas.mousedown(function(e){
				  var mouseX = e.pageX - this.offsetLeft;
				  var mouseY = e.pageY - this.offsetTop;
						
				  paint = true;//开始绘图
				  addClick(mouseX, mouseY, false);
				  redraw();
				});
				
				$Canvas.mousemove(function(e){
				  if(paint){
					addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
					redraw();
				  }
				});
				
				$Canvas.mouseup(function(e){
				  paint = false;
				});
				
				
				$(".undoBtn").click(function(){
					var undoStep = config.undoStep,
						drawStep = clickX.length,
						eachRedo,
						startIndex,
						undoLen;
					if(drawStep == 0){
						return;
					}
					eachRedo = {};
					if(drawStep > undoStep){
						startIndex = drawStep-undoStep;
						undoLen = undoStep;
						
					}else{//清空
						startIndex = 0;
						undoLen = drawStep;
					}
					eachRedo.clickX = clickX.splice(startIndex,undoLen);
					eachRedo.clickY = clickY.splice(startIndex,undoLen);
					eachRedo.clickDrag = clickDrag.splice(startIndex,undoLen);
					eachRedo.clickColor = clickColor.splice(startIndex,undoLen);
					eachRedo.clickSize = clickSize.splice(startIndex,undoLen);
					eachRedo.penType = penType.splice(startIndex,undoLen);
					redoArr.push(eachRedo);
					redraw();

				});
				
				$(".redoBtn").click(function(){
					var prevRedo;
					if(redoArr.length > 0){
						prevRedo = redoArr.pop();
						clickX = clickX.concat(prevRedo.clickX);
						clickY = clickY.concat(prevRedo.clickY);
						clickDrag = clickDrag.concat(prevRedo.clickDrag);
						clickColor = clickColor.concat(prevRedo.clickColor);
						clickSize = clickSize.concat(prevRedo.clickSize);
						penType = penType.concat(prevRedo.penType);

					}
					redraw();
				});

				$("[name=penType]").click(function(){
					nowPenType = this.value;
					// $Canvas.css({
					// 	cursor:"url(images/" +  nowPenType + ".cur)"
					// });
				});

				$(".selectPicBtn,.helpBtn").click(function(){
					alert("功能制作中。。。");
				});

				$(".resetDrawBtn").click(function(){
					clickX = [];
					clickY = [];
					clickColor = [];
					clickSize = [];
					clickDrag = [];
					penType =[];
			  		redoArr = [];
			  		redraw();
				})


				$(".saveAsBtn").click(function(){
					$("#outputImg").attr("src",$("#canvas")[0].toDataURL());
				});

				
			});
			function initPenSizeSelector(){
				var $slectSizeShow = $("#slectSizeShow");
				nowSize = config.initPenSize;
				$slectSizeShow.html(nowSize);
				$("#selectSize").noUiSlider({
					range: [1, 25],
					start: 10,
					handles: 1,
					step:1,
					slide: function(){
					  nowSize = $(this).val();
					  $slectSizeShow.html(nowSize);
					}
				});
			};
			function initColorPicker(){
				nowColor = config.initColor;
				$("#colorPicker").spectrum({
					color:config.initColor,
					showPaletteOnly: true,
					showPalette: true,
					   palette: [
						["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", /*"rgb(153, 153, 153)","rgb(183, 183, 183)",*/
						"rgb(204, 204, 204)", "rgb(217, 217, 217)", /*"rgb(239, 239, 239)", "rgb(243, 243, 243)",*/ "rgb(255, 255, 255)"],
						["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
						"rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
						["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
						"rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
						"rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
						"rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
						"rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
						"rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
						"rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
						"rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
						"rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
						"rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
					],
					change: function(color) {
						nowColor = color.toHexString();
					}
				});
			};
			function getCtx(){
				var canvasDiv = document.getElementById('canvasDiv');
					canvas = document.createElement('canvas');
					canvas.setAttribute('width', config.canvasWidth);
					canvas.setAttribute('height', config.canvasHeight);
					canvas.setAttribute('id', 'canvas');
					canvasDiv.appendChild(canvas);
				if(typeof G_vmlCanvasManager != 'undefined') {
					canvas = G_vmlCanvasManager.initElement(canvas);
				}
				context = canvas.getContext("2d");
				return context;
			};
			
			
			function addClick(x, y, dragging)
			{
			  clickX.push(x);
			  clickY.push(y);
			  clickColor.push(nowColor);
			  clickSize.push(nowSize);
			  clickDrag.push(dragging);
			  penType.push(nowPenType);


			}
			
			function resourceLoaded()
			{
				if(++curLoadResNum >= totalLoadResources){
					redraw();
					$("#outputImg").attr("src",$("#canvas")[0].toDataURL());
				}
			};
			function redraw(){
				var drawingAreaX = 111;
				var drawingAreaY = 11;
				var drawingAreaWidth = 267;
				var drawingAreaHeight = 200;
			  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
			  
			  context.strokeStyle = "#df4b26";
			  context.lineJoin = "round";
			  context.lineWidth = 5;
						
			  for(var i=0; i < clickX.length; i++) {		
				context.beginPath();
				if(clickDrag[i] && i){//是画一条线还是一个点
				  context.moveTo(clickX[i-1], clickY[i-1]);
				 }else{
				   context.moveTo(clickX[i]-1, clickY[i]);
				 }
				 context.lineTo(clickX[i], clickY[i]);
				 context.closePath();
				if(clickColor[i]){
					if(penType[i] == "eraser"){
						context.strokeStyle = "#fff";
					}else{
						context.strokeStyle = clickColor[i];
					}
				}
				 context.lineWidth = clickSize[i];
				 context.stroke();
			  }
			  context.globalAlpha = 0.4;
			  context.drawImage(crayonTextureImage, 0, 0, config.canvasWidth, config.canvasHeight);
			  //context.globalAlpha = 1; // No IE support
	
			// Draw the outline image
			  context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
			}
		})();