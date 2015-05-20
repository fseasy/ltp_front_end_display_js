##Introducion for ltp front drawing

####结构
包含文件
    
- canvas_ex.js

    扩展canvas对象，增加圆角矩形的绘制接口

- draw_load.js

    加载代码。整个代码的入口。

- draw_obj.js

    绘制的核心，canvas对象Demo的定义。

- draw_para_view.js

    篇章视图的DOM操作。

- draw_sent_view.js

    句子视图的DOM操作。

- XAndJConverter.js

    XML与JSON的转换，以及将XML原始代码格式化为用于显示的html代码
    
####详细信息

- 页面信息

		<div id="mask">
			<div id="usingManual">
			     使用说明...
			</div>
			<div id="loadingTag">
			     加载动画...
			</div>
		</div>
		<div id="analysisPanel">
            ...
                <ul>
                    <li> <a id="sent-tab" /> </li>
                    <li> <a id="para-tab" /> </li>
                    <li> <a id="xml-tab" />  </li> 
                </ul>    
            <div class="tab-content">
                <div class="tab-pane" id="sent"> 
                    <div id="disableAttrPanel"> ...选择绘制的元素...</div>
                    ...
                        <div class="analysis-wrapper">
                            <ul id="analysisContent">
                                ...li内容由JS中initDOM动态生成....
                            </ul>
                        </div>
                </div>
                
                <div class="tab-pane" id="para">
                    <div cid="paraSelPanel"> ...选择显示元素...</div>
                    <div class="analysis-wrapper">
                        <div id="paraContent">
                            ...由JS动态生成相应篇章内容...
                        </div>
                        <div id="paraNerIntro" style="display:none">
                            ...展示NER颜色对应...
                        </div>
                    </div>
                </div>
                
                <div class="tab-pane" id="xml">
                    ...
                        <button>加载本地XML</button>
                    ...
                        <textarea>XML展示</textarea>
                        
                </div>
            </div>
		</div>

- canvas_ex.js

    定义了roundRect函数，
        
        CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){}

- draw_load.js

    首先定义了一个全局的returnAnalysisRst变量，用于存储LTP server返回的JSON结果。后来想要废弃这个全局变量，但是牵一发而动全身，最终作罢。
    
    定义的readySentView , readyParaView , readyXmlView分别对应句子视图，篇章视图，XML视图三个标签页的绘制。
    
    在JQuery ready函数中，定义了analysis函数，用于做发送请求、绘制页面的逻辑。是整个代码的主体流程。当用户点击`分析`按钮后，首先构造LTP API请求参数，然后使用以JSONP请求方式的ajax。
    
    在发送请求之后、得到返回结果之前，更新UI，把MASK下的Intro界面变为loadding界面。
    
    得到返回结果后，把MASK页面变为AnalysisPanel界面，展示分析结果——readySentView , readyXmlView
    
    在readySentView中首先调用draw_sent_view中的initDOM函数，初始化元素节点DOM。然后初始化lastOpenedEle元素为第一句，调用draw_sent_view中的drawCanvas接口在该元素上绘制canvas，最后，根据绘制的canvas元素高度，设置这个canvas父元素的高度，用于以后切换动画的绘制。
    
    readyXmlView即是将returnAnalysisRst的JSON格式数据转换为xml数据，然后再格式化该xml为用于显示的html。
    
    最后是事件绑定——
    
    Tab绑定，由于切换视图，这个用了Bootstrap V2的tab.js插件。
    
- draw_sent_view.js

    **关键变量：** 
    
    lastOpenedEle : 全局，用于在存储上次选择的是哪个句子元素。用于切换动画，将上次的元素收缩，新点击的打开。在 draw_load.js中被引用了。
    
    demo : draw_obj.js定义的canvas绘制对象。
    
    disableAttr : 全局变量，保存绘制的元素。

    **常量：**

    DRAW_CANVAS_ID : 指定用于绘制的canvas ID 。 由于一个句子对应一个canvas，每次只需绘制一个。因为我们的绘制对象ID是初始化时指定的，故采用的逻辑是，每次点击一个句子后，把该句子的canvas ID设置为这个绘制ID，从而用于绘制对象的绘制。
    
    DRAW_PARANT_ID : 整个绘制的父元素，用于initDOM时初始化元素。
    
    DISABLE_ATTR_PANEL_ID : 选择绘制元素的panel id
    
    CANVAS_HEIGHT : CANVAS的高度
    
    **函数：**
    
    **切换动画 ：**
    
    changeDisObj : 将上一个元素高度降低，新元素高度增加相同高度，如果之前元素高度为0了，则停止这个动作。
    
    switchCanvas : 设置一个定时器，不断调用changeDisObj函数。
    
    getCanvasContainerFromParentSibling ： 我们点击的是li元素，改变的是canvas的包裹元素，这个函数完成这个元素对应关系。
    
    ** 初始化句子视图的DOM元素：**
    
    getSentent : 我们的得到的句子（其实是从ltp server返回的JSON数据中拿到的）是分好词的词语，所以要把这些词语重新组合成句子。**考虑的英文的可能，但是规则不完整，可能存在一些问题。**
    
    initDOM : 对每一个句子创建一组DOM元素：
        
        li 
           text
           canvas_container
               canvas
               
    其中，由于我们要通过点击text元素来告诉我们的绘制对象应该绘制哪个句子对象（对象是一个数组，按照段落序号、句子序号组织），所以我们把该句子的段落序号、句子序号写到DOM元素属性中，方便在点击时获取到这种对应。
    
    **绘制canvas：**
    
    setAttributeAttr : 根据DISABLE_ATTR_PANEL_ID元素的check值设置disableAttr值。
    
    drawCanvas : 获得点击的元素对应的returnAnalysisVal的索引，然后设置点击元素对应的canvas的ID为DRAW_CANVAS_ID ，更新disableAttr , 绘制该canvas
    
    **事件绑定：**
    
    绑定DISABLE_ATTR_PANEL_ID元素点击事件，每次点击更改disableAttr , 重绘canvas
    
    在整个绘图父元素(DRAW_PARENT_ID)上绑定鼠标按下、弹起、移动事件，调用绘图对象相应处理，在绘图对象内部，会首先判断该对象是否是canvas对象。
    
    在整个绘图父元素上绑定点击事件，如果该事件是来自text元素，判断该点击元素不是目前打开的元素后，先绘制点击元素的canvas，然后调用切换动画，改变lastOpenedEle , 由于切换动画异步调用，直接改变lastOpendEle会出错，调用时使用了闭包。
    
- draw_para_view.js

    **关键变量：**
    
    paraNerIntroDomObj : DOM中显示Ner颜色对应的对象。直接初始化。
    
    lastSelectedValue : 设置选择绘制的对象。用于判断选择的对象是否和当前已绘制的一致。初始化为para-ws，即分词。
    
    nerMap : returnAnalysisVal中Ner的xml节点名表示和{中文名,显示颜色}的对应。
    
    paraDrawObj : 绘制的对象（div），使用下面的DRAW_PARA_PARENT_ID元素。
    
    **常量**
    
    DRAW_PARA_PARENT_ID : 绘制的父元素ID，或者说是绘制的容器元素ID。
    
    PARA_SELECT_PANEL_ID : 选择的ratio面板元素ID。
    
    **函数**
    
    **绘制函数：**
    
    drawParaOriginWrod : 绘制原句。与上述的**getSentent**类似，对英文或许存在问题。
    
    drawParaWS : 绘制分词
    
    drawParaPostag : 绘制POS
    
    drawParaNer : 绘制NER 。
    
    **NER颜色对应：**
    
    setNerIntroDis : 控制NER颜色对应面板是否显示
    
    initNerIntro : 根据nerMap绘制NER颜色面板
    
    绘制控制：
    
    selectParaPartToDrawByValue : 根据ratio面板选择的名称确定绘制哪个元素。
    
    paraSelectAction : ratio点击事件响应函数，就是对event的value解析，然后调用selectParaPartToDrawByValue .
    
    **事件绑定：**
    
    对ratio面板绑定响应。
    
    
- draw_obj.js

    **原始LTP server 返回的json对象分析：**
    
        [ -> 这是JSON开始 ， 里面包含N个片段对象
        
            [ -> 一个片段对象 ， 里面包含K个句子对象
                
                [ -> 一个句子对象 ，里面是多个个 分词gram 字典（Object）
                
                    { -> unigram 对象，包含如下属性：
                    
                        "id" : 0 , int类型 , 该unigram的index , 与该unigram对象在句子数组的索引相同
                        "cont" : "我" , str类型 , 该unigram的值
                        "pos" : "ns" , str类型 , 该unigram的POSTAG
                        "ne" : "S-Ns" , str类型 , 该unigram的命名实体 , 值的取值为 "O" | [BMES]-[(Ni)(Nh)(Ns)] , "O"表示无，BMES表示实体的位置标签，Ni，Nh，Ns表示实体类别。后续应该会继续添加。
                        "parent" : 1 , int类型 , 该unigram的父亲节点索引
                        "relate" : "VOB" , str类型 , 该unigram与父亲节点的关系
                        "args" : [ -> array类型 , 数组包含以该gram为核心词的语义角色行为中的每个语义角色对象。以下是不含核心词的角色对象。绘制时需要把这个词绘制为核心词
                                    
                                    {
                                        beg : 语义角色开始的idx ， 对应该句子的unigram 索引
                                        end : 语义角色结束的idx
                                        type : 语义角色类别
                                    }
                        
                        
                                  ]  

                                  
                    } 
                    ,
                    { -> 下一个unigram对象
                      
                    }
                    ...
                ]
                ,
                [ -> 下一个句子
                    
                ]
                ...
            ] 
            ,
            [ -> 第二个片段对象...
            
            ]
            ...
        ]   
    
    
    **变量**
    
    对象Demo 
    
    其中包含的关键数据对象：
    
    drawStruct : 用于存储绘制信息的对象
    
    imageData : 绘制的图像数据，用于快速移动
    
    offset ： 存储`相对原点`，即上次绘制的起点坐标。以canvas(0,0)为参照系。
    
    eventModule ： 存储鼠标按下、移动中的事件信息，包含按下时的坐标信息，以及是否按下的状态。
    
    **函数：**
    
    **输入数据预处理——构建绘制信息对象drawStruct**
    
    processNerNode : 预处理Ner节点。 从原始较为分离的信息变为更加整合的对象: 
        
        {
            "neName" : ... ,
            "startIdx" : ... ,
            "endIdx" : ...
        }
        
    将该对象放入到drawStruct中的ner数组中
    
    processSrlNode : 预处理Srl节点。简单的把原始对象包了一下，保存了核心词的位置：
        [ -> 语义角色对象的数组
        
            {
                idx : 核心词idx
                arg : 该词的其余语义角色对象，直接复制了原始的值过来。
            }
        
        ]
    
    
    initDrawStruct : 预处理ltp server 返回的json对象。 

    构建一个drawStruct对象，把分词、词性标注、命名实体识别、依存句法分析、语义角色对象从原始的基于每个词的属性变为按照各类别组织。该结构体为：
    
        drawStruct = {
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
                    "cnName" : "机构"
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
        }
    
    其中还增加了一些其他绘制的信息，如postInfo为每个词的位置信息，**NER_DISCONF** , SRL_DISCONF , DP_DISCONF 等。
    
    接下来说明该绘画数据对象的构造流程：
    
    函数输入为returnAnalysisVal中的某个一个句子对象。我们要遍历这个句子对象，构建用于存储绘图信息的drawStruct。
    
    在遍历句子对象之前，有一些初始操作：
    
    首先，由于画DP时有root节点，所以在texts中首先加入了“ROOT”这个词，这样便于画DP以及位置规整。（但是这个也留下了一些问题——首先是索引改变（相当于多了一个词），这个注意一下问题不大。然后是当我们不选择不绘制dp的时候，分词结果应该是不会再出现“root”的，这里采取的措施是比较ugly的方法，直接在“root”的位置再绘了一个白块给覆盖了。）
    
    在texts中加入“Root”之后，还要在posInfo中加入一个0，表示第一个词起始绘制位置为0.
    
    为了对应texts，还给postag放入一个空白字符（一切都是为了一致性）。
    
    初始操作之后，开始遍历句子对象，即returnAnalysisVal[i][j] 。
    
    首先把每个unigram对象的cont放到texts中，然后用contex的measureText函数确定上一个字符的宽度，再加上间隔，就是该字符的绘制位置。将其放入到posInfo中。接着把postag信息直接放入postag中。调用processNerNode处理该节点的ner信息，调用srlNode处理srl信息，处理dp时，构建对象
    
        {
            from : "parent" ,
            to : "id" ,
            relate : "relate"
        }
    
    最后，计算最后一个字符的结束位置，放入posInfo中。
    
    **字体处理函数**
    
    setTextFont 
    
    setEnTextFont 
    
    setCnTextFont
    
    setTextFillStyle 
    
    getFontSizeFromFontstr
    
    getTextLineheightAndPaintHeight 
    
    **canvas处理函数**
    
    setCanvasAppropriateHeight : 根据canvas内容实际占据的大小，把内容居左上，将canvas设置为其恰好的大小。
    
    createCanvasBuffer : 创建一个canvas缓冲区
    
    **绘制函数**
    
    drawWS : 根据posInfo和texts绘制分词，返回一个恰当大小的canvas对象。
    
    drawPOSTAG : 与画分词类似。
    
    drawNerNode : 绘制一个NER节点，先绘制背景颜色，再绘制文字。
    
    drawNER : 循环调用drawNerNode ，绘制全部的节点。如果唔ner对象，返回null。
    
    drawSrlNode : 绘制Srl节点。先绘值该语义动作的基线，首先要确定其实位置和结束位置。由于arg里是按序排列的，那么arg里第一个元素的beg和最后一个元素的end指向的索引可能是基线的开始和结束位置。但是还要和核心词的位置进行比较，当核心词在开头或结尾时，基线的开始或结尾由核心词位置决定。 接着画核心词，最后画其他语义角色。先绘制圆角矩形的背景，然后绘制文字（type）。
    
    drawSRL : 循环调用drawNerNode.如果无srl元素，返回null。
    
    drawDpNode : 绘制dp弧。使用三节贝塞尔曲线。关于贝塞尔曲线的绘制原理，参看 [贝塞尔曲线扫盲](http://www.html-js.com/article/1628) .三阶需要四个点，move to一个点，然后函数指定另外三个点。这四个点围成了一个矩形，宽度是这两个词的距离X，高度设为Y = X*13 + 10 ，这个是参考原始Falsh曲线的高度，多次试出来的结果。这样画出来的贝塞尔曲线，最高点坐标为(X/2 , Y * 3 / 4 ) 。我们要在这个点这里绘制关系字符。最后，再绘制箭头，这里要根据from、to的左右关系决定向箭头向哪边梢偏。
    
    drawDP : 循环绘制DP节点。每个词语节点，其父元素是唯一的，故将父元素到该元素的曲线绘制落点设置为词的中心位置，其余则放到该位置的两边。每次只绘制父亲节点到该节点这一条曲线即可。
    
    **绘制层次**
    
    首先需要分析引起重绘的动作：
    
    1. 查看某个句子的分析结果（句子元素点击操作） —— 全部重绘

    2. 选择查看该句子的部分分析结果（绘制元素选择操作） —— 只需改变绘制到视口的元素即可
    
    3. 移动绘图（鼠标点击拖动）—— 只需改变位置即可
    
    由上，把绘制动作依据前端操作的不同分为了三个层次。为了实现这三个层次，我们就需要在后端为每个部分单独绘制一个canvas缓冲区；然后当选择部分结果显示时，就把需要的部分拷贝到视口即可；当拖动鼠标时，只需改变视口内元素的位置即可。
    
    故设计了如下的3层API :
    
    drawComponent : 针对一个句子，单独绘制各个部分的缓冲，并将其保存起来。
    
    drawContainer : 根据draw_sent_view得到的disableAttr选择需要展示的元素，将其缓冲元素复制到container中。**注意，在这里完成了前面提到的关于root节点绘制的问题。当我们不绘制dp部分时，我们要在root的位置多绘制一块白块（在实现时，用的清除操作），覆盖住ws绘制的root节点。**
    
    drawView : 绘制视口图像。将container中的图像从视口中以(X,Y)为原点的地方开始复制。
    
    **外部调用API**
    
    analysis : 输入ltp server 返回的json对象returnAnalysisVal[i][j] , 即一个原始句子对象。
    
    update ： 输入draw_sent_view.js中获得的disableAttr,调用drawContainer然后调用move函数。
    
    paint : disableAttr 为空的update调用。
    
    move : 输入为offsetX , offsetY . 
    
    addaptWith : 根据canvas父元素的宽度确定canvas元素的宽度.
    
    **坐标处理**
    
    setOffset : 根据偏移值设置新的绘制的`相对原点`坐标。事件接口中的移动处理逻辑会详细介绍。
    
    **事件接口**
    
    首先说下比较关键的关于**移动处理的逻辑**：
    
    相对原点： this.offset -> { x , y } . 这个对象记录了上次移动后停留的位置。为相对于canvas（0,0）的坐标。
    
    移动偏移： 当我们按下按钮后，我们立即记录按下的鼠标位置！是鼠标位置，event.pageX , event.pageY , 即在整个页面的位置,将它们保存到eventModule对象中，此记为`移动相对原点` ； 然后在我们移动过程中，我们记录当下的鼠标位置，同样是event.pageX , event.pageY , 我们用这个值减去在eventModule中的`移动相对原点`，得到了一个偏移值x , y . 我们把这个偏移值传给move函数，move函数内部将这个偏移加上`相对原点`值，即是移动后绘制图像应该在canvas被绘制的起始位置。当我们弹起鼠标后，我们把鼠标点击和弹起这段的偏移值传给setOffset函数，函数在内部将这个移动偏移更新到`相对原点`上.到此，一个完整的拖动事件就完成了。
    
    
    downAction  : 记录鼠标位置，同时，还设置按下标志。
    
    upAction ： 设置`相对原点`位置，清楚按下标志
    
    moveAction ：在按下标志有效时，移动绘制图像
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    



 
