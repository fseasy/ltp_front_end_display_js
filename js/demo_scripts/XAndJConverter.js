/**
 *  XML and JSON Converter For LTP request result
 *  
 *  api :
 *  json 2 XML
 **      XMLDOM LTPRstParseJSON2XMLDOM( LTPResult_JSON )  
 *  
 *  xml 2 JSON
 **      JSON LTPRstParseXMLDOM( LTPResult_XML ) (in fact , return val is a array )
 *
 *  xml 2 String
 **      String parseXMLDOM2String( XMLDOM )
 *
 *  string 2 XML
 **      XMLDOM parseString2XMLDOM( string )

 *  format xmlString for Display in textarea
 **      String formatDOMStrForDisplay( String )
**/



// Get the xmlDOM , if failed , return null
function createXMLDOM(){
    if(window.ActiveXObject){
        return new ActiveXObject("Microsoft.XMLDOM") ;
    }
    else if(document.implementation && document.implementation.createDocument){
        return document.implementation.createDocument("","",null) ;
    }
    else return null ;

}

// parse the xmlDOM to string , if failed , return ""
function parseXMLDOM2String(xmlDOM){
    if(window.ActiveXObject){
        return xmlDOM.xml ;
    }
    else if (document.implementation && document.implementation.createDocument){
        return new XMLSerializer().serializeToString(xmlDOM) ;
    }
    else return ""
}

// parse the xmlStr to xmlDOM
function parseString2XMLDOM(xmlStr){
    var parser = new DOMParser() ;
    if(!parser) return "" ;
    return parser.parseFromString(xmlStr , "text/xml")
}

/*------- For LTP local xml and json data format ------------- */

// input _ 1. xmlDOM 2.JSON formated data
function getDocElement(xmlDOM,JsonData){
    var doc = xmlDOM.createElement("doc") ;
    for(var paraId = 0 ; paraId < JsonData.length ; paraId++){
        var JsonPara = JsonData[paraId] ,
            para = xmlDOM.createElement("para") ;
        para.setAttribute("id" , paraId) ;
        doc.appendChild(para) ;
        // add the sent
        for(var sentId = 0 ; sentId < JsonPara.length ; sentId++){
            var JsonSent = JsonPara[sentId] ,
                sent = xmlDOM.createElement("sent") , 
                contArray = [] ;
            sent.setAttribute("id" , sentId) ;
            para.appendChild(sent) ;

            // add the word 
            for(var wordId = 0 ; wordId < JsonSent.length ; wordId++){
                var JsonWord = JsonSent[wordId] ,
                    word = xmlDOM.createElement("word") ;
                sent.appendChild(word) ;
                word.setAttribute("id" , JsonWord.id) ;
                word.setAttribute("cont" , JsonWord.cont) ;
                word.setAttribute("pos" , JsonWord.pos) ;
                word.setAttribute("ne" , JsonWord.ne) ;
                word.setAttribute("parent" , JsonWord.parent) ;
                word.setAttribute("relate" , JsonWord.relate) ;

                // add the arg

                for(var argId = 0 ; argId < JsonWord.arg.length ; argId++){

                    var JsonArg = JsonWord.arg[argId] ,
                        arg = xmlDOM.createElement("arg") ;
                    word.appendChild(arg) ;
                    arg.setAttribute("id" , JsonArg.id) ;
                    arg.setAttribute("type" , JsonArg.type) ;
                    arg.setAttribute("beg" , JsonArg.beg) ;
                    arg.setAttribute("end" , JsonArg.end) ;
                }

                // add the sem
                for(var semId = 0; semId < JsonWord.sem.length; ++semId){
                    var jsonSem = JsonWord.sem[semId],
                        sem = xmlDOM.createElement("sem");
                    word.appendChild(sem);
                    sem.setAttribute("id", jsonSem.id);
                    sem.setAttribute("parent", jsonSem.parent);
                    sem.setAttribute("relate", jsonSem.relate);
                }

                // add to the cont
                contArray.push(JsonWord.cont) ;

            }

            // combine the contArray to cont string
            var contStr = "" ;
            for(var i = 0 ; i < contArray.length ; i++){
                if(i == 0 ){
                    contStr += contArray[i] ;
                }
                else{
                    var enCharReg = /[a-zA-Z]/ ,
                        lastChar = contArray[i-1].slice(-1) ,
                        firstChar = contArray[i].slice(0) ;
                    if(enCharReg.test(lastChar) && enCharReg.test(firstChar)){
                        contStr += " " ;
                    }
                    contStr += contArray[i] ;
                }
            }
            sent.setAttribute("cont" , contStr) ;

        }

    }

    return doc ;
}


// parse the LTP result of JSON type to XMLDOM 
// input - JSON data ; 
// return - XMLDOM
function LTPRstParseJSON2XMLDOM(jsonData){
    var xmlDOM = createXMLDOM() ;
    if(xmlDOM == null) return null ;
    var root = xmlDOM.createElement("xml4nlp") ,
        note = xmlDOM.createElement("note") ,
        noteAttr = {
            "sent" : "y" , "word" : "y" , "pos" : "y" , "ne" : "y" , "srl" : "y"
        }
    ;
    for(var attr in noteAttr){
        note.setAttribute(attr , noteAttr[attr]) ;
    }
    root.appendChild(note) ;
    root.appendChild(getDocElement(xmlDOM , jsonData)) ;
    return root ;
}


// format the DOM str for display in textarea
function formatDOMStrForDisplay(str){
    var formatedStr = "" ,
        startPos = 0 , 
        nextLineIndent = 0 ,
        curLineIndent = 0 ,
        tmpStr = "" ,
        indentStr = ""  ,
        xmlHeader = '<?xml version="1.0" encoding="utf-8" ?>';
    for(var i = 0 ; i < str.length ; i++){
        switch(str.charAt(i)){
            case '<' :
                if(i+1 < str.length && str.charAt(i+1) == '/'){
                    curLineIndent -- ;
                    break ;
                }
                nextLineIndent ++ ;
                break ;
            case '/' :
                nextLineIndent -- ;
                break ;
            case '>' :
                tmpStr = str.slice(startPos , i + 1 ) ;
                startPos = i + 1 ;
                indentStr = (function(){ var tmpIndentStr = "" ; for(var k = 0 ; k < curLineIndent ; k++){tmpIndentStr += "\t" ; } return tmpIndentStr ;})() ;
                formatedStr +=  indentStr + tmpStr + "\n" ;
                curLineIndent = nextLineIndent ;
                break ;
            default :
                break ;
        }
    }
    return xmlHeader + '\n' + formatedStr ;
}

/* ----- LTP XML ( doc )to JSON -------- */
function getDocJSON(docXML){
    var rst = [] ,
        paras = docXML.getElementsByTagName("para") ;
    for(var paraIdx = 0 ; paraIdx < paras.length ; paraIdx ++ ){
        var para = paras[paraIdx] ,
            paraJSON = [] ,
            sents = para.getElementsByTagName("sent") ;
        rst.push(paraJSON) ;
        for(var sentIdx = 0 ; sentIdx < sents.length ; sentIdx ++){
            var sent = sents[sentIdx] ,
                sentJSON = [] ,
                words = sent.getElementsByTagName("word") ;
            paraJSON.push(sentJSON) ;
            for(var wordIdx = 0 ; wordIdx < words.length ; wordIdx++){
                var word = words[wordIdx] ,
                    wordJSON = {} ,
                    argList = [] ,
                    args = word.getElementsByTagName("arg"),
                    semList = [],
                    sem = word.getElementsByTagName("sem");
                sentJSON.push(wordJSON) ;
                // parse arg
                for(var argIdx = 0 ; argIdx < args.length ; argIdx++){
                    var arg = args[argIdx] ,
                        argJSON = {} ;
                    argJSON["id"] = arg.getAttribute("id") ;
                    argJSON["type"] = arg.getAttribute("type") ;
                    argJSON["beg"] = arg.getAttribute("beg") ;
                    argJSON['end'] = arg.getAttribute('end') ;
                    argList.push(argJSON) ;
                }
                wordJSON["arg"] = argList ;
                // parse sem
                for(var semId = 0; semId < sem.length; ++semId){
                    var oneArc = sem[semId],
                        oneArcJson = {};
                    oneArcJson["id"] = oneArc.getAttribute("id");
                    oneArcJson["parent"] = oneArc.getAttribute("parent");
                    oneArcJson["relate"] = oneArc.getAttribute("relate");
                    semList.push(oneArcJson);
                }
                wordJSON["sem"] = semList;
                // parse others
                var attrList = ["id" , "cont" , "pos" , "ne" , "parent" , "relate" ] ;
                for(var i = 0 ; i < attrList.length ; i++){
                    wordJSON[attrList[i]] = word.getAttribute(attrList[i]) ;
                }
            }

        }
    }
    return rst ;
}


// to parse XML to JSON
function LTPRstParseXMLDOM2JSON(xmlDOM){
    var doc = xmlDOM.getElementsByTagName("doc")[0] ;
    return getDocJSON(doc) ;
}
