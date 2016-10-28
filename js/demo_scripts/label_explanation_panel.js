function LabelExplanationPanel(sdpLabelData , dpLabelData , srlLabelData , postagLabelData){
    this.sdpLabelData = sdpLabelData ;
    this.dpLabelData = dpLabelData ;
    this.srlLabelData = srlLabelData ;
    this.postagLabelData = postagLabelData ;
    this.StateSet = {CLOSE : 0 , APPEAR : 1} ;
    this.state = this.StateSet.CLOSE ;
    this.APPEAR_MODE_THRESHOLD = 150 ;
    this.APPEAR_UP_HEIGHT = 300 ;
    this.AppearMode = {UP : 0 , RIGHT : 1 } ;
    this.appearMode = null ;
    this.isInResizing = false ; // Add this flag to avoid animate action when resizing . 
}

LabelExplanationPanel.prototype = {
    initPanel : function(){
        this.responseBtn =  $('#label-explanation-response-btn') ;
        this.labelPanel = $('#label-explanation-panel') ;
        this.labelPanelDes = $('#label-explanation-panel-description') ;
        this.labelPanelTab = this.labelPanel.find('.nav-tabs') ;
        this.labelPanelMainContent = $('#label-explanation-panel-content') ;
        this.demoContentPanel = $('.dis-wrapper') ;
        this.demoPanel = this.demoContentPanel.parent() ;
        this.panelCloseBtn = $('#label-explanation-panel-close-btn') ;
        this.viewAllLabelsBtn = $('#label-explanation-panel-total-info').find('a') ;
        this.navbar = $('[class="navbar navbar-fixed-top"]') ; // top navi bar .
        this.navbarCollapsedBtn = this.navbar.find(".btn") ; //! the btn will apear when width is small , and a long munu occur
        //~ when clicked . we want to listen click action and bind a function to update the position of label panel . 
        var dpTable = document.getElementById("dp-exp") ,
            sdpTable = document.getElementById("sdp-exp") ,
            postagTable = document.getElementById("postag-exp") ,
            srlTable = document.getElementById("srl-exp") ;
        this.dpEntry = dpTable.getElementsByTagName("TBODY")[0] ;
        this.sdpEntry = sdpTable.getElementsByTagName("TBODY")[0] ;
        this.postagEntry = postagTable.getElementsByTagName("TBODY")[0] ;
        this.srlEntry = srlTable.getElementsByTagName("TBODY")[0] ;
        this._getElementPosition() ;
        //! some inherent attribute . 
        var __getBorderDirectionValue = function(ele , isVertical){
            if(isVertical){
                var upBorder = ele.css("borderTopWidth") ,
                    bottomBorder = ele.css('borderBottomWidth') ;
                if( upBorder == undefined ){
                    console.error("css('borderTopWidth') is not supported!") ;
                    upBorder = 1 ;
                }
                if( bottomBorder == undefined ){
                    console.error("css('borderBottomWidth') is not supported") ;
                    bottomBorder = 1 ;
                }
                return parseFloat(upBorder) + parseFloat(bottomBorder) ;
            }
            else{
                var leftBorder = ele.css('borderLeftWidth') ,
                    rightBorder = ele.css('borderRightWidth') ;
                if(leftBorder == undefined){
                    console.error('css("borderLeftWidth") is not supported!') ;
                    leftBorder = 1 ;
                }
                if(rightBorder == undefined){
                    console.error('css("borderRightWidth") is not supported!') ;
                    rightBorder = 1 ;
                }
                return parseFloat(leftBorder) + parseFloat(rightBorder) ;
            }
        } ;
        this.labelPanelVerticalBorderValue = __getBorderDirectionValue(this.labelPanel , true) ;
        this.labelPanelHorizontalBorderValue = __getBorderDirectionValue(this.labelPanel , false ) ;
        this.labelPanelVerticalPaddingValue = parseFloat(this.labelPanel.css("padding-top") + parseFloat(this.labelPanel.css("padding-bottom"))) ;
        this.labelPanelHorizontalPaddingValue = parseFloat(this.labelPanel.css("paddingLeft") + 
                                                parseFloat(this.labelPanel.css("paddingRight"))) ;


    } ,
    bindAction : function(){
        var obj = this ;
        this.responseBtn.bind("click" , function(e){
            obj.openPanel() ;
        }) ;
        this.panelCloseBtn.bind('click' , function(e){
            obj.closePanel() ;
        }) ;
        this.labelPanelTab.bind('click' , function(e){
            var e = e || window.event ,
                target = e.target ;
            gt = target;
            if(target.nodeName == 'A'){
               var map = {
                    'postag-tab' : "/intro/#pos_how" , 
                    'dp-tab'     : "/intro/#dp_how" ,
                    'sdp-tab'    : "/intro/#sdp_how" ,
                    'srl-tab'    : "/intro/#srl_how" 
                   } ,
                   target_name = target.getAttribute('name') ,
                   target_url = map[target_name] ;
                if(target_url === undefined){
                    console.error('In set link , target name ' + target_name + " has not defined in name tp link map") ;
                }
                else{
                    obj.viewAllLabelsBtn.attr('href' , target_url) ;
                }
            }
        }) ;
        $(window).bind('scroll' , function(e){
            obj.updatePanelPosition() ;   
        }) ;
        $(window).bind('resize' , function(e){
            obj.isInResizing = true ; // Add this flag to avoid animate action when resizing . 
            obj.updatePanelAppearMode() ;
            obj.isInResizing = false ;
        }) ;
        this.navbarCollapsedBtn.bind('click' , function(e){
            var intervalId = 0 ,
                counts = 0 ;
            intervalId = setInterval(function(){
                var demoPanelTop = obj.demoPanel.offset().top ;
                if(demoPanelTop == obj.demoPanelOffsetTop){
                    counts ++ ;
                }
                else{
                    counts = 0 ;
                    obj.demoPanelOffsetTop = demoPanelTop ;
                    obj.updatePanelPosition() ;   
                }
                if(counts > 10){
                    obj._getElementPosition() ; // update all position info
                    clearInterval(intervalId) ;
                }
            } , 50 ) ;
        }) ; 
    } ,
    _getElementPosition : function(){
        this.windowHeight = $(window).height() ;
        this.navHeight = this.navbar.height() ;
        this.demoPanelOffsetTop = this.demoPanel.offset().top ;
        this.demoPanelBottomValInDoc = this.demoPanelOffsetTop + this.demoContentPanel.outerHeight() ;
        this.demoPanelMarginLeft = parseFloat(this.demoPanel.css('marginLeft')) ;
        this.demoPanelMarginTop =  parseFloat(this.demoPanel.css('marginTop')) ;
    } ,
    _getCurrentIdealAppearMode : function(){
        if(this.demoPanel.offset().left < this.APPEAR_MODE_THRESHOLD) return this.AppearMode.UP ;
        else return this.AppearMode.RIGHT ;
    } ,
    _isNavbarStatic : function(){
        return this.navbar.css('position') == 'static'
    } ,
    _setAppearMode : function(mode){
        if(mode == undefined) this.appearMode = this._getCurrentIdealAppearMode() ;
        else this.appearMode = mode ;
    } ,
    _setLabelPanelMainContentHeight : function(){
        var desHeight =  this.labelPanelDes.outerHeight(true) ,
            tabHeight = this.labelPanelTab.outerHeight(true) ,
            btnHeight = this.panelCloseBtn.outerHeight(true) ,
            totalHeight = this.labelPanel.height() ,
            availableHeight = totalHeight - desHeight - tabHeight - btnHeight ;
        this.labelPanelMainContent.outerHeight(availableHeight) ;
    } ,
    _getBottomValueInAppearRightMode : function(){
        var fullWindowHeight = this.windowHeight + $(document).scrollTop() ,
            distanceToWindowBottom = fullWindowHeight - this.demoPanelBottomValInDoc ;
        if(distanceToWindowBottom < 0){
            //! demo panel bottom is under the window bottom
            //~ set bottom of label panel to 0
            return 0 ;
        }
        else return distanceToWindowBottom ;
    } ,
    _getTopValueInAppearUpMode : function(){
        var occupyHeight = this.labelPanel.height() == 0 ? 0 : this.labelPanel.outerHeight() ,
            labelPanelDocTop = this.demoPanelOffsetTop - occupyHeight ,
            demoPanelWindowTop = labelPanelDocTop - $(document).scrollTop(),
            edgeValue = 0 ;
        if(! this._isNavbarStatic()){
            edgeValue = this.navHeight ;
        };
        if(demoPanelWindowTop > edgeValue){
            //! is under nav bar
            //~ set to this value
            return demoPanelWindowTop ;
        }
        else return edgeValue ; 
    } ,
    _responseBtnAppear : function(){
        this.responseBtn.css({'display' : "block"}) ;
    } ,
    _responseBtnHide : function(){
        this.responseBtn.css({'display' : 'none'}) ;
    } ,
    _contentPanelAnimateMarginLeftAction : function(toLeft){
    /**
    JQuery needed !
    using JQuery.animate to do it . 
    if not resizing , it is a animate action , Non-blocking ! 
    else , it is to set css , blocking .
    **/
        var obj = this ;
        if(! this.isInResizing){
            this.demoPanel.animate(
                { "marginLeft" : toLeft } , 
                400 ,
                "linear" ,
                function(){ obj._getElementPosition() ; }
                ) ;
        }
        else{
            this.demoPanel.css({'marginLeft':toLeft}) ;
            this._getElementPosition() ;
        }
    } ,
    _contentPanelAnimateMarginTopAction : function(toUp){
        var obj = this ;
        if(!this.isInResizing){
            this.demoPanel.animate(
                {"margin-top" : toUp} ,
                400 ,
                "linear" , 
                function(){ obj._getElementPosition() ; }
                ) ;
        }
        else{
            this.demoPanel.css({'marginTop' : toUp}) ;
            this._getElementPosition() ;
        }
    } ,
    _contentPanelRestore : function(demoPanel){
    /***
    put the demo content panel to the origin center position 
    Because we using the animate function to change the panel "margin-left" attribute to 0 , 
    so we just remove this attribute and it can be restored . And this attribute is added by `style` attribute . Just remove it !
    ***/
        this.demoPanel.removeAttr("style") ;
    } , 
    _labelPanelAnimateWidthExpandAction : function(toWidth){
        var obj = this ;
        if(! this.isInResizing){
            this.labelPanel.animate(
                {"width" : toWidth } ,
                400 ,
                "linear" ,
                function(){ obj._setLabelPanelMainContentHeight() ; } 
                ) ;
        }
        else{
            this.labelPanel.css({'width' : toWidth}) ;
            this._setLabelPanelMainContentHeight() ; 
        }
    } ,
    _labelPanelAnimateHeightExpandAction : function(toHeight){
        var obj = this ;
        if(! this.isInResizing){
        this.labelPanel.animate(
            { "height" : toHeight } ,
            400 , 
            "linear" ,
            function(){ obj._setLabelPanelMainContentHeight() ; }
            ) ;
        }
        else{
            this.labelPanel.css({'height' : toHeight}) ;
            this._setLabelPanelMainContentHeight() ;
        }
    } ,
    _labelPanelRestore : function(){
        this.labelPanel.removeAttr('style') ;
    } ,
    _paint : function(){
        // first , clear all style setting
        this._contentPanelRestore() ;
        this._labelPanelRestore() ;
        this._getElementPosition() ;
        this._setAppearMode() ;
        if(this.appearMode == this.AppearMode.RIGHT){
            var height = this.windowHeight - this.demoPanelOffsetTop ,
                width = this.demoPanelMarginLeft , // initialize width to margin-left , and animate to 2*margin-left
                targetWidth = 2*width ,
                right = 0 ,
                bottom = this._getBottomValueInAppearRightMode() ; 
            //console.log([height , width , right , bottom]) ; 
            this.labelPanel.css({
                'right' : right ,
                'bottom' : bottom
            }) ;
            this.labelPanel.outerHeight(height) ; //! the height also containing padding , border , so set `outerHeight` is necessary !
            this.labelPanel.outerWidth(width) ; 
            this._contentPanelAnimateMarginLeftAction(0) ;
            this._labelPanelAnimateWidthExpandAction(targetWidth - this.labelPanelHorizontalPaddingValue - this.labelPanelHorizontalBorderValue) ;
        }
        else if(this.appearMode == this.AppearMode.UP){
            var height = 0 ,
                targetHeight = this.APPEAR_UP_HEIGHT ,
                width = this.demoPanel.width() ,
                left = this.demoPanelMarginLeft ,
                top = this._getTopValueInAppearUpMode() ;
            this.labelPanel.css({
                'left' : left ,
                'top' : top 
            }) ;
            this.labelPanel.outerHeight(height == 0 ? this.labelPanelVerticalBorderValue + this.labelPanelVerticalPaddingValue : height) ;
            this.labelPanel.outerWidth(width) ;
            this._contentPanelAnimateMarginTopAction(targetHeight) ;
            this._labelPanelAnimateHeightExpandAction(targetHeight - this.labelPanelVerticalPaddingValue - this.labelPanelVerticalBorderValue) ;
        }
        else {
            console.error([ "Invalid Appear Mode : " , this.appearMode ].join("")) ;
        }
    } ,
    _refresh : function(){
        if(this.appearMode == this.AppearMode.UP){
            //! update top
            var topValueInWindow = this._getTopValueInAppearUpMode() ;
            if(parseFloat(this.labelPanel.css('top')) != topValueInWindow) this.labelPanel.css({'top' : topValueInWindow}) ;
        }
        else if(this.appearMode == this.AppearMode.RIGHT){
            //! update bottom
            var bottomValueInWindow = this._getBottomValueInAppearRightMode() ;
            if(parseFloat(this.labelPanel.css("bottom")) != bottomValueInWindow) this.labelPanel.css({"bottom" : bottomValueInWindow}) ;
        }
    } ,
    _setDpContent : function(dpLabels){
        var newContent = document.createDocumentFragment() ;
        for(var idx = 0 ; idx < dpLabels.length ;  ++idx ){
            var label = dpLabels[idx] ,
                dataNode = this.dpLabelData[label] ;
            if(dataNode === undefined ){
                console.error(["In set dp content : label " , label , "is not in dp data . should check !"].join(" "))  ;
                continue ;
            }
            var relType = dataNode['relType'] ,
                description = dataNode['description'] ,
                example = dataNode['example'] ,
                labelTd = document.createElement('TD') ,
                relTypeTd = document.createElement('TD') ,
                desTd = document.createElement("TD") ,
                tr = document.createElement("TR") ;
            labelTd.innerHTML = label ;
            relTypeTd.innerHTML = relType ;
            desTd.innerHTML = description ;
            tr.setAttribute("title" , ["例如 :" , example].join(" ")) ;
            tr.appendChild(labelTd) ;
            tr.appendChild(relTypeTd) ;
            tr.appendChild(desTd) ;
            newContent.appendChild(tr) ;
        }
        this.dpEntry.innerHTML = "" ;
        this.dpEntry.appendChild(newContent) ;
    } ,
    _setSdpContent : function(sdpLabels){
    /***
    Just copy _setDpContent
     **/
        var newContent = document.createDocumentFragment() ;
        for(var idx = 0 ; idx < sdpLabels.length ; ++idx){
            var label = sdpLabels[idx] ,
                dataNode = this.sdpLabelData[label] ;
            if(dataNode === undefined ){
                console.error(["In set sdp content : label " , label ,"with idx", idx ,"is not in sdp data . should check !"].join(" "))  ;
                continue ;
            }
            var relType = dataNode['relType'] ,
                description = dataNode['description'] ,
                example = dataNode['example'] ,
                labelTd = document.createElement('TD') ,
                relTypeTd = document.createElement('TD') ,
                desTd = document.createElement("TD") ,
                tr = document.createElement("TR") ;
            labelTd.innerHTML = label ;
            relTypeTd.innerHTML = relType ;
            desTd.innerHTML = description ;
            tr.setAttribute("title" , ["例如 :" , example].join(" ")) ;
            tr.appendChild(labelTd) ;
            tr.appendChild(relTypeTd) ;
            tr.appendChild(desTd) ;
            newContent.appendChild(tr) ;
        }
        this.sdpEntry.innerHTML = "" ;
        this.sdpEntry.appendChild(newContent) ;
    } ,
    _setPostagContent : function(postagLabels){
        var newContent = document.createDocumentFragment() ;
        for(var i = 0 ; i < postagLabels.length ; ++i){
            var label = postagLabels[i] ,
                dataNode = this.postagLabelData[label] ;
            if(dataNode === undefined){
                console.error(["In set postag content : label" , label , "with idx" , i , "has no content . should check !"].join(" ")) ;
                continue ;
            }
            var des = dataNode['description'] ,
                example = dataNode['example'] ,
                labelTd = document.createElement('TD') ,
                desTd = document.createElement('TD') ,
                exampleTd = document.createElement('TD') ,
                line = document.createElement('TR') ;
            labelTd.appendChild(document.createTextNode(label)) ; // Test createTextNode , haha
            desTd.innerHTML = des ;
            exampleTd.innerHTML = example ;
            line.appendChild(labelTd) ;
            line.appendChild(desTd) ;
            line.appendChild(exampleTd) ;
            newContent.appendChild(line) ;
        }
        this.postagEntry.innerHTML = "" ;
        this.postagEntry.appendChild(newContent) ;
    } ,
    _setSrlContent : function(srlLabels){
        var newContent = document.createDocumentFragment() ;
        for(var i = 0 ; i < srlLabels.length ; ++i){
            var label = srlLabels[i] ,
                dataNode = this.srlLabelData[label] ;
            if(dataNode === undefined){
                console.error(["In set srl content : label" , label , "with idx" , i , "has no content . should check !"].join(" ")) ;
                continue ;
            }
            var des = dataNode['description'] ,
                example = dataNode['example'] ,
                labelTd = document.createElement('TD') ,
                desTd = document.createElement('TD') ,
                line = document.createElement('TR') ;
            labelTd.innerHTML = label ; 
            desTd.innerHTML = des ;
            line.appendChild(labelTd) ;
            line.appendChild(desTd) ;
            newContent.appendChild(line) ;
        }
        this.srlEntry.innerHTML = "" ;
        this.srlEntry.appendChild(newContent) ;

    } ,
    /** ----------------Interface----------------  **/
    openPanel : function(){
        if(this.state == this.StateSet.APPEAR) return ;
        this._paint() ;
        this._responseBtnHide() ;
        this.state = this.StateSet.APPEAR ;
    } ,
    closePanel : function(){
        if(this.state == this.StateSet.CLOSE) return ;
        this._contentPanelRestore() ;
        this._labelPanelRestore() ;
        this._responseBtnAppear() ; 
        this.state = this.StateSet.CLOSE ;
    } ,
    updatePanelPosition : function(){
        if(this.state != this.StateSet.APPEAR) return ;
        this._refresh() ;
    } ,
    updatePanelAppearMode : function(){
        if(this.state != this.StateSet.APPEAR) return ;
        this._paint() ;
    } ,
    setLabelPanelContent :  function(drawStruct){
    /***
    set dp and sdp label explanation panel content !
    this function will using demo's `drawStruct` data , which contains current dp , sdp  relation info .
    what's more , `disableAttr` is also need . Because we draw the explanation only when dp or sdp enabled .
    because we'll use `drawStruct` and `disableAttr` , so this function should be called after drawing canvas ~
    ***/
        var _getLabels = function(typeStr){
                var labels = [] ;
                typeStr = typeStr.toLowerCase() ;
                if(typeStr == "sdp"){
                    var sdpNodeList = drawStruct[typeStr];
                    for(var i = 0; i < sdpNodeList.length; ++i){
                        for(var j = 0; j < sdpNodeList[i].length; ++j){
                            var oneSdpArc = sdpNodeList[i][j];
                            var rel = oneSdpArc['relate'];
                            if(rel != undefined && !labels.hasContain(rel)){
                                labels.push(rel);
                            }
                        }
                    }
                }
                else if(typeStr == "dp"){
                    var arcList = drawStruct[typeStr] ;
                    for(var idx in arcList){
                        var rel = arcList[idx]['relate'] ;
                        if( rel != undefined  && ! labels.hasContain(rel) ){
                            labels.push(rel) ;
                        }
                    }
                }
                else if(typeStr == "postag"){
                    var postags = drawStruct[typeStr] ;
                    for(var idx=0 ; idx < postags.length ; ++idx ){
                        var postag = postags[idx] ;
                        if( postag.length > 0 && ! labels.hasContain(postag) ) labels.push(postag) ; 
                    }
                }
                else if(typeStr == "srl"){
                    var srlS = drawStruct[typeStr] ;
                    for(var objIdx = 0 ; objIdx < srlS.length ; ++objIdx){
                        var srlObj = srlS[objIdx]['arg'] ;
                        for(var semanticRoleIdx = 0 ; semanticRoleIdx < srlObj.length ; ++semanticRoleIdx ){
                            var semanticRole = srlObj[semanticRoleIdx]['type'] ;
                            if(semanticRole != undefined && ! labels.hasContain(semanticRole)) labels.push(semanticRole) ;
                        }
                    }
                }
                return labels.sort(function(strA , strB){
                            var a = strA.toLowerCase() ,
                                b = strB.toLowerCase() ;
                            if(a > b) return 1  ;
                            else if(a == b) return 0 ;
                            else return -1 ;
                        }) ;
            } ,
            dpLabels = _getLabels('dp') ,
            sdpLabels = _getLabels('sdp') ,
            postagLabels = _getLabels('postag') ,
            srlLabels = _getLabels('srl') ;
        this._setSdpContent(sdpLabels) ;
        this._setDpContent(dpLabels) ;
        this._setPostagContent(postagLabels) ; 
        this._setSrlContent(srlLabels) ; 
    }
}

var labelExplanationPanel = null ;
$(document).ready(function(){
    //! First , remove the `toTop` tag
    if($('#toTop') != undefined) $('#toTop').remove() ; 
    labelExplanationPanel = new LabelExplanationPanel(sdpLabelExplanationData , dpLabelExplanationData ,
                                                      srlLabelExplanationData , postagLabelExplanationData) ;
    labelExplanationPanel.initPanel() ;
    labelExplanationPanel.bindAction() ;
}) ;
