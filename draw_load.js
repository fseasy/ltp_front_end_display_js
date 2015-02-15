
var returnAnalysisRst = null ; // global json object storing the ltp server return value

$(document).ready(function () {

    //-----main view-----
	var analysisBtn, // the button for active analysis
	analysis = null, // function to start analysis
    readySentView = null , // function to set the sent view 
	maskObj = document.getElementById("mask"),
	manualObj = document.getElementById("usingManual"),
	loadingObj = document.getElementById("loadingTag"),
    loadingOriHtml = loadingObj.innerHTML ,
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
	analysisBtn = $("#analysis");
	
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
		targetURL = "http://ltpapi.voicecloud.cn/analysis/" ;
        //ajax
        $.ajax({
            url : targetURL,
            type : "POST",
            async : true,
            dataType : "jsonp",
            data : postData,
            success : function (returnVal) {
                returnAnalysisRst = returnVal;
                readySentView(returnVal) ;
            },
            error : function (errorInfo) {
                console.log(errorInfo);
                loadingObj.innerHTML = ['<p class="text-error">' ,
                                        '发送分析请求失败！请点击<code>分析</code>重试.' ,
                '</p>'].join('') ;
            }
        });
		//update the UI : display the loading page
		maskObj.style.display = "block";
		analysisPanel.style.display = "none";
		manualObj.style.display = "none";
        loadingObj.innerHTML = loadingOriHtml ;
        loadingObj.style.display = "block";
		setLoadingPos();
		return false;
	}
	
    readySentView = function(returnJsonObj){
        initDom(DRAW_PARENT_ID, returnJsonObj); //init the sent view
        //update UI ! it is necessary to update it before drawing the canvas
        maskObj.style.display = "none";
        analysisPanel.style.display = "block";
        //active the sent view
        $("#sent-tab").tab('show');
        //first , make the first text item be the lastOpenedEle to init the draw state
        lastOpenedEle = document.getElementById(DRAW_PARENT_ID).getElementsByTagName("DIV")[0];
        drawCanvas(lastOpenedEle);
        lastOpenedEle.parentNode.getElementsByTagName("CANVAS")[0].parentNode.style.height = CANVAS_HEIGHT + "px"; // important ! subsequent switching animate rely on this setting
    }
    
	setLoadingPos = function () {
		var parentNode = maskObj,
		pWidth = parentNode.offsetWidth,
		left ;
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
