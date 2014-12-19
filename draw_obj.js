


function Demo(canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.drawStruct = null;
	this.canvasBufs = null;
	this.imageData = null;
	this.undefined = undefined;
    this.offset = {} ;
    this.eventModule = {} ;
}
Demo.prototype = {
	processNerNode : function (neVal, idx, drawStruct) {
		// ner 's values set : {O , {B|M|E|S}-{Ni,Nh,Ns}} , where value 'O' stands for None ! {B|M|E|S} stands for the ner node position , while
		//{Ni , Nh , Ns} represent the institution , human , site
		if (neVal == undefined)
			return;
		var neValParts = neVal.toLowerCase().split("-");
		if (neValParts.length == 2) {
			switch (neValParts[0]) {
			case "s":
				drawStruct.ner.push({
					"neName" : neValParts[1],
					"startIdx" : idx,
					"endIdx" : idx
				});
				break;
			case "b":
				drawStruct.ner.push({
					"neName" : neValParts[1],
					"startIdx" : idx
				});
				break;
			case "e":
				drawStruct.ner[drawStruct.ner.length - 1]["endIdx"] = idx;
				break;
			default:
			}
		}
	},
	processSrlNode : function (idx, arg, drawStruct) {
		if (arg.length == 0)
			return; // if node has no arg , the arg should be a empty array
		else
			drawStruct.srl.push({
				"idx" : idx,
				"arg" : arg
			});

	},
	initDrawStruct : function (sentObj) {
		var canvas = document.createElement("canvas"),
		cxt = canvas.getContext("2d"),
		i,
		preTextWidth,
		curContPos;
		this.drawStruct = {
			posInfo : [],
			texts : [],
			postag : [],
			ner : [],
			srl : [],
			dp : [],
			WS_INTERVAL : 40,
			width : 0,
			height : 0,
			NER_DISCONF : {
				"ni" : {
					"bgcolor" : "#99ffff",
					"cnName" : "机构名"
				},
				"nh" : {
					"bgcolor" : "#99ff99",
					"cnName" : "人名"
				},
				"ns" : {
					"bgcolor" : "#ccff66",
					"cnName" : "地名"
				}
			},
			SRL_DISCONF : {
				"bgColor" : "#ffec8b",
				"lineColor" : "#eeeeee",
				"textColor" : "#6f8ca0",
				"lineWidth" : 5
			},
			DP_DISCONF : {
				"lineColor" : "blue",
				"textColor" : "red"
			}
		},
		this.offset = {
			x : 0,
			y : 0
		} ,
		this.eventModule = {
			startX : 0,
			startY : 0,
			hasDown : false
		};
		this.drawStruct.texts.push("Root");
		this.drawStruct.posInfo.push(0);
		this.drawStruct.postag.push(""); // For align the texts and posInfo , push a empty str to the postag array
		cxt.save();
		this.setTextFont(cxt);
		for (i = 0; i < sentObj.length; i++) {
			//process posInfo
			preTextWidth = cxt.measureText(this.drawStruct.texts[i]).width;
			curContPos = this.drawStruct.posInfo[i] + preTextWidth + this.drawStruct.WS_INTERVAL;
			this.drawStruct.texts.push(sentObj[i].cont);
			this.drawStruct.posInfo.push(curContPos);
			//process postag
			this.drawStruct.postag.push(sentObj[i].pos);
			//process ner
			this.processNerNode(sentObj[i].ne, i + 1, this.drawStruct);
			//process srl
			this.processSrlNode(i, sentObj[i]["arg"], this.drawStruct); // do not (i+1) !!
			//process dp
			this.drawStruct.dp.push({
				"from" : sentObj[i].parent,
				"to" : i,
				"relate" : sentObj[i].relate
			});
		}
		//we need know the last Word 's length, so add a virtual node at last
		preTextWidth = cxt.measureText(this.drawStruct.texts[i]).width;
		curContPos = this.drawStruct.posInfo[i] + preTextWidth + this.drawStruct.WS_INTERVAL;
		this.drawStruct.posInfo.push(curContPos);

		//set the big canvas ' width : set to the last ws node pos
		this.drawStruct.width = curContPos;

		cxt.restore();
		canvas = null; // release the reference
	},
	setTextFont : function (cxt) {
		cxt.font = "12px Microsoft YaHei,SimSun,STSong";
	},
	setEnTextFont : function (cxt) {
		cxt.font = "12px Arial,Courier New";
	},
	setTextFillStyle : function (cxt) {
		cxt.fillStyle = "black";
	},
	getFontSizeFromFontstr : function getFontSizeFromFontstr(fontstr) {
		// input : fontstr = "12px SimSun"
		var parts = fontstr.split(""),
		idx;
		for (var i = 0; i < parts.length; i++) {
			if ((idx = parts[i].indexOf("px")) != -1) {
				return parts[i].slice(0, idx);
			}
		}
		return 12;
	},
	getTextLineheightAndPaintHeight : function (fontSize) {
		var verticalMargin,
		lineheight,
		paintHeight;
		verticalMargin = fontSize * 0.25;
		paintHeight = fontSize + 2 * verticalMargin;
		lineheight = fontSize + verticalMargin;
		return {
			"lineheight" : lineheight,
			"paintHeight" : paintHeight
		};
	},
	setCanvasAppropriateHeight : function (canvas, startY, height) {
		var cxt = canvas.getContext("2d"),
		imageData;
		imageData = cxt.getImageData(0, startY, canvas.width, height);
		canvas.height = height;
		cxt.putImageData(imageData, 0, 0);
	},
	setOffset : function (x, y) {
		this.offset.x += x;
		this.offset.y += y;
	},
	createCanvasBuffer : function (w, h) {
		var canvasBuf = document.createElement("canvas");
		canvasBuf.width = w;
		canvasBuf.height = h;
		return canvasBuf;
	},
	// draw functions
	drawWS : function (drawStruct) {
		if (drawStruct.texts.length == 0)
			return null;
		var canvas = this.createCanvasBuffer(5000, 100),
		cxt,
		i,
		heightObj;
		cxt = canvas.getContext("2d");
		cxt.save();
		this.setTextFont(cxt);
		this.setTextFillStyle(cxt);
		fontSize = this.getFontSizeFromFontstr(cxt.font);
		heightObj = this.getTextLineheightAndPaintHeight(fontSize);
		//draw ws
		for (i = 0; i < drawStruct.texts.length; i++) {
			cxt.fillText(drawStruct.texts[i], drawStruct.posInfo[i], heightObj.lineheight);
		}
		cxt.restore();
		this.setCanvasAppropriateHeight(canvas, 0, heightObj.paintHeight);
		return canvas;
	},

	drawPOSTAG : function (drawStruct) {
		if (drawStruct.postag.length == 0)
			return null;
		var canvas = this.createCanvasBuffer(5000, 50),
		cxt,
		i,
		heightObj,
		fontSize;
		cxt = canvas.getContext("2d");
		cxt.save();
		this.setEnTextFont(cxt);
		this.setTextFillStyle(cxt);
		cxt.textAlign = "center";
		fontSize = this.getFontSizeFromFontstr(cxt.font);

		heightObj = this.getTextLineheightAndPaintHeight(fontSize);

		for (i = 1; i < drawStruct.postag.length; i++) { // skip "Root" 's postag
			//we need to calculate the center of the position which the corresponding WS lay at .
			var centerPos = (drawStruct.posInfo[i] + (drawStruct.posInfo[i + 1] - drawStruct.WS_INTERVAL)) / 2;
			cxt.fillText(drawStruct.postag[i], centerPos, heightObj.lineheight);
		}
		cxt.restore();
		this.setCanvasAppropriateHeight(canvas, 0, heightObj.paintHeight);
		return canvas;
	},

	drawNerNode : function (nerNode, drawStruct, cxt) {
		var bgColor,
		cnNeName,
		color = "#000000",
		paintX,
		paintY = 0,
		paintWidth,
		paintHeight = 16,
		confSet = drawStruct.NER_DISCONF,
		fontSize,
		fontBaselineHeight,
		fontX;
		//draw bg
		cxt.beginPath();
		bgColor = confSet[nerNode.neName] == undefined ? "#0099cc" : confSet[nerNode.neName].bgcolor;
		cnNeName = confSet[nerNode.neName] == undefined ? "实体名" : confSet[nerNode.neName].cnName;
		cxt.fillStyle = bgColor;
		paintX = drawStruct.posInfo[nerNode.startIdx] - drawStruct.WS_INTERVAL / 2;
		paintWidth = drawStruct.posInfo[nerNode.endIdx + 1] - drawStruct.posInfo[nerNode.startIdx];

		cxt.fillRect(paintX, paintY, paintWidth, paintHeight);
		//draw text
		this.setTextFillStyle(cxt);
		this.setTextFont(cxt);
		fontSize = this.getFontSizeFromFontstr(cxt.font);
		//fontBaselineHeight = paintY + (paintHeight - fontSize)/2 + fontSize ;
		fontBaselineHeight = paintY + fontSize; // the baseline to draw text , it seems ok in this value
		fontX = paintX + paintWidth / 2;
		cxt.textAlign = "center";
		cxt.fillText(cnNeName, fontX, fontBaselineHeight);

		return paintY + paintHeight;

	},
	drawNER : function (drawStruct) {
		if (drawStruct.ner.length == 0)
			return null;
		var canvas = this.createCanvasBuffer(500, 50),
		cxt = canvas.getContext("2d"),
		i,
		height;
		cxt.save();
		for (i = 0; i < drawStruct.ner.length; i++) {
			height = this.drawNerNode(drawStruct.ner[i], drawStruct, cxt);
		}
		cxt.restore();
		this.setCanvasAppropriateHeight(canvas, 0, height);
		return canvas;
	},
	drawSrlNode : function drawSrlNode(drawIdx, srlNode, drawStruct, cxt) {

		var lineStartPos,
		lineEndPos,
		lineY,
		textX,
		textY,
		paintY,
		paintHeight = 16,
		paintInterval = 4,
		roundRectRadius = 6,
		paintX,
		argLen = srlNode.arg.length;
		paintY = drawIdx * (paintHeight + paintInterval);
		//first , draw line
		cxt.save();
		lineStartPos = drawStruct.posInfo[srlNode.arg[0].beg + 1] - drawStruct.WS_INTERVAL / 2;
		lineEndPos = drawStruct.posInfo[srlNode.arg[argLen - 1].end + 1 + 1] - drawStruct.WS_INTERVAL / 2; // first +1 because the posInfo has a more node for "Root" ,
		//second +1 for the right position is in the next node
		lineY = paintY + paintHeight - drawStruct.SRL_DISCONF.lineWidth;
		cxt.strokeStyle = drawStruct.SRL_DISCONF.lineColor;
		cxt.lineWidth = drawStruct.SRL_DISCONF.lineWidth;
		cxt.beginPath();
		cxt.moveTo(lineStartPos, lineY);
		cxt.lineTo(lineEndPos, lineY);
		cxt.closePath();
		cxt.stroke();
		cxt.restore();
		//draw text (verb)
		cxt.fillStyle = drawStruct.SRL_DISCONF.textColor;
		cxt.textAlign = "center";
		this.setTextFont(cxt);
		textX = (drawStruct.posInfo[srlNode.idx + 1] + drawStruct.posInfo[srlNode.idx + 1 + 1] - drawStruct.WS_INTERVAL) / 2;
		textY = paintY + this.getFontSizeFromFontstr(cxt.font);
		cxt.fillText(drawStruct.texts[srlNode.idx + 1], textX, textY);

		//draw semantic role
		// the english 's font should be another
		this.setEnTextFont(cxt);
		for (var i = 0; i < argLen; i++) {
			//draw round rect
			cxt.fillStyle = drawStruct.SRL_DISCONF.bgColor;
			var x = drawStruct.posInfo[srlNode.arg[i].beg + 1] - drawStruct.WS_INTERVAL / 2,
			y = paintY,
			w = drawStruct.posInfo[srlNode.arg[i].end + 1 + 1] - drawStruct.posInfo[srlNode.arg[i].beg + 1],
			h = paintHeight;
			cxt.beginPath();
			cxt.roundRect(x, y, w, h, roundRectRadius);
			cxt.closePath();
			cxt.fill();
			//draw text
			this.setTextFillStyle(cxt);
			cxt.fillText(srlNode.arg[i].type.toUpperCase(), x + w / 2, textY);
		}

		//return the canvas Height
		return paintY + paintHeight;
	},
	drawSRL : function (drawStruct) {
		if (drawStruct.srl.length == 0)
			return null;
		var canvas = this.createCanvasBuffer(5000, 400),
		cxt = canvas.getContext("2d"),
		i,
		height;
		cxt.save();
		for (i = 0; i < drawStruct.srl.length; i++) {
			height = this.drawSrlNode(i, drawStruct.srl[i], drawStruct, cxt);
		}
		cxt.restore();
		this.setCanvasAppropriateHeight(canvas, 0, height);
		return canvas;
	},
	drawDpNode : function (dpNode, drawStruct, cxt) {
		var fromCenter,
		fromX,
		toCenter,
		lineInterval = 7,
		//arrow configure
		arrowHeight = 7,
		arrowWidth = 5,
		arrowDownOffset = 2,
		arrowLeftOffset,
		//paint configure
		paintY = cxt.canvas.height,
		controlPointHeight,
		controlPointY,
		lineY = paintY - arrowDownOffset,
		actualY // we should return it to calculate the MAX height
	;
		fromCenter = (drawStruct.posInfo[dpNode.from + 1] + drawStruct.posInfo[dpNode.from + 1 + 1] - drawStruct.WS_INTERVAL) / 2;
		toCenter = (drawStruct.posInfo[dpNode.to + 1] + drawStruct.posInfo[dpNode.to + 1 + 1] - drawStruct.WS_INTERVAL) / 2;
		fromX = fromCenter < toCenter ? fromCenter + lineInterval : fromCenter - lineInterval;
		controlPointHeight = Math.abs(dpNode.to - dpNode.from) * 13 + 10;
		controlPointY = lineY - controlPointHeight;
		actualY = lineY - controlPointHeight * 3 / 4;
		cxt.strokeStyle = drawStruct.DP_DISCONF.lineColor;
		cxt.beginPath(); // !!!! must clear previous path ! or previous path will be repaint again and again , then the line become ugly with jaggies
		cxt.moveTo(fromX, lineY);
		cxt.bezierCurveTo(fromX, controlPointY, toCenter, controlPointY, toCenter, lineY);
		cxt.stroke();
		cxt.closePath();
		//draw arrow
		arrowLeftOffset = dpNode.to > dpNode.from ? (arrowWidth - cxt.lineWidth) / 2 + 1 : (arrowWidth - cxt.lineWidth) / 2 - 1; //
		cxt.beginPath();
		cxt.moveTo(toCenter, paintY);
		cxt.lineTo(toCenter - arrowLeftOffset, paintY - arrowHeight);
		cxt.lineTo(toCenter + (arrowWidth - arrowLeftOffset), paintY - arrowHeight);
		cxt.closePath();
		cxt.fillStyle = drawStruct.DP_DISCONF.lineColor;
		cxt.fill();
		//draw relate text
		cxt.fillStyle = drawStruct.DP_DISCONF.textColor;
		cxt.textAlign = "center";
		this.setEnTextFont(cxt);
		cxt.fillText(dpNode.relate, (fromX + toCenter) / 2, actualY + this.getFontSizeFromFontstr(cxt.font) / 2);
		return actualY;
	},
	drawDP : function (drawStruct) {
		if (drawStruct.dp.length == 0)
			return null;
		var canvas = this.createCanvasBuffer(5000, 500),
		cxt = canvas.getContext("2d"),
		i,
		minY = canvas.height,
		newHeight;
		cxt.lineWidth = 0.6;
		for (i = 0; i < drawStruct.dp.length; i++) {
			yPos = this.drawDpNode(drawStruct.dp[i], drawStruct, cxt);
			if (minY > yPos)
				minY = yPos;
		}
		minY -= 10; //  the up margin
		//move the image to the right position
		//first we should save the image data , then change the canvas height and put the imageData to it
		newHeight = canvas.height - minY;
		this.setCanvasAppropriateHeight(canvas, minY, newHeight);
		return canvas;
	},
	/*
	 **according to the drawStruct , paint the five components
	 * return value : a object contains the five components
	 */
	drawComponent : function (drawStruct) {
		var WSCanvas,
		POSTAGCanvas,
		NERCanvas,
		SRLCanvas,
		DPCanvas;
		this.canvasBufs = {};
		// draw WS at WSCanvas buffer
		WSCanvas = this.drawWS(drawStruct);
		// draw POSTAG
		POSTAGCanvas = this.drawPOSTAG(drawStruct);
		// draw NER
		NERCanvas = this.drawNER(drawStruct);
		// draw SRL
		SRLCanvas = this.drawSRL(drawStruct);
		// draw DP
		DPCanvas = this.drawDP(drawStruct);

		this.canvasBufs["WS"] = WSCanvas;
		this.canvasBufs["POSTAG"] = POSTAGCanvas;
		this.canvasBufs["NER"] = NERCanvas;
		this.canvasBufs["SRL"] = SRLCanvas;
		this.canvasBufs["DP"] = DPCanvas;

		return this.canvasBufs;
	},
	/**
	 *draw containers according to the five components  , and the disable attribute
	 *return value : the container 's imageData
	 */
	drawContainer : function (drawStruct, canvasBufs, disableAttr) {
		//set the canvas's width and height .
		var canvas = document.createElement("canvas");
		canvas.width = drawStruct.width;
		canvas.height = 500;
		var cxt = canvas.getContext("2d"),
		drawBufs = {
			"WS" : null,
			"POSTAG" : null,
			"NER" : null,
			"DP" : null,
			"SRL" : null
		},
		offsetX = 0,
		offsetY = 0,
		intervalY = 10,
		paintY = offsetY,
		drawTarget;

		//bulid the drawBufs
		if (typeof disableAttr == "undefined")
			disableAttr = {};
		for (key in drawBufs) {
			drawBufs[key] = (canvasBufs[key] === undefined || disableAttr[key] == true) ? "disable" : canvasBufs[key];
		}
		//first clear the canvas
		cxt.clearRect(0, 0, canvas.width, canvas.height);

		//draw canvasBufs to the display canvas
		// drawImage 's first parameter can be HTMLCanvasElement , HTMLImageElement , HTMLVideoElement
		drawTarget = ["DP", "WS", "POSTAG", "NER", "SRL"];
		for (var i = 0; i < drawTarget.length; i++) {
			drawCanvas = drawBufs[drawTarget[i]];
			if (typeof drawCanvas == "string" && drawCanvas == "disable")
				continue;
			else if (drawCanvas == null)
				paintY += 3 * intervalY;
			else {
				cxt.drawImage(drawCanvas, offsetX, paintY);
				paintY += intervalY + drawCanvas.height;
			}
		}
		this.setCanvasAppropriateHeight(canvas, 0, paintY);
		// set drawStruct 's height
		this.drawStruct.height = paintY;
		this.imageData = cxt.getImageData(0, 0, canvas.width, canvas.height);
		return this.imageData;
	},
	/**
	 *draw the caontainer 's image to the view port
	 */
	drawView : function (imageData, canvas, offsetX, offsetY) {
		var cxt = canvas.getContext("2d");
		cxt.clearRect(0, 0, canvas.width, canvas.height);
		// the parame offsetX , offsetY is the offset based on the current position , so we should translate it to the origin
		cxt.putImageData(imageData, this.offset.x + offsetX, this.offset.y + offsetY);
	},
	//-------------now define the API for outer ---------------
	analysis : function (sentObj) {
		this.initDrawStruct(sentObj);
		this.drawComponent(this.drawStruct);
	},
	update : function (disableAttr) {
		this.drawContainer(this.drawStruct, this.canvasBufs, disableAttr);
		this.move(this.offset.x, this.offset.y);
	},
	paint : function () {
		this.update();
	},
	move : function (x, y) {
		this.drawView(this.imageData, this.canvas, x, y);
	},
	addaptWidth : function () {
		var parent = this.canvas.parentNode;
		this.canvas.width = parent.offsetWidth;
		this.canvas.height = 500;
	},
	//------------event module--------------
	downAction : function (e) {
		if (e.target.tagName == "CANVAS") {
			this.eventModule.startX = e.pageX;
			this.eventModule.startY = e.pageY;
			this.eventModule.hasDown = true;
            //set mouse 
            //this.style.cursor = "hand" ; --!! error ; here , this pointed to the current instance
            e.target.style.cursor = "move" ;
		}
	},
	upAction : function (e) {
		var x = e.pageX - this.eventModule.startX,
		y = e.pageY - this.eventModule.startY;
		this.setOffset(x, y);
		this.eventModule.startX = e.pageX;
		this.eventModule.startY = e.pageY;
		this.eventModule.hasDown = false;
        e.target.style.cursor = "default" ;
	},
	moveAction : function (e) {
		if (this.eventModule.hasDown == true) {
			var offsetX = e.pageX - this.eventModule.startX,
			offsetY = e.pageY - this.eventModule.startY;
			this.move(offsetX, offsetY);
		}
	}

};
