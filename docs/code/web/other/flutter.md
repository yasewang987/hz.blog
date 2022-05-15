# Flutter

## Linux安装

```bash
### 前置依赖
apt install file git unzip xz-utils zip -y

### libGLU.so.1安装
# ubuntu
apt install libglu1-mesa
# centos
yum install mesa-libGLU

### 自动安装
sudo snap install flutter --classic

### 手动安装
# 下载包
wget https://storage.flutter-io.cn/flutter_infra_release/releases/stable/linux/flutter_linux_3.0.0-stable.tar.xz
# 解压
cd ~/development
tar xf ~/Downloads/flutter_linux_3.0.0-stable.tar.xz
# 加入到环境变量
export PATH="$PATH:`pwd`/flutter/bin"
source ~/.zshrc
# 提前下载相关包
flutter precache
# 检查
flutter doctor


################安卓开发环境###########################
### WSL2 安装 Android Studio
# 下载对应的linux版本：https://developer.android.google.cn/studio
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2021.2.1.14/android-studio-2021.2.1.14-linux.tar.gz
# 解压到对应目录
mkdir -p $HOME/Applications
tar xfv $(ls -1t $HOME/android-studio-* | head -n1) -C $HOME/Applications
# 设置flutter中studio的目录
flutter config --android-studio-dir $HOME/Applications/android-studio/
# 修改zshrc，配置andriod启动目录
alias android-studio=$HOME/Applications/android-studio/bin/studio.sh
source ~/.zshrc
# 启动studio
android-studio

### WSL2 安装 Android SDK等 ，参考地址：
https://stackoverflow.com/questions/62857688/how-to-make-flutter-work-on-wsl2-using-hosts-emulator
https://dnmc.in/2021/01/25/setting-up-flutter-natively-with-wsl2-vs-code-hot-reload/

### 设置模拟器todo
####################################################
```

## Mac安装

## Windows安装