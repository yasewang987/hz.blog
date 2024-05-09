# 开发辅助工具

## Github访问加速工具

https://github.com/docmirror/dev-sidecar

## Android系统工具

### Termux

官网：https://termux.com/

下载地址：https://f-droid.org/packages/com.termux/

国内镜像源地址：https://mirrors.tuna.tsinghua.edu.cn/help/termux/

```bash
# 更换清华源(第一步选中所有main、x11，第二步选择清华源)
termux-change-repo

# 安装必要工具
pkg install openssl
pkg install openssh
pkg install vim

# 执行ssh命令时报错CANNOT LINK EXECUTABLE “ssh“ library “libcrypto.so.1.1“ not found，需要先卸载openssh，然后先安装ssl，再安装ssh
pkg uninstall openssh

# 安装proot，proot-distro
pkg install proot proot-distro -y
# 查看支持的系统
proot-distro list
# 安装debian
proot-distro install debian
# 启动debian
proot-distro login debian
# 修改debian镜像源
https://mirrors.tuna.tsinghua.edu.cn/help/debian/
mv /etc/apt/sources.list /etc/apt/sources.list.bak
cat <<EOF > /etc/apt/sources.list
deb http://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware
deb http://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware
deb http://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware
deb https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
EOF
# 更新软件包列表
apt update
# 退出debian
exit

# 安装vscode：https://code.visualstudio.com/docs/setup/linux
apt-get install wget gpg
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
rm -f packages.microsoft.gpg
apt install apt-transport-https
apt update
apt install code
# 启动vscode（会给出启动的地址和token）
code --no-sandbox --user-data-dir="/root/code" serve-web --host 127.0.0.1
# 然后通过安卓浏览器去打开（推荐via浏览器）
```

## 数据库管理工具

* Dbeaver：https://github.com/dbeaver/dbeaver/releases


## 原型设计工具

* BootStrap Studio

## 手机电脑同屏工具

github地址：https://github.com/barry-ran/QtScrcpy

`QtScrcpy` 是一个强大的安卓手机实时投屏到电脑的开源项目，可以将你的安卓手机屏幕投射到电脑上，并进行控制，无需 Root 权限，支持通过 USB 或 网络连接 Android 设备，并进行显示和控制，甚至是群控。支持 Windows、Mac 和 Linux 系统。

第一次连接需要用USB数据线，开启手机上的USB调试。



## 免费开源可视化爬虫工具

`EasySpider` 是一个免费开源可视化爬虫工具，可以使用图形化界面，无代码可视化的设计和执行爬虫任务。只需要在网页上选择自己想要爬的内容并根据提示框操作即可完成爬虫设计和执行。同时软件还可以单独以命令行的方式进行执行，从而可以很方便的嵌入到其他系统中，非常方便，即使不会代码也很轻松爬去自己想要的数据资源了，目前支持 Windows、macOS和Linux。

* 下载地址：https://github.com/NaiboWang/EasySpider/releases
* GitHub地址：https://github.com/NaiboWang/EasySpider
* 详细实用教程：https://blog.csdn.net/ihero/article/details/130805504

## 项目管理和团队协作工具

github地址：https://github.com/mattermost/focalboard

focalboard：这是一款开源、多语言、自托管的项目管理工具，兼容了 Trello 和 Notion 的特点。它支持看板、表格和日历等视图管理任务，并提供评论同步、文件共享、用户权限等功能。该工具还提供了适用于 Windows、macOS、Linux 系统的客户端。

## UI库

* [hyperui](https://github.com/markmead/hyperui)：免费的 Tailwind CSS 组件集合。这些组件支持深色模式、移动端适配和 LTR，复制代码即可使用。

## 图像处理

* [gocv](https://github.com/hybridgroup/gocv)：基于 OpenCV 的 Go 语言计算机视觉库。OpenCV 是一个开源、跨平台的计算机视觉库，多用于做图像处理、视频采集和分析。该项目是 OpenCV 的 Go 语言封装库，让开发者可以使用 Go 语言调用 OpenCV 库，具有支持多平台、OpenCV 4+ 和 GPU 硬件加速等特性。

```go
package main

import (
 "gocv.io/x/gocv"
)

func main() {
 // 打开摄像头
 webcam, _ := gocv.OpenVideoCapture(0)
 // 新建 GUI 窗口
 window := gocv.NewWindow("Hello")
 img := gocv.NewMat()
 // 显示视频
 for {
  webcam.Read(&img)
  window.IMShow(img)
  window.WaitKey(1)
 }
}
```

## 在线共享屏幕

项目开源地址：https://github.com/screego/server

它允许用户在网络上共享其屏幕，并允许其他用户通过浏览器访问和查看共享的屏幕。这个工具非常有用，特别是在需要进行远程协作、远程支持或在线培训的情况下。用户的屏幕分享服务。它可以快速启动一个在线共享屏幕的服务，让用户无需安装任何软件，仅使用浏览器就能分享自己的屏幕画面。项目基于网页实时通信(WebRTC) 实现，由 STUN/TURN 协议完成内网穿透和浏览器端对端的连接，既实用又有源码可以学习。

```bash
# docker部署
docker run --net=host -e SCREEGO_EXTERNAL_IP=127.0.0.1 -e SCREEGO_SECRET=test123456 ghcr.io/screego/server:1.10.3
```

## 数据清洗工具

### OpenRefine

地址：http://www.gitpp.com/robotos/openrefine

主要功能和特点
* 数据清洗：OpenRefine提供了多种数据清洗功能，包括去除重复项、填补缺失值、转换数据类型等。
* 数据转换：用户可以轻松地对数据进行各种转换，如大小写转换、日期格式转换、文本替换等。
* 数据筛选和排序：OpenRefine允许用户根据特定条件筛选数据，并按照某一列或多列进行排序。
* 数据合并与拆分：用户可以轻松地合并或拆分数据列，以满足特定的数据分析需求。
* 数据重构：通过强大的GREL（Google Refine Expression Language）表达式，用户可以对数据进行复杂的重构和计算。
* 数据预览和导出：OpenRefine提供了数据预览功能，以便用户在处理过程中随时查看数据状态。处理完成后，数据可以导出为多种格式，如CSV、TSV、Excel等。
* 协作与分享：OpenRefine支持多人协作处理同一个数据集，并允许用户将处理步骤保存为JSON格式的文件，方便与他人分享和交流。

## android开发环境

* docker-android: https://github.com/budtmo/docker-android