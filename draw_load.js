$(document).ready(function () {
	var rstDisplay = $("#rstDisplay"),
	analysisBtn, // the button for active analysis
	analysis = null, // function to start analysis
	//-----sentView(for canvas drawing)-------
    lastOpenedEle = null,  // global object storing the current selected canvas' parent's sibling item(corresponding to the "text-item")
	intervalId, // for switch animation
	getCanvasContainerFromParentSibling = null,
    getSentent = null , // function to get sentent from the drawStruct's segment words
	initDom = null, // function to init the list dom dynamicly
	drawCanvas = null, // function to draw canvas
	switchCanvas = null, // function to switch the list selected
    changeDisObj = null , // function for switching animate action
	returnAnalysisRst = null, // global json object storing the ltp server return value 
	disableAttr = null , // global object for get the disable canvas-drawing element 
    setDisableAttr = null , // function to set variable disableAttr
    demo = null, // global draw Demo
	DRAW_CANVAS_ID = "canvasTest", // only this id is active
	DRAW_PARENT_ID = "analysisContent", // parent id
    DISABLE_ATTR_PANEL_ID = "disableAttrPanel" ,
	CANVAS_HEIGHT = 500  ,
    //------paragraph view -----------
    paraSelectAction = null , // to response the click action of the paraSelPanel 
    drawParaOriginWord = null ,
    drawParaWordSeg = null ,
    drawParaPostag = null ,
    drawParaNer = null ,
    paraDrawObj = null ,
    lastSelectedValue = "para-ws" ,
    DRAW_PARA_PARENT_ID = "paraContent" ,
    PARA_SELECT_PANEL_ID = "paraSelPanel" 
    ;

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
				async : false,
				dataType : "jsonp",
				data : postData,
				success : function (returnVal) {
					//d.analysis(returnVal[0][0]) ;
					//d.paint() ;
					returnAnalysisRst = returnVal;
					initDom(DRAW_PARENT_ID, returnVal);
					//first , make the first text item be the lastOpenedEle to init the draw state
					lastOpenedEle = document.getElementById(DRAW_PARENT_ID).getElementsByTagName("DIV")[0];
					drawCanvas(lastOpenedEle);
					lastOpenedEle.parentNode.getElementsByTagName("CANVAS")[0].parentNode.style.height = CANVAS_HEIGHT + "px"; // important ! subsequent switching animate rely on this setting 
				},
				error : function (errorInfo) {
					console.log(errorInfo);
				}
			});
		return false;
	}
	changeDisObj = function(newObj, previousObj) {
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
			var wsList = [] ,
                enReg = /^[A-Za-z']*$/ ;
			for (var i = 0; i < sentEle.length; i++) {
				wsList.push(sentEle[i].cont);
                // add the logic for English sentence !
                if(enReg.test(sentEle[i].cont) && i < sentEle.length - 1  && enReg.test(sentEle[i+1].cont)){
                    wsList.push(" ") ;
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
		eleCopy ;
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
    setDisableAttr = function(panelId){
        var panel = document.getElementById(panelId) ,
            checkboxList = panel.getElementsByTagName("INPUT") 
            ;
        disableAttr = {} ;
        for(var i = 0 ; i < checkboxList.length ; i++){
            if(checkboxList[i].type == "checkbox" && checkboxList[i].checked == false){
                var value = checkboxList[i].value ,
                    key = value.match(/[^-]*/)[0].toUpperCase()
                    ;
                disableAttr[key] = true ;    
            }
        }
    }
    
    //----paragraph view ------
    paraDrawObj = document.getElementById(DRAW_PARA_PARENT_ID) ;
    
    drawParaOriginWord = function(parentObj , sentsObj){
        var sentDom = document.createElement("P") ;
        
        for(var i = 0 ; i < sentsObj.length ; i++){
            var paraCont = [] ,
                sentCopy = sentDom.cloneNode(false) ;
            for(var j = 0 ; j < sentsObj[i].length ; j++){
                paraCont.push(getSentent(sentsObj[i][j])) ; 
            }
            sentCopy.innerHTML = paraCont.join("") ;
            parentObj.appendChild(sentCopy) ;
        }
    }
    paraSelectAction = function(e){
        if(e.target.type == "radio"){
            if(lastSelectedValue == e.target.value) return false ;
            lastSelectedValue = e.target.value ;
            switch(e.target.value){
                case "para-originWord" :
                    drawParaOriginWord(paraDrawObj , returnAnalysisRst) ;
                    break ;
            }
        }
        
    }
    
	//---------------Event Bind----------------
	analysisBtn.bind("click", analysis);
    $("#" + DISABLE_ATTR_PANEL_ID).bind("click" , function(e){
        setDisableAttr(DISABLE_ATTR_PANEL_ID) ;
        demo.update(disableAttr) ;
    }) ;
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
    $("#" + PARA_SELECT_PANEL_ID).bind("click" , function(e){
        paraSelectAction(e) ;
    }) ;
	//----------------First Call--------------------------
	//analysis() ;
});
