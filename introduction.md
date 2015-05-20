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

- canvas_ex.js

    定义了roundRect函数，
        
        CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){}

- draw_load.js

    首先定义了一个全局的returnAnalysisRst变量，用于存储LTP server返回的JSON结果。后来想要废弃这个全局变量，但是牵一发而动全身，最终作罢。
    
    在JQuery ready函数中，定义了analysis函数，用于做发送请求、绘制页面的逻辑。是整个代码的主体流程。当用户点击`分析`按钮后，首先构造
    
    定义的readySentView , readyParaView , readyXmlView分别对应句子视图，篇章视图，XML视图三个标签页的绘制。
    



 
