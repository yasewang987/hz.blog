# WPS开发

WIKI: https://p.wpseco.cn/wiki/doc/632c0fbbd7c60f8bf1fd8394
开放平台：https://open.wps.cn/docs

## 加载项开发

### 环境初始化

```bash
npm install wpsjs -g

# test为demo名称，可以自行修改
wpsjs create test

# 启动调试
wpsjs debug
# 发布
wpsjs publish
```


## 常用资料记录

### WPS配置文件oem.ini地址

```
 WPS启动时，会先去读取配置文件，初始化WPS客户端，它的地址为：
windows:
    1. 安装路径\WPS Offlce\一串数字（版本号）\offlce6\cfgs\oem.ini
    2. 鼠标右键点击左面的wps文字图标==>打开文件位置==>在同级目录中找到cfgs目录
linux:
    普通linux操作系统：
          /opt/kingsoft/wps-office/office6/cfgs/oem.ini
    uos操作系统:
        /opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs/oem.ini
```

### 加载项管理文件存放位置（jsaddons目录）

```
jsaddons目录地址：
windows:
    我的电脑地址栏中输入：%appdata%\kingsoft\wps\jsaddons
linux:
    我的电脑地址栏中输入：~/.local/share/Kingsoft/wps/jsaddons
```

### wps调试器开启和使用

```
1. 配置oem.ini,在support栏下配置JsApiShowWebDebugger=true
2. linux机器上因为是预加载模式，只有使用命令quickstartoffice restart重启WPS后，调试器选项才能正确的被加载。
    普通linux操作系统：
        电脑终端执行quickstartoffice restart
    uos操作系统:
        电脑终端执行 cd /opt/apps/cn.wps.wps-office-pro/files/bin
        ./quickstartoffice restart
3. WPS打开后，新建空白文档，在有文档的情况下按alt+F12(index.html页面的调试器)
4. 其他的ShowDialog和Taskpane页面的调试器，需要点击ShowDialog弹窗或者Taskpane任务窗格，然后按F12打开。

如果无法打开调试器，那么说明加载项加载失败了，需要排查jsaddons目录，加载项管理文件是否生成，以及加载项管理文件中的加载项地址是否正确。
```

调试器无法开启的情况

```
此表现为：已经配置了JsApiShowWebDebugger=true，但alt+f12无法打开调试器，可能情况如下：
情况1. (XC环境下)终端没有执行quickstartoffice restart，(win)修改后没有关闭已开启的wps
情况2. 若oa助手能显示或调用正常，但不能打开调试器，查看键盘有没有fn按键，如果有，尝试alt+fn+f12
情况3. 加载项加载失败。此表现为oa助手不能显示，代码也没有成功执行，业务系统前端调用没有返回值或返回错误值。需要看报错情况。报错分类：
       1. 没有返回值，runparams的请求为pending状态，尝试quickstartoffice restart是否能解决。该问题需要升级sdk与wps版本至最新版。
       2. "No Plugin named: xxxx." 检查调用_WpsInvoke传入的插件名是否与安装的插件名一致  
       
【特别注意】国产化/Linux环境下，部分版本加载项菜单中，无"打开js调试器"按钮，需要手动按alt+f12唤出调试窗口
```

### NPAPI方式嵌入wps

wps版本要求：专业版（企业版）：10953之后的都支持

修改`oem.ini`配置

```
windows:

有这个是2019界面，不是则是2016
[feature]
`iiZ07s39XJwKSU9I2xbCu5_o10=jiZ07s39XJwk99gTmjC7T-ZA10`
```

```
linux

普通linux操作系统： /opt/kingsoft/wps-office/office6/cfgs/oem.ini

uos操作系统: /opt/apps/cn.wps.wps-office-pro/files/kingsoft/wps-office/office6/cfgs/oem.ini

[Support]
developuseribbon=true
```

### chrome浏览器不显示安装界面

在浏览器访问：`chrome://flags/#block-insecure-private-network-requests`，将Default设置为`Disable`，然后重新加载浏览器