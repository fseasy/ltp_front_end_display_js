
function setTextFont(cxt){
    cxt.font = "12px Microsoft YaHei,SimSun,STSong" ;
}
function setEnTextFont(cxt){
    cxt.font = "12px Arial,Courier New" ;
}
function setTextFillStyle(cxt){
    cxt.fillStyle = "black" ;
}
function getFontSizeFromFontstr(fontstr){
    // input : fontstr = "12px SimSun"
    var parts = fontstr.split("")  ,
        idx ;
    for(var i = 0 ; i < parts.length ; i++){
        if( ( idx = parts[i].indexOf("px")) != -1){
            return parts[i].slice(0,idx) ;
        }
    }
    return 12 ;
}
function getTextLineheightAndPaintHeight(fontSize){
    var verticalMargin ,
        lineheight , 
        paintHeight ;
    verticalMargin = fontSize * 0.25 ;
    paintHeight = fontSize + 2 * verticalMargin ;
    lineheight = fontSize + verticalMargin ;
    return {"lineheight" : lineheight , "paintHeight" : paintHeight} ;
}
function processNerNode(neVal , idx , drawStruct){
    // ner 's values set : {O , {B|M|E|S}-{Ni,Nh,Ns}} , where value 'O' stands for None ! {B|M|E|S} stands for the ner node position , while
    //{Ni , Nh , Ns} represent the institution , human , site
    if(neVal == undefined) return ;
    var neValParts = neVal.toLowerCase().split("-") ;
    if(neValParts.length == 2){
        switch(neValParts[0]) {
            case "s" :
                drawStruct.ner.push({
                    "neName" : neValParts[1] ,
                    "startIdx" : idx ,
                    "endIdx" : idx
                }) ;
                break ;
            case "b" :
                drawStruct.ner.push({
                    "neName" : neValParts[1] ,
                    "startIdx" : idx 
                }) ;
                break ;
            case "e" :
                drawStruct.ner[drawStruct.ner.length -1]["endIdx"] = idx ;
                break ;
            default :
        }
    }
}
function processSrlNode(idx , arg , drawStruct){
    if(arg.length == 0) return ; // if node has no arg , the arg should be a empty array
    else drawStruct.srl.push({"idx" : idx , "arg" : arg }) ;
    
}
function initDrawStruct(sentObj , drawStruct){
    var canvas = document.createElement("canvas") ,
        cxt = canvas.getContext("2d") ,
        i ,
        preTextWidth , 
        curContPos 
        ;
    drawStruct.texts.push("Root") ;
    drawStruct.posInfo.push(0) ;
    drawStruct.postag.push("") ; // For align the texts and posInfo , push a empty str to the postag array
    cxt.save() ;
    setTextFont(cxt) ;
    for( i = 0 ; i < sentObj.length ; i++){
        //process posInfo
        preTextWidth = cxt.measureText(drawStruct.texts[i]).width ;
        curContPos = drawStruct.posInfo[i] + preTextWidth + drawStruct.WS_INTERVAL ;
        drawStruct.texts.push(sentObj[i].cont) ;
        drawStruct.posInfo.push(curContPos) ;
        //process postag
        drawStruct.postag.push(sentObj[i].pos) ;
        //process ner
        processNerNode(sentObj[i].ne , i + 1 ,drawStruct) ;
        //process srl
        processSrlNode(i , sentObj[i]["arg"] , drawStruct) ; // do not (i+1) !!
        //process dp
        drawStruct.dp.push({"from" : sentObj[i].parent , "to" : i , "relate" : sentObj[i].relate}) ;
    }
    console.log(drawStruct.dp) ;
    //we need know the last Word 's length, so add a virtual node at last
    preTextWidth = cxt.measureText(drawStruct.texts[i]).width ;
    curContPos = drawStruct.posInfo[i] + preTextWidth + drawStruct.WS_INTERVAL ;
    drawStruct.posInfo.push(curContPos) ;
    
    //set the big canvas ' width : set to the last ws node pos
    drawStruct.width = curContPos ;
    
    cxt.restore() ;
    canvas = null ; // release the reference
}

function setCanvasAppropriateHeight(canvas , startY , height){
    var cxt = canvas.getContext("2d") ,
        imageData ;
    imageData = cxt.getImageData(0,startY , canvas.width , height) ;
    canvas.height = height ;
    cxt.putImageData(imageData , 0 , 0 ) ;
}

function drawWS(drawStruct){
    if(drawStruct.texts.length == 0) return null ;
    var canvas = createCanvasBuffer(5000 , 100) ,
        cxt ,
        i ,
        heightObj
        ;
    cxt = canvas.getContext("2d") ;
    cxt.save() ;
    setTextFont(cxt) ;
    setTextFillStyle(cxt) ;
    fontSize = getFontSizeFromFontstr(cxt.font) ;
    heightObj = getTextLineheightAndPaintHeight(fontSize) ;
    //draw ws
    for(i = 0 ; i < drawStruct.texts.length ; i++){
        cxt.fillText(drawStruct.texts[i] , drawStruct.posInfo[i] , heightObj.lineheight) ;
    }
    cxt.restore() ;
    setCanvasAppropriateHeight(canvas , 0 , heightObj.paintHeight) ;
    return canvas ;
}

function drawPOSTAG(drawStruct ){
    if(drawStruct.postag.length == 0) return null ;
    var canvas = createCanvasBuffer(5000,50) ,
        cxt , 
        i , 
        heightObj ,
        fontSize ;
    cxt = canvas.getContext("2d") ;
    cxt.save() ;
    setEnTextFont(cxt) ;
    setTextFillStyle(cxt) ;
    cxt.textAlign = "center" ;
    fontSize = getFontSizeFromFontstr(cxt.font) ;
    
    heightObj = getTextLineheightAndPaintHeight(fontSize) ;

    for(i = 1 ; i < drawStruct.postag.length ; i++){ // skip "Root" 's postag
        //we need to calculate the center of the position which the corresponding WS lay at .
        var centerPos = (drawStruct.posInfo[i] + (drawStruct.posInfo[i+1] - drawStruct.WS_INTERVAL)) / 2 ;
        cxt.fillText(drawStruct.postag[i] , centerPos , heightObj.lineheight ) ;
    }
    cxt.restore() ;
    setCanvasAppropriateHeight(canvas , 0 , heightObj.paintHeight) ;
    return canvas ;
}


function drawNerNode(nerNode , drawStruct , cxt ){
    var bgColor ,
        cnNeName ,
        color = "#000000" ,
        paintX ,
        paintY = 0 ,
        paintWidth ,
        paintHeight = 16 , 
        confSet = drawStruct.NER_DISCONF ,
        fontSize ,
        fontBaselineHeight ,
        fontX
        ;
    //draw bg
    cxt.beginPath() ;
    bgColor = confSet[nerNode.neName] == undefined ? "#0099cc" : confSet[nerNode.neName].bgcolor ;
    cnNeName = confSet[nerNode.neName] == undefined ? "实体名" : confSet[nerNode.neName].cnName ;
    cxt.fillStyle = bgColor ;
    paintX = drawStruct.posInfo[nerNode.startIdx] - drawStruct.WS_INTERVAL / 2 ;
    paintWidth = drawStruct.posInfo[nerNode.endIdx + 1] - drawStruct.posInfo[nerNode.startIdx]  ;
    
    cxt.fillRect(paintX , paintY , paintWidth , paintHeight) ;
    //draw text
    setTextFillStyle(cxt) ;
    setTextFont(cxt) ;
    fontSize = getFontSizeFromFontstr(cxt.font) ;
    //fontBaselineHeight = paintY + (paintHeight - fontSize)/2 + fontSize ;
    fontBaselineHeight = paintY +  fontSize ; // the baseline to draw text , it seems ok in this value 
    fontX = paintX + paintWidth / 2 ;
    cxt.textAlign = "center" ;
    cxt.fillText(cnNeName , fontX , fontBaselineHeight ) ;
    
    return paintY + paintHeight ;
    
}
function drawNER(drawStruct ){
    if(drawStruct.ner.length == 0)return null ;
    var canvas = createCanvasBuffer(500,50) ,
        cxt = canvas.getContext("2d") ,
        i ,
        height ;
    cxt.save() ;
    for(i = 0 ; i < drawStruct.ner.length ; i++){
        height =  drawNerNode(drawStruct.ner[i] , drawStruct , cxt) ;
    }
    cxt.restore() ;
    setCanvasAppropriateHeight(canvas , 0 , height ) ;
    return canvas ;
}

function drawSrlNode( drawIdx , srlNode , drawStruct , cxt){
   
    var lineStartPos ,
        lineEndPos , 
        lineY ,
        textX ,
        textY ,
        paintY ,
        paintHeight = 16 ,
        paintInterval = 4 ,
        roundRectRadius = 6 , 
        paintX ,
        argLen = srlNode.arg.length 
        ;
    paintY = drawIdx * ( paintHeight + paintInterval ) ;
    //first , draw line
    cxt.save() ;
    lineStartPos = drawStruct.posInfo[srlNode.arg[0].beg + 1] - drawStruct.WS_INTERVAL/2 ;
    lineEndPos = drawStruct.posInfo[srlNode.arg[argLen -1].end + 1 + 1] - drawStruct.WS_INTERVAL/2 ; // first +1 because the posInfo has a more node for "Root" ,
                                                                                                     //second +1 for the right position is in the next node
    lineY = paintY + paintHeight - drawStruct.SRL_DISCONF.lineWidth ;
    cxt.strokeStyle = drawStruct.SRL_DISCONF.lineColor ;
    cxt.lineWidth = drawStruct.SRL_DISCONF.lineWidth ;
    cxt.beginPath() ;
    cxt.moveTo(lineStartPos , lineY) ;
    cxt.lineTo(lineEndPos , lineY) ;
    cxt.closePath() ;
    cxt.stroke() ;
    cxt.restore() ;
    //draw text (verb)
    cxt.fillStyle = drawStruct.SRL_DISCONF.textColor ;
    cxt.textAlign = "center" ;
    setTextFont(cxt) ;
    textX = (drawStruct.posInfo[srlNode.idx + 1] + drawStruct.posInfo[srlNode.idx + 1 + 1] - drawStruct.WS_INTERVAL ) / 2 ;
    textY = paintY + getFontSizeFromFontstr(cxt.font) ;
    cxt.fillText(drawStruct.texts[srlNode.idx + 1] , textX , textY ) ;
    
    //draw semantic role
        // the english 's font should be another
    setEnTextFont(cxt) ;
    for(var i = 0 ; i < argLen ; i++){
        //draw round rect
        cxt.fillStyle = drawStruct.SRL_DISCONF.bgColor ;
        var x = drawStruct.posInfo[srlNode.arg[i].beg + 1] - drawStruct.WS_INTERVAL/2 ,
            y = paintY ,
            w = drawStruct.posInfo[srlNode.arg[i].end + 1 + 1] - drawStruct.posInfo[srlNode.arg[i].beg + 1] ,
            h = paintHeight ;
        cxt.beginPath() ;
        cxt.roundRect(x,y,w,h,roundRectRadius) ;
        cxt.closePath() ;
        cxt.fill() ;
        //draw text
        setTextFillStyle(cxt) ;
        cxt.fillText(srlNode.arg[i].type.toUpperCase() , x + w / 2 , textY) ;
    }
    
    //return the canvas Height
    return paintY + paintHeight ;
}

function drawSRL(drawStruct){
    if(drawStruct.srl.length == 0) return null ;
    var canvas = createCanvasBuffer(5000,400) ,
        cxt = canvas.getContext("2d") ,
        i ,
        height 
        ;
    cxt.save() ;
    for(i = 0 ; i < drawStruct.srl.length ; i++){
        height = drawSrlNode( i , drawStruct.srl[i] , drawStruct ,cxt ) ;
    }
    cxt.restore() ;
    setCanvasAppropriateHeight(canvas , 0 , height) ;
    return canvas ;
}

function drawDpNode(dpNode , drawStruct ,cxt){
    var fromCenter ,
        fromX ,
        toCenter ,
        lineInterval = 7 ,
        //arrow configure 
        arrowHeight = 7 ,
        arrowWidth = 5 ,
        arrowDownOffset = 2 ,
        arrowLeftOffset ,
        //paint configure
        paintY = cxt.canvas.height , 
        controlPointHeight , 
        controlPointY ,
        lineY = paintY - arrowDownOffset ,
        actualY // we should return it to calculate the MAX height
        ;
    fromCenter = ( drawStruct.posInfo[dpNode.from + 1] + drawStruct.posInfo[dpNode.from + 1 + 1] - drawStruct.WS_INTERVAL ) / 2 ;
    toCenter = (drawStruct.posInfo[dpNode.to + 1] + drawStruct.posInfo[dpNode.to + 1 + 1] - drawStruct.WS_INTERVAL ) / 2 ;
    fromX = fromCenter < toCenter ? fromCenter + lineInterval : fromCenter - lineInterval ;
    controlPointHeight = Math.abs( dpNode.to - dpNode.from ) * 13 + 10 ;
    controlPointY = lineY - controlPointHeight ;
    actualY = lineY - controlPointHeight * 3/4 ;
    cxt.strokeStyle = drawStruct.DP_DISCONF.lineColor ;
    cxt.beginPath() ; // !!!! must clear previous path ! or previous path will be repaint again and again , then the line become ugly with jaggies
    cxt.moveTo(fromX , lineY) ;
    cxt.bezierCurveTo(fromX , controlPointY , toCenter , controlPointY , toCenter , lineY) ;
    cxt.stroke() ;
    cxt.closePath() ;
    //draw arrow 
    arrowLeftOffset = dpNode.to > dpNode.from ? (arrowWidth - cxt.lineWidth )/2 + 1 : (arrowWidth - cxt.lineWidth) / 2 - 1 ; // 
    cxt.beginPath() ;
    cxt.moveTo(toCenter , paintY) ;
    cxt.lineTo(toCenter - arrowLeftOffset , paintY - arrowHeight) ;
    cxt.lineTo(toCenter + (arrowWidth - arrowLeftOffset) , paintY - arrowHeight) ;
    cxt.closePath() ;
    cxt.fillStyle = drawStruct.DP_DISCONF.lineColor ;
    cxt.fill() ;
    //draw relate text
    cxt.fillStyle = drawStruct.DP_DISCONF.textColor ;
    cxt.textAlign = "center" ;
    setEnTextFont(cxt) ;
    cxt.fillText(dpNode.relate , (fromX + toCenter ) / 2 , actualY + getFontSizeFromFontstr(cxt.font)/2) ;
    return actualY ;
}

function drawDP(drawStruct){
    if(drawStruct.dp.length == 0) return null ;
    var canvas = createCanvasBuffer(5000,500) ,
        cxt = canvas.getContext("2d") ,
        i ,
        minY = canvas.height ,
        newHeight 
        ;
    cxt.lineWidth = 0.6 ;
    for(i = 0 ; i < drawStruct.dp.length ; i++){
        yPos = drawDpNode(drawStruct.dp[i] , drawStruct ,cxt) ;
        if(minY > yPos) minY = yPos ;
    }
    minY -= 10 ; //  the up margin 
    //move the image to the right position
    //first we should save the image data , then change the canvas height and put the imageData to it
    newHeight = canvas.height - minY ;
    setCanvasAppropriateHeight(canvas , minY , newHeight) ;
    return canvas ;
}

function draw(drawStruct , canvas , canvasBufs , canvasBufsDrawDisable){
    //set the canvas's width and height .
    var cxt = canvas.getContext("2d") ,
        setCanvasSize = function(){
            var parentNode = canvas.parentNode ,
                width = parentNode.offsetWidth ;
            //console.log(width) ;
            canvas.setAttribute("width" , width) ;
        } ,
        drawBufs = {
            "WS" : null ,
            "POSTAG" : null ,
            "NER" : null ,
            "DP" : null ,
            "SRL" : null 
        } ,
        offsetX = 30 ,
        offsetY = 0 ,
        intervalY = 10 ,
        paintY = offsetY ,
        drawTarget 
        ;
    setCanvasSize() ;
    
    //bulid the drawBufs
    if(typeof canvasBufsDrawDisable == "undefined") canvasBufsDrawDisable = {} ;
    for(key in drawBufs){
        drawBufs[key] = ( canvasBufs[key] === undefined || canvasBufsDrawDisable[key] == true ) ?  "disable" : canvasBufs[key] ;
    }
    //first clear the canvas
    cxt.clearRect(0,0,canvas.width , canvas.height) ;
    
    //draw canvasBufs to the display canvas
    // drawImage 's first parameter can be HTMLCanvasElement , HTMLImageElement , HTMLVideoElement
    drawTarget = ["DP","WS","POSTAG" , "NER" , "SRL"] ;
    for(var i = 0 ; i < drawTarget.length ; i++){
        drawCanvas = drawBufs[drawTarget[i]] ;
        console.log(drawCanvas) ;
        if(typeof drawCanvas == "string" && drawCanvas == "disable") continue ;
        else if(drawCanvas == null) paintY += 3*intervalY ;
        else {
            cxt.drawImage(drawCanvas , offsetX , paintY) ;
            paintY += intervalY + drawCanvas.height ;
        }
    }    
}
function createCanvasBuffer(w , h){
    var canvasBuf = document.createElement("canvas") ;
    canvasBuf.width = w ;
    canvasBuf.height = h ;
    return canvasBuf ;
}

/*
**according to the drawStruct , paint the five components
* return value : a object contains the five components
*/
function drawComponent(drawStruct){
    var WSCanvas ,
        POSTAGCanvas ,
        NERCanvas ,
        SRLCanvas ,
        DPCanvas  ,
        canvasBufs = {}
        ;
     // draw WS at WSCanvas buffer
    WSCanvas = drawWS(drawStruct ) ;
    // draw POSTAG
    POSTAGCanvas = drawPOSTAG(drawStruct) ;
    // draw NER
    NERCanvas = drawNER(drawStruct) ;
    // draw SRL
    SRLCanvas = drawSRL(drawStruct) ;
    // draw DP
    DPCanvas = drawDP(drawStruct ) ;

    canvasBufs["WS"] = WSCanvas ;
    canvasBufs["POSTAG"] = POSTAGCanvas ;
    canvasBufs["NER"] = NERCanvas ;
    canvasBufs["SRL"] = SRLCanvas ; 
    canvasBufs["DP"] = DPCanvas ;
    
    return canvasBufs ;
}
/**
*draw containers according to the five components  , and the disable attribute
*return value : the container 's imageData
*/
function drawContainer(drawStruct , canvasBufs , disableAttr){
    //set the canvas's width and height .
    var canvas = document.createElement("canvas") ;
    canvas.width = drawStruct.width ;
    canvas.height = 500 ;
    var cxt = canvas.getContext("2d") ,
        drawBufs = {
            "WS" : null ,
            "POSTAG" : null ,
            "NER" : null ,
            "DP" : null ,
            "SRL" : null 
        } ,
        offsetX = 0 ,
        offsetY = 0 ,
        intervalY = 10 ,
        paintY = offsetY ,
        drawTarget 
        ;
    
    //bulid the drawBufs
    if(typeof disableAttr == "undefined") disableAttr = {} ;
    for(key in drawBufs){
        drawBufs[key] = ( canvasBufs[key] === undefined || disableAttr[key] == true ) ?  "disable" : canvasBufs[key] ;
    }
    //first clear the canvas
    cxt.clearRect(0,0,canvas.width , canvas.height) ;
    
    //draw canvasBufs to the display canvas
    // drawImage 's first parameter can be HTMLCanvasElement , HTMLImageElement , HTMLVideoElement
    drawTarget = ["DP","WS","POSTAG" , "NER" , "SRL"] ;
    for(var i = 0 ; i < drawTarget.length ; i++){
        drawCanvas = drawBufs[drawTarget[i]] ;
        console.log(drawCanvas) ;
        if(typeof drawCanvas == "string" && drawCanvas == "disable") continue ;
        else if(drawCanvas == null) paintY += 3*intervalY ;
        else {
            cxt.drawImage(drawCanvas , offsetX , paintY) ;
            paintY += intervalY + drawCanvas.height ;
        }
    }
    setCanvasAppropriateHeight(canvas , 0 , paintY ) ;
    drawStruct.height = paintY ;
    return cxt.getImageData(0,0,canvas.width , canvas.height) ;
}
/**
*
*
*/
function drawView(imageData , canvas , offsetX , offsetY){
    var cxt = canvas.getContext("2d")
        ;
    cxt.clearRect(0, 0 , canvas.width , canvas.height) ;
    cxt.putImageData(imageData , offsetX , offsetY ) ;
}
function drawMain(sentObj , canvasId){
     //console.log(sentObj) ;
    
    var drawStruct = {
            posInfo : [] ,
            texts : [] ,
            postag : [] ,
            ner : [] ,
            srl : [] ,
            dp : [] , 
            WS_INTERVAL : 40 ,
            width : 0 ,
            height : 0 , 
            NER_DISCONF : {
                "ni" : {"bgcolor" : "#99ffff" , "cnName" : "机构名"} ,
                "nh" : {"bgcolor" : "#99ff99" , "cnName" : "人名"} ,
                "ns" : {"bgcolor" : "#ccff66" , "cnName" : "地名" }
            } ,
            SRL_DISCONF : {
                "bgColor" : "#ffec8b" ,
                "lineColor" : "#eeeeee" ,
                "textColor" : "#6f8ca0" ,
                "lineWidth" : 5
            } ,
            DP_DISCONF : {
                "lineColor" : "blue" ,
                "textColor" : "red"
            }
        } ,
        canvas = document.getElementById(canvasId) 
        ;   
    initDrawStruct(sentObj , drawStruct) ;
   
    
    draw(drawStruct , canvas , canvasBufs) ;
    // it using JQuery to bind the resize !
    $(window).resize(function(e){
        draw(drawStruct , canvas , canvasBufs) ;
    }) ; 
}