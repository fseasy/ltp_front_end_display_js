
function setTextFont(cxt){
    cxt.font = "12px SimSun" ;
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
    if(args == undefined) return ;
    else drawStruct.srl.push({"idx" : idx , "arg" : arg }) ;
    
}
function initDrawStruct(sentObj , drawStruct , canvas){
    var cxt = canvas.getContext("2d") ,
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
        processSrlNode(i , sentObj[i].arg , drawStruct) ; // do not (i+1) !!
    }
    //we need know the last Word 's length, so add a virtual node at last
    preTextWidth = cxt.measureText(drawStruct.texts[i]).width ;
    curContPos = drawStruct.posInfo[i] + preTextWidth + drawStruct.WS_INTERVAL ;
    drawStruct.posInfo.push(curContPos) ;
    
    cxt.restore() ;
}

function drawWS(drawStruct , canvas){
    var cxt ,
        i 
        ;
    cxt = canvas.getContext("2d") ;
    cxt.save() ;
    setTextFont(cxt) ;
    setTextFillStyle(cxt) ;
    //draw ws
    for(i = 0 ; i < drawStruct.texts.length ; i++){
        cxt.fillText(drawStruct.texts[i] , drawStruct.posInfo[i] , 40) ;
    }
    cxt.restore() ;
}

function drawPOSTAG(drawStruct , canvas){
    var cxt , 
        i , 
        height = 20 ;
    cxt = canvas.getContext("2d") ;
    cxt.save() ;
    setTextFont(cxt) ;
    setTextFillStyle(cxt) ;
    cxt.textAlign = "center" ;
    for(i = 1 ; i < drawStruct.postag.length ; i++){ // skip "Root" 's postag
        //we need to calculate the center of the position which the corresponding WS lay at .
        var centerPos = (drawStruct.posInfo[i] + (drawStruct.posInfo[i+1] - drawStruct.WS_INTERVAL)) / 2 ;
        cxt.fillText(drawStruct.postag[i] , centerPos , height ) ;
    }
    cxt.restore() ;
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
        
}
function drawNER(drawStruct , canvas){
    var cxt = canvas.getContext("2d") ,
        i ,
        height ;
    cxt.save() ;
    for(i = 0 ; i < drawStruct.ner.length ; i++){
        drawNerNode(drawStruct.ner[i] , drawStruct , cxt) ;
    }
    cxt.restore() ;
}

function drawSrlNode( drawIdx , srlNode , drawStruct , cxt){
   
    var lineStartPos ,
        lineEndPos , 
        lineY ,
        textX ,
        textY ,
        paintY ,
        paintHeight = 16 ,
        paintInterval = 2 ,
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
    cxt.fillStyle = drawStruct.SRL_DISCONF.lineColor ;
    cxt.lineWidth = drawStruct.SRL_DISCONF.lineWidth ;
    cxt.beginPath() ;
    cxt.moveTo(lineStartPos , lineY) ;
    cxt.lineTo(lineEndPos , lineY) ;
    cxt.closePath() ;
    cxt.fill() ;
    cxt.restore() ;
    
    //draw text (verb)
    cxt.fillStyle = drawStruct.SRL_DISCONF.textColor ;
    cxt.textAlign = "center" ;
    setTextFontSize(cxt) ;
    textX = (drawStruct.posInfo[srlNode.idx + 1] + drawStruct.posInfo[srlNode.idx + 1 + 1] - drawStruct.WS_INTERVAL ) / 2 ;
    textY = paintY + getFontSizeFromFontstr(cxt.font) ;
    cxt.fillText(drawStruct.texts[srlNode.idx + 1] , textX , textY ) ;
    
    //draw semantic role
    for(var i = 0 ; i < argLen ; i++){
        //draw round rect
        cxt.fillStyle = drawStruct.SRL_DISCONF.bgColor ;
        var x = drawStruct.posInfo[srlNode.arg[i].beg + 1] - drawStruct.WS_INTERVAL/2 ,
            y = paintY ,
            w = drawStruct.posInfo[srlNode.arg[i].end + 1 + 1] - drawStruct.posInfo[srlNode.arg[i].beg + 1] ,
            h = paintHeight ;
        cxt.beginPath() ;
        cxt.roundRect(x,y,w,h) ;
        cxt.endPath() ;
        cxt.fill() ;
        //draw text
        setTextFillStyle(cxt) ;
        cxt.fillText(srlNode.arg[i].type.toUpperCase() , x + w / 2 , textY) ;
    }
}

function drawSRL(drawStruct , canvas){
    var cxt = document.getContext("2d") ,
        i 
        ;
    cxt.save() ;
    for(i = 0 ; i < drawStruct.srl.length ; i++){
        drawSrlNode( i , srlNode , drawStruct ,cxt ) ;
    }
    cxt.restore() ;
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
        offsetX = 30 
        ;
    setCanvasSize() ;
    
    //bulid the drawBufs
    if(typeof canvasBufsDrawDisable == "undefined") canvasBufsDrawDisable = {} ;
    for(key in drawBufs){
        drawBufs[key] = ( canvasBufs[key] == undefined || canvasBufsDrawDisable[key] == true ) ?  null : canvasBufs[key] ;
    }
    //first clear the canvas
    cxt.clearRect(0,0,canvas.width , canvas.height) ;
    
    //draw canvasBufs to the display canvas
    // drawImage 's first parameter can be HTMLCanvasElement , HTMLImageElement , HTMLVideoElement
    //WS
    if(drawBufs["WS"] != null){
        cxt.drawImage(drawBufs["WS"] , offsetX , 100) ;
    }
    if(drawBufs["POSTAG"] != null) {
        cxt.drawImage(drawBufs["POSTAG"] , offsetX , 140) ;
    }
    if(drawBufs["NER"] != null){
        cxt.drawImage(drawBufs["NER"] , offsetX , 180 ) ;
    }
}
function createCanvasBuffer(w , h){
    var canvasBuf = document.createElement("canvas") ;
    canvasBuf.width = w ;
    canvasBuf.height = h ;
    return canvasBuf ;
}
function drawMain(sentObj , canvasId){
     //console.log(sentObj) ;
    
    var drawStruct = {
            posInfo : [] ,
            texts : [] ,
            postag : [] ,
            ner : [] ,
            srl : [] ,
            WS_INTERVAL : 40 ,
            NER_DISCONF : {
                "ni" : {"bgcolor" : "#99ffff" , "cnName" : "机构名"} ,
                "nh" : {"bgcolor" : "#99ff99" , "cnName" : "人名"} ,
                "ns" : {"bgcolor" : "#ccff66" , "cnName" : "地名" }
            } ,
            SRL_DISCONF : {
                "bgColor" : "#ee0000" ,
                "lineColor" : "#cccccc" ,
                "textColor" : "#333333" ,
                "lineWidth" : 3
            }
        } ,
        canvas = document.getElementById(canvasId) ,
        canvasBufs = {} 
        ;   
    initDrawStruct(sentObj , drawStruct , canvas ) ;
    // draw WS at WSCanvas buffer
    WSCanvas = createCanvasBuffer(5000 , 200) ;
    drawWS(drawStruct , WSCanvas ) ;
    // draw POSTAG
    POSTAGCanvas = createCanvasBuffer(5000 , 200) ;
    drawPOSTAG(drawStruct , POSTAGCanvas) ;
    // draw NER
    NERCanvas = createCanvasBuffer(5000 , 200) ;
    drawNER(drawStruct , NERCanvas) ;
    // draw SRL
    SRLCanvas = createCanvasBuffer(5000 , 200) ;
    drawSRL(drawStruct , SRLCanvas) ;
    
    canvasBufs["WS"] = WSCanvas ;
    canvasBufs["POSTAG"] = POSTAGCanvas ;
    canvasBufs["NER"] = NERCanvas ;
    canvasBufs["SRL"] = SRLCanvas ; 
    
    draw(drawStruct , canvas , canvasBufs) ;
    // it using JQuery to bind the resize !
    $(window).resize(function(e){
        draw(drawStruct , canvas , canvasBufs) ;
    }) ; 
}