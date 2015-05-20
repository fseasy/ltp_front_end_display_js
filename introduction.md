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

    原始LTP server 返回的json对象分析：
    
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
    
    
    initDrawStruct : 预处理ltp server 返回的json对象。 构建一个drawStruct对象，把分词、词性标注、命名实体识别、依存句法分析、语义角色对象从原始的基于每个词的属性变为按照各类别组织。该结构体为：
    
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
    
    其中还增加了一些绘图的信息，如postInfo为每个词的位置信息，**NER_DISCONF** , SRL_DISCONF , DP_DISCONF 等。
    
    特别的，由于画DP时有root节点，所以在texts中首先加入了“ROOT”这个词，这样便于画DP以及位置规整。但是这个也留下了一些问题——首先是索引改变（相当于多了一个词），这个注意一下问题不大。然后是当我们不选择不绘制dp的时候，分词结果应该是不会再出现“root”的，这里采取的措施是比较ugly的方法，直接在“root”的位置再绘了一个白块给覆盖了。
    
    
    
    
    
    
    



 
