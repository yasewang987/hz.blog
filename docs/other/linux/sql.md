# Linux数据库管理工具

<h2 id="datagrip">Jetbrains DataGrip</h2>

* 下载地址：https://www.jetbrains.com/datagrip/download/#section=linux
* 可以直接下载压缩包，也可以使用`snap`下载安装（具体页面上有提示）


#### 激活DataGrip

* 破解网站：http://idea.lanyus.com/
* 参考网站：https://www.cnblogs.com/dotnetcrazy/p/9711763.html
* 官网下载好压缩包（不要用snap安装）

#### 补丁破解
1. 下载破解补丁：http://idea.lanyus.com/jar/JetbrainsIdesCrack-3.4-release-enc.jar
1. `bin`文件夹下面的`datagrip.vmoptions`和`datagrip64.vmoptions`文件最后加入内容：
   ```bash
   -javaagent:/home/hzgod/soft/DataGrip-2018.2.5/bin/JetbrainsIdesCrack-3.4-release-enc.jar
   ```
1. 修改系统hosts：`sudo vim /etc/hosts`添加如下记录`0.0.0.0 account.jetbrains.com`
1. 打开`DataGrip`软件`sh DataGrip/bin/datagrip.sh`
1. 在弹出的注册框中输入`注册码`，如果没有弹出注册框，点击`help => register`选择`activate`and`activation code`，注册码如下：
   ```
   ThisCrackLicenseId-{
    "licenseId":"ThisCrackLicenseId",
    "licenseeName":"Rover12421",
    "assigneeName":"",
    "assigneeEmail":"rover12421@163.com",
    "licenseRestriction":"For Rover12421 Crack, Only Test! Please support genuine!!!",
    "checkConcurrentUse":false,
    "products":[
    {"code":"RD","paidUpTo":"2099-12-31"},
    {"code":"II","paidUpTo":"2099-12-31"},
    {"code":"DM","paidUpTo":"2099-12-31"},
    {"code":"AC","paidUpTo":"2099-12-31"},
    {"code":"RS0","paidUpTo":"2099-12-31"},
    {"code":"WS","paidUpTo":"2099-12-31"},
    {"code":"DPN","paidUpTo":"2099-12-31"},
    {"code":"RC","paidUpTo":"2099-12-31"},
    {"code":"PS","paidUpTo":"2099-12-31"},
    {"code":"DC","paidUpTo":"2099-12-31"},
    {"code":"RM","paidUpTo":"2099-12-31"},
    {"code":"CL","paidUpTo":"2099-12-31"},
    {"code":"PC","paidUpTo":"2099-12-31"},
    {"code":"DG","paidUpTo":"2099-12-31"}
    ],
    "hash":"2911276/0",
    "gracePeriodDays":7,
    "autoProlongated":false}
   ```
1. 如果没有你的这款产品就自己添加一下值：`{"code":"XX","paidUpTo":"2099-12-31"}`，code部分基本上都是图标的缩写字母

#### 激活码破解
1. 修改系统hosts：`sudo vim /etc/hosts`添加如下记录`0.0.0.0 account.jetbrains.com`
1. 在[破解网站](http://idea.lanyus.com/)点击`获取注册码`
1. 在弹出的注册框中输入`激活码`，如果没有弹出注册框，点击`help => register`选择`activate`and`activation code`

#### 创建快捷方式

* 参考[linux快捷方式创建](./shutcat.md)

---

<h2 id="dbeaver">DBeaver</h2>

* 下载地址：https://dbeaver.io/download/

---
