# Chrome插件开发

功能：提取网页内容，校对之后显示到网页上

## 创建配置文件

在文件夹中创建`manifest.json`

```json
{
  "name": "Hz Check",
  "description": "Check Extension",
  "version": "1.0",
  "manifest_version": 3,
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png",
    "default_title": "快捷键【Ctrl(Win)/Command(Mac)+Shift+F】打开插件校对"
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "MacCtrl+Shift+F"
      },
      "description": "Opens check page"
    }
  },
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "options_page": "options.html"
}
```

## 添加注册脚本

在根目录下创建`background.js`文件,可以把它看作为web应用与chrome浏览器之间的“代理服务器”，它可以监听、修改、拦截web应用的资源和请求。

chrome浏览器的其他生命周期文档地址：`https://developer.chrome.com/docs/extensions/reference/runtime/#event`

需要注意将`manifest.json`中`permissions`的权限加上`storage`

```js
// 定义颜色
let color = '#3aa757';

// 首次安装插件、插件更新、chrome浏览器更新时触发
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('插件默认颜色为: %c #3aa757', `color: ${color}`);
});
```

## 制作chrome插件的弹出窗口

在根目录下创建`popup.html`，并将弹窗注册到`manifest.json`的`default_popup`中

```js
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="popup.css">
  </head>
  <body>
    <button id="changeColor" class="color-btn">无忧监测</button>
    <script src="popup.js"></script>
  </body>
</html>
```

创建css文件`popup.css`

```css
.color-btn {
  height: 200px;
  width: 300px;
  outline: none;
  margin: 10px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
}

.color-btn.current {
  box-shadow: 0 0 0 2px white,
              0 0 0 4px black;
}
```

创建js文件，并将主要逻辑写到js文件中，由于这里需要访问当前标签页以及将`JavaScript` 和 `CSS` 注入网站，所以需要在`manifest.json`的`permissions`增加`activeTab, scripting`权限。

```js
// 获取按钮实例
let changeColor = document.getElementById('changeColor');

// 从chrome插件的存储里读取color变量并修改按钮颜色
chrome.storage.sync.get('color', ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// 点击按钮
changeColor.addEventListener('click', async() => {
  // 获取当前打开的标签页面
  // 因为需要先准确地获取当前的页面才能注入js，所以这里需要使用同步函数，await
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 向目标页面里注入js方法
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor
  });
});

// 注入的方法
function setPageBackgroundColor() {
  // 从chrome插件的存储里读取color变量并修改当前页面的body背景色
  chrome.storage.sync.get("color", ({ color }) => {
    //document.body.style.backgroundColor = color;
    var xhr=new XMLHttpRequest();
    xhr.open("POST","https://aa.test.bbb/v1",true)
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        //根据服务器的响应内容格式处理响应结果
        if(xhr.getResponseHeader('content-type')==='application/json'){
          var result = JSON.parse(xhr.responseText);	
          //根据返回结果判断验证码是否正确
          if(result.code===-1){
            alert('验证码错误');
          }
        } else {
          console.log(xhr.responseText);
        }
        var dialog = document.createElement("div");
        var text = document.createElement("span");
        dialog.id="111222333"
        dialog.appendChild(text)
        text.innerText=xhr.responseText
        dialog.style.height = "200px"
        dialog.style.backgroundColor=color
        document.body.appendChild(dialog)
      }
    }
    var sendData = {userid: 'aaaa', ukey: 'bbbb', text: document.body.innerText};
    //将用户输入值序列化成字符串
    xhr.send(JSON.stringify(sendData));
  });
};
```

## 增加设置页面

设置页面主要是用来设置用户的个人偏好等选项，可以通过插件的右键选择【扩展选项】去配置。

在根目录下创建`options.html`,并将配置增加到`manifest.json`中

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 此处我们可以沿用popup.html的页面样式 -->
    <link rel="stylesheet" href="popup.css">
  </head>
  <body>
    <div id="colorBtns"></div>
    <script src="options.js"></script>
  </body>
</html>
```

创建`options.js`，并在里面增加响应的逻辑

```js
let colorBtns = document.getElementById("colorBtns"); // 按钮实例
let currentClassName = 'current'; // 当前选择的颜色

const colorList = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];

/**
 * 设置颜色按钮
 * 
 * @param {Array} colorList 颜色列表
 * 
*/
function setColorBtns(colorList) {
  
  // 获取当前存储的颜色
  chrome.storage.sync.get('color', (data) => {

    let currentColor = data.color; // 当前已选中的颜色
    
    // 遍历颜色列表并创建按钮
    colorList.map((item) => {
      let button = document.createElement('button'); // 创建按钮
      button.dataset.color = item; // 为每个按钮设置颜色变量, 存储在dataset中, 为点击事件作参数准备
      button.style.backgroundColor = item; // 设置按钮颜色样式
      button.classList.add('color-btn'); // 设置按钮样式 - popup.css

      // 设置当前已选中的按钮
      if (currentColor === item) {
        button.classList.add(currentClassName);
      };

      // 对按钮绑定点击事件
      button.addEventListener('click', handleButtonClick);

      // 将按钮写入页面
      colorBtns.appendChild(button);

    });

  });

};

/**
 * 按钮点击事件
 * 
 * @param {Object} event 按钮本身
 * 
*/
function handleButtonClick(event) {
  
  // 删除其他按钮的选中样式
  let current = event.target.parentElement.querySelector(`.${currentClassName}`); // 从上一级dom结构里获取当前已选中的按钮
  if (current && current !== event.target) {
    // 删除按钮的选中样式
    current.classList.remove(currentClassName);
  };

  // 给当前按钮增加选中样式
  event.target.classList.add(currentClassName);
  
  // 修改当前chrome插件中存储的颜色
  let color = event.target.dataset.color; // 获取按钮中的dataset参数
  chrome.storage.sync.set({ color });
};

// 执行
// 批量添加按钮
setColorBtns(colorList);
```

## 配置图标

* 工具栏中显示：在`manifest.json`配置文件中的`action`中`default_icon`里
* 工具栏以外的其他地方：在`manifest.json`配置文件中，`icons`的选项里

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    },
    "icons": {
      "16": "/images/get_started16.png",
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
}
```

## 加载完成的插件

1. 打开浏览器输入`chrome://extensions/`
1. 打开开发者模式
1. 加载已解压的扩展程序，选择插件的文件夹目录
1. 如果有代码更新，需要到扩展插件中点击`更新`按钮