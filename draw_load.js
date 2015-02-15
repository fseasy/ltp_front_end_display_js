
$(document).ready(function () {

    //-----main view-----
	var analysisBtn, // the button for active analysis
	analysis = null, // function to start analysis
	maskObj = document.getElementById("mask"),
	manualObj = document.getElementById("usingManual"),
	loadingObj = document.getElementById("loadingTag"),
	analysisPanelObj = document.getElementById("analysisPanel"),
	setLoadingPos = null, // function to set loading tag position
    SELECT_SENTS = {
        "singleSentence" : "我们即将以昂扬的斗志迎来新的一年。\n国内专家学者40余人参加研讨会。\n在家禽摊位中，有一个摊位专卖乌骨鸡。\n徐先生还具体帮助他确定了把画雄鹰、松鼠和麻雀作为主攻目标。" ,
        "multipleSentence" : "这是一个感人的故事，也是一个美丽的故事。\n他是山西省书法家协会会员，曾多次在国内各类书法大赛中获奖。\n我们每天下午放学后练习一个半小时，每周六再训练两个小时。\n潘秀云今年40岁，长得高高壮壮，人很能干。" ,
        "paraPolity" : "巴希尔强调，政府坚决主张通过和平和政治途径结束目前的武装冲突，在全国实现和平。他强烈呼吁以约翰·加朗为首的反政府武装力量回到国家的怀抱。在谈到周边关系时，巴希尔说，苏丹政府将采取行动改善与周边国家的关系。" ,
        "paraSports" : "大连万达俱乐部在决赛后，因对裁判员判罚不满，而拒绝领奖和不出席新闻发布会。这种行为不仅不符合体育精神，不符合足球比赛的规范，也有损于大连万达俱乐部和中国足球的形象。对此，中国足球协会特通报批评。大连万达俱乐部应认真检查，吸取教训，并准备接受亚足联可能给予的处罚。"
    } , 
    sentSelectDomObj = document.getElementById("sentSelect") ,
    textareaEnterNum = 0 ,
    getEnterNumFromStr = null , // function to get Enter number
	//-----sentView(for canvas drawing)-------
	lastOpenedEle = null, // global object storing the current selected canvas' parent's sibling item(corresponding to the "text-item")
	intervalId, // for switch animation
	getCanvasContainerFromParentSibling = null,
	getSentent = null, // function to get sentent from the drawStruct's segment words
	initDom = null, // function to init the list dom dynamicly
	drawCanvas = null, // function to draw canvas
	switchCanvas = null, // function to switch the list selected
	changeDisObj = null, // function for switching animate action
	returnAnalysisRst = null, // global json object storing the ltp server return value
	disableAttr = null, // global object for get the disable canvas-drawing element
	setDisableAttr = null, // function to set variable disableAttr
	demo = null, // global draw Demo
	DRAW_CANVAS_ID = "canvasTest", // only this id is active
	DRAW_PARENT_ID = "analysisContent", // parent id
	DISABLE_ATTR_PANEL_ID = "disableAttrPanel",
	CANVAS_HEIGHT = 500,
	//------paragraph view -----------
	paraSelectAction = null, // to response the click action of the paraSelPanel
	drawParaOriginWord = null,
	drawParaWS = null,
	drawParaPostag = null,
	drawParaNer = null,
	paraDrawObj = null, // the dom obj of drawing container
	paraNerIntroDomObj = document.getElementById("paraNerIntro"),
	setNerIntroDis = null, // function to set paraNerIntro 's displaying
	initNerIntro = null, // function to init the ner introduction
	selectParaPartToDrawByValue = null,
	nerMap = null, // the ner map struct
	lastSelectedValue = "para-ws",
	DRAW_PARA_PARENT_ID = "paraContent",
	PARA_SELECT_PANEL_ID = "paraSelPanel";

	analysisBtn = $("#analysis");
	demo = new Demo(DRAW_CANVAS_ID);
	analysis = function () {
		var requestArgs = [],
		postData,
		targetURL;

		requestArgs["api_key"] = "U2G658z15u6Q4RpksQHC9KDevunLIypIHc5nPr5U";
		requestArgs["pattern"] = "all";
		requestArgs["format"] = "json";
		requestArgs["text"] = encodeURI($("#inputText").val());
		postData = (function () {
			var tmpStrArray = [];
			for (key in requestArgs) {
				tmpStrArray.push([key, requestArgs[key]].join("="));
			}
			return tmpStrArray.join("&");
		})();
		targetURL = "http://ltpapi.voicecloud.cn/analysis/"
			//ajax
			$.ajax({
				url : targetURL,
				type : "POST",
				async : true,
				dataType : "jsonp",
				data : postData,
				success : function (returnVal) {
					returnAnalysisRst = returnVal;
					initDom(DRAW_PARENT_ID, returnVal);
					
                    
					//init the sent view

					//update UI ! it is necessary to update it before drawing the canvas
					maskObj.style.display = "none";
					analysisPanel.style.display = "block";
                    //active the sent view
					$("#sent-tab").tab('show');
					//first , make the first text item be the lastOpenedEle to init the draw state
					lastOpenedEle = document.getElementById(DRAW_PARENT_ID).getElementsByTagName("DIV")[0];
					drawCanvas(lastOpenedEle);
					lastOpenedEle.parentNode.getElementsByTagName("CANVAS")[0].parentNode.style.height = CANVAS_HEIGHT + "px"; // important ! subsequent switching animate rely on this setting
				},
				error : function (errorInfo) {
					console.log(errorInfo);
				}
			});
		//update the UI
		maskObj.style.display = "block";
		analysisPanel.style.display = "none";
		manualObj.style.display = "none";
		setLoadingPos();
		loadingObj.style.display = "block";
		return false;
	}
	changeDisObj = function (newObj, previousObj) {
		var stepLen = 50,
		newObjOriHeight = newObj.offsetHeight,
		previousObjOriHeight = previousObj.offsetHeight;
		//console.log(previousObj) ;
		newObj.style.height = (stepLen + newObjOriHeight) + "px";
		previousObj.style.height = (previousObjOriHeight - stepLen) + "px";
		if (previousObj.offsetHeight <= 0) {
			clearInterval(intervalId);
		}
	}
	getCanvasContainerFromParentSibling = function (parentSibling) {
		return parentSibling.parentNode.getElementsByTagName("CANVAS")[0].parentNode;
	}
	getSentent = function (sentEle) {
		var wsList = [],
		enReg = /^[A-Za-z']*$/;
		for (var i = 0; i < sentEle.length; i++) {
			wsList.push(sentEle[i].cont);
			// add the logic for English sentence !
			if (enReg.test(sentEle[i].cont) && i < sentEle.length - 1 && enReg.test(sentEle[i + 1].cont)) {
				wsList.push(" ");
			}
		}
		return wsList.join("");
	}
	initDom = function (parentId, sentsObj) {
		var parentContainer = document.getElementById(parentId),
		liEle = document.createElement("LI"),
		itemDivEle = document.createElement("DIV"),
		canvasDivEle = document.createElement("DIV"),
		canvasEle = document.createElement("CANVAS"),
		eleCopy;
		while (parentContainer.childNodes.length > 0)
			parentContainer.removeChild(parentContainer.lastChild);
		itemDivEle.setAttribute("class", "text-item");
		canvasDivEle.setAttribute("class", "canvasContainer");
		canvasDivEle.appendChild(canvasEle);
		liEle.appendChild(itemDivEle);
		liEle.appendChild(canvasDivEle);
		for (var i = 0; i < sentsObj.length; i++) {
			for (var j = 0; j < sentsObj[i].length; j++) {
				eleCopy = liEle.cloneNode(true);
				eleCopy.firstChild.setAttribute("x", i),
				eleCopy.firstChild.setAttribute("y", j);
				var sentent = getSentent(sentsObj[i][j]);
				var textNode = document.createTextNode(["段落", i + 1, "句子", j + 1, ":", sentent].join(""));
				eleCopy.firstChild.appendChild(textNode);
				parentContainer.appendChild(eleCopy);
			}
		}

	}
	drawCanvas = function (itemDivEle) {
		var i = itemDivEle.getAttribute("x"),
		j = itemDivEle.getAttribute("y");
		//first set previous canvas 's id = ""
		if (lastOpenedEle != itemDivEle)
			lastOpenedEle.parentNode.getElementsByTagName("CANVAS")[0].setAttribute("id", "");
		itemDivEle.parentNode.getElementsByTagName("CANVAS")[0].setAttribute("id", DRAW_CANVAS_ID);
		demo.addaptWidth();
		demo.analysis(returnAnalysisRst[i][j]);
		demo.update(disableAttr);
	}
	switchCanvas = function (clickedItemDivEle, previousClickedItemDivEle) {
		if (clickedItemDivEle != previousClickedItemDivEle) {
			//clickedItemDivEle is the text-item div , while the function changeDisObj 's param is the canvasContainer div
			var clickedCanvasContainer = getCanvasContainerFromParentSibling(clickedItemDivEle),
			previousCanvasContainer = getCanvasContainerFromParentSibling(previousClickedItemDivEle);
			//console.log(clickedCanvasContainer) ;
			//console.log(previousCanvasContainer) ;
			intervalId = setInterval(function () {
					changeDisObj(clickedCanvasContainer, previousCanvasContainer);
				}, 10);
		}
	}
	setDisableAttr = function (panelId) {
		var panel = document.getElementById(panelId),
		checkboxList = panel.getElementsByTagName("INPUT");
		disableAttr = {};
		for (var i = 0; i < checkboxList.length; i++) {
			if (checkboxList[i].type == "checkbox" && checkboxList[i].checked == false) {
				var value = checkboxList[i].value,
				key = value.match(/[^-]*/)[0].toUpperCase();
				disableAttr[key] = true;
			}
		}
	}

	//----paragraph view ------
	paraDrawObj = document.getElementById(DRAW_PARA_PARENT_ID);
	nerMap = {
		"Ni" : {
			"color" : "#00008b",
			"cnName" : "机构名"
		},
		"Nh" : {
			"color" : "#cda000",
			"cnName" : "人名"
		},
		"Ns" : {
			"color" : "#3c8c71",
			"cnName" : "地名"
		}
	};
	drawParaOriginWord = function (parentObj, sentsObj) {
		var sentDom = document.createElement("P");

		for (var i = 0; i < sentsObj.length; i++) {
			var paraCont = [],
			sentCopy = sentDom.cloneNode(false);
			for (var j = 0; j < sentsObj[i].length; j++) {
				paraCont.push(getSentent(sentsObj[i][j]));
			}
			sentCopy.innerHTML = paraCont.join("");
			parentObj.appendChild(sentCopy);
		}
	}
	drawParaWS = function (parentObj, sentsObj) {
		var sentDom = document.createElement("P");

		for (var i = 0; i < sentsObj.length; i++) {
			var paraCont = [],
			sentCopy = sentDom.cloneNode(false);
			for (var j = 0; j < sentsObj[i].length; j++) {
				for (var k = 0; k < sentsObj[i][j].length; k++) {
					paraCont.push(sentsObj[i][j][k].cont);
				}
			}
			sentCopy.innerHTML = paraCont.join("&nbsp;&nbsp;");
			parentObj.appendChild(sentCopy);
		}
	}
	drawParaPostag = function (parentObj, sentsObj) {
		var POSTAG_COLOR = "#8b00b2",
		postag_style_start = '<span style="color:' + POSTAG_COLOR + ';">',
		postag_style_end = '</span>',
		sentDom = document.createElement("P");
		for (var i = 0; i < sentsObj.length; i++) {
			var paraCont = [],
			sentCopy = sentDom.cloneNode(false);
			for (var j = 0; j < sentsObj[i].length; j++) {
				for (var k = 0; k < sentsObj[i][j].length; k++) {
					paraCont.push([sentsObj[i][j][k].cont, "/", postag_style_start, sentsObj[i][j][k].pos, postag_style_end].join(""));
				}
			}
			sentCopy.innerHTML = paraCont.join("&nbsp;&nbsp;");
			parentObj.appendChild(sentCopy);
		}
	}

	drawParaNer = function (parentObj, sentsObj) {
		var sentDom = document.createElement("P");
		// draw text
		for (var i = 0; i < sentsObj.length; i++) {
			var paraCont = [],
			sentCopy = sentDom.cloneNode(false);
			for (var j = 0; j < sentsObj[i].length; j++) {
				for (var k = 0; k < sentsObj[i][j].length; k++) {
					var nerVal = sentsObj[i][j][k].ne,
					nerMatch = nerVal.match(/^(\w+)?-(\w+)$/);
					if (nerMatch != null && nerMatch.length == 3) {
						var tag = nerMatch[1],
						nerType = nerMatch[2],
						style_start = '<span style="color : ' + nerMap[nerType].color + ';">',
						style_end = '</span>';
						switch (tag) {
						case "S":
							paraCont.push([style_start, sentsObj[i][j][k].cont, style_end].join(""));
							break;
						case "B":
							paraCont.push([style_start, sentsObj[i][j][k].cont].join(""));
							break;
						case "M":
							paraCont.push(sentsObj[i][j][k].cont);
							break;
						case "E":
							paraCont.push([sentsObj[i][j][k].cont, style_end].join(""));
							break;

						}
					} else {
						paraCont.push(sentsObj[i][j][k].cont);
					}
				}
			}
			sentCopy.innerHTML = paraCont.join("");
			parentObj.appendChild(sentCopy);
		}

	}
	setNerIntroDis = function (isToDis) {
		if (isToDis == true || isToDis === undefined) {
			var wrapper = paraNerIntroDomObj.parentNode,
			wrapperHeight = wrapper.offsetHeight,
			paraContentHeight = paraDrawObj.offsetHeight,
			introHeight = (paraNerIntroDomObj.currentStyle || document.defaultView.getComputedStyle(paraNerIntroDomObj, false))["height"].slice(0, -2), // get height value from class defined value
			whiteHeight = wrapperHeight - paraContentHeight;
			if (whiteHeight > introHeight) {
				var marginTopVal = whiteHeight - introHeight;
				paraNerIntroDomObj.style.marginTop = marginTopVal + "px";
				paraNerIntroDomObj.style.display = "block";
			} else {
				paraNerIntroDomObj.style.marginTop = "0px"; // cancel the margin top
				paraNerIntroDomObj.style.display = "block";
			}
		} else {
			paraNerIntroDomObj.style.display = "none";
		}
	}
	initNerIntro = function () {
		for (var key in nerMap) {
			var introItem = document.createElement("LABEL"),
			box = document.createElement("SPAN"),
			textNode = document.createTextNode([nerMap[key].cnName, "(", key, ")"].join(""));
			box.style.background = nerMap[key].color;
			box.setAttribute("class", "box");
			introItem.appendChild(box);
			introItem.appendChild(textNode);
            introItem.setAttribute("class" , "inline") ;
			paraNerIntroDomObj.appendChild(introItem);
		}
	}
	selectParaPartToDrawByValue = function (paraValue) {
		//first clear origin content
		while (paraDrawObj.lastChild != null)
			paraDrawObj.removeChild(paraDrawObj.lastChild);
		switch (paraValue) {
		case "para-originWord":
			drawParaOriginWord(paraDrawObj, returnAnalysisRst);
			setNerIntroDis(false);
			break;
		case "para-ws":
			drawParaWS(paraDrawObj, returnAnalysisRst);
			setNerIntroDis(false);
			break;
		case "para-postag":
			drawParaPostag(paraDrawObj, returnAnalysisRst);
			setNerIntroDis(false);
			break;
		case "para-ner":
			drawParaNer(paraDrawObj, returnAnalysisRst);
			setNerIntroDis(true);
			break;
		}

	}
	paraSelectAction = function (e) {
		if (e.target.type == "radio") {
			if (lastSelectedValue == e.target.value)
				return false;
			lastSelectedValue = e.target.value;
			selectParaPartToDrawByValue(e.target.value);
		}
	}
	setLoadingPos = function () {
		var parentNode = maskObj,
		pWidth = parentNode.offsetWidth,
		left;
		if (pWidth != 0) {
			left = (pWidth - loadingObj.offsetWidth) / 2;
			loadingObj.style.left = left + "px";
		}
	}
    getEnterNumFromStr = function(str){
        var enterNum = 0 ,
            startPos = 0 ;
        while(true){
                startPos = str.indexOf('\n', startPos) ;
                if(startPos != -1) {
                    enterNum++ ;
                    startPos++ ;
                }
                else break ;
        }
        return enterNum ;
    }
	//---------------Event Bind----------------
	analysisBtn.bind("click", analysis);
	$("#" + DISABLE_ATTR_PANEL_ID).bind("click", function (e) {
		setDisableAttr(DISABLE_ATTR_PANEL_ID);
		demo.update(disableAttr);
	});
	$("#" + DRAW_PARENT_ID).bind({
		"mousedown" : function (e) {
			demo.downAction(e)
		},
		"mouseup" : function (e) {
			demo.upAction(e)
		},
		"mousemove" : function (e) {
			demo.moveAction(e)
		}

	});
	$("#" + DRAW_PARENT_ID).bind("click", function (e) {
		var ele = e.target;
		if (lastOpenedEle != null && ele.getAttribute("class") == "text-item" && ele != lastOpenedEle) {
			drawCanvas(ele);
			(function (previousClicked) {
				switchCanvas(ele, previousClicked);
			})(lastOpenedEle);
			lastOpenedEle = ele;
		}
	});
	$("#" + PARA_SELECT_PANEL_ID).bind("click", function (e) {
		paraSelectAction(e);
	});
	$("#viewTab a").click(function (e) {
		e.preventDefault() ;
		$(this).tab('show');
        selectParaPartToDrawByValue($("input[name=paraDisItem]:checked").val());
	});
    
    $(sentSelectDomObj).bind("change" , function(){
        $("#inputText").val(SELECT_SENTS[$(this).val()]) ;
        textareaEnterNum = getEnterNumFromStr(SELECT_SENTS[$(this).val()]) ;
    })
    
    $(window).bind("resize" , function(e){
        if(demo != null){
            demo.move(0,0) ;
        }
        setLoadingPos() ;
    }) ;
    $("#inputText").bind({
        "keyup" : function(e){
            var keyChar = String.fromCharCode(e.keyCode) ;
            if(keyChar == "\r" || keyChar == "\n") textareaEnterNum ++ ;
            if(textareaEnterNum >= 4) $(this).attr("rows" , textareaEnterNum+1) ;
            else $(this).attr("rows" , 4) ;
        } ,
        "change" : function(e){
            var value = $(this).val() ,
                enterNum = 0 ;
            enterNum = getEnterNumFromStr(value) ;
            textareaEnterNum = enterNum ;    
            if(textareaEnterNum >= 4) $(this).attr("rows" , textareaEnterNum+1) ;
            else $(this).attr("rows" , 4) ;
        }
    }) ;
	//----------------First Call--------------------------
	//analysis() ;
	initNerIntro();
    $("#inputText").val(SELECT_SENTS[sentSelectDomObj.value]) ;
    textareaEnterNum = getEnterNumFromStr(SELECT_SENTS[sentSelectDomObj.value]) ;
});
