# Linux系统优化及常用软件安装

## 安装

1. 使用UISO刻录光盘的时候选择RAW模式
1. 如果grub-efi-amd64的问题（这个是因为之前Windows系统使用的是BIOS引导，如果U盘使用EFI引导就会出错），需要使用`rufus`软件刻录安装盘，记得格式选择`BIOS或EFI`。记得在启动盘选择的时候不要选择`EFI`带头的U盘，要直接选择这个U盘。  
1. 如果碰到分区xxxxxx不是最小字节的问题,使用`DiskGenius`格式化硬盘为`ext4`格式即可。  
1. 安装linux系统的时候直接将整个盘全部挂载到`/`,不需要设置交换分区和EFI分区
1. 安装完系统之后，先把`软件源`设置为国内的源
1. 然后设置字体等

---
## 下载源修改

* Ubuntu

```bash

# 查看系统版本
lsb_release -a

# 根据查到的版本去阿里的镜像源中找对应版本
http://mirrors.aliyun.com/

默认下载源很慢，改成阿里的下载速度超快
sudo vim /etc/apt/sources.list

将文件内容替换成 国内源

更新
sudo apt-get update
sudo apt-get upgrade
```

* CentOS

1. 备份本地yum源
    ```bash
    mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo_bak
    ```
1. 获取阿里yum源配置文件
    ```bash
    wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
    ```
1. 更新cache
    ```bash
    yum makecache
    ```
1. 更新
    ```bash
    yum -y update
    ```

---

## 查看系统版本

1. 查看发行版本：`cat /etc/os-release`
1. 查看内核版本：`uname -r`

---

## 微信

使用`snap`安装：`sudo snap install electronic-wechat`

## 钉钉

* 网站地址：https://github.com/nashaofu/dingtalk#readme
* 直接下载`appimage`文件格式即可

---

## ShadowSocks

* 资料地址
  > https://github.com/shadowsocks/shadowsocks-qt5  
  > 下载qt5的版本安装指南在wiki中有
  > 本地地址：127.0.0.1,端口：1080,本地服务器类型：SOCKS5,加密方式：AES-256-CFB
* 浏览器代理设置
  > linux系统中要使用代理还需要设置浏览器代理，暂时使用`SwitchyOmega `设置
  > 下载地址：https://github.com/FelisCatus/SwitchyOmega
  > 所有配置可以在wiki中查看 
  > proxy中设置协议：SOCKS5,Server和Port与Shadowsocks对应
  > 配置autoswitch：`Host Wildcard`,`*.google.com`,`proxy`
  > 在浏览器中左键点击插件，选择开启自动模式`auto switch`

---

## Mint修改默认字体

1. 安装字体管理器:`sudo apt install font-manager`
1. 删除默认字体：打开字体管理器，删除所有以`AR PL`带头的所有字体
1. 修改字体大小等：主菜单-控制中心-外观-字体，里面调整自己想要的字体和大小

---

## Linux禁用GPU加速

* 问题：在虚拟机中使用Linux系统的时候在使用VSCode和谷歌浏览器的时候，在切换输入法时经常出现屏幕假死

* 禁用方法：
在Ubuntu上，要编辑的文件是/usr/share/applications/code.desktop。
更改：
`Exec=/usr/share/code/code --unity-launch %F`
变成：
`Exec=/usr/share/code/code --disable-gpu --unity-launch %F`

* 如果只是使用chrome浏览器，可以在设置中禁用GPU加速

---

## zsh安装

##### zsh
1. 查看当前环境shell
   > echo $SHELL
1. 查看系统自带哪些shell
   > cat /etc/shells
1. 安装zsh
   > yum install zsh
1. 将zsh设置为默认shell
   > chsh -s /bin/zsh
1. 修改配置文件使zsh支持通配符
   > 在终端输入gedit .zshrc,在最后一行加入setopt nonomatch（这里可以先安装ohmyzsh）就可以，然后再source ~/.zshrc（如果提示有错误，切换到root用户执行）
1. 生效bash配置文件
   > 在.zshrc配置文件中添加如下内容`source .bash_profile`
* 可以通过echo $SHELL查看当前默认的shell，如果没有改为/bin/zsh，那么需要重启shell。

---

##### oh-my-zsh

1. 自动安装
   ```bash
   wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | sh
   ```
2. 手动安装
   ```bash
   git clone git://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
   cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
   ```
3. 真-手动安装
    * 在oh-mu-zsh的github主页，手动将zip包下载下来。
    将zip包解压，拷贝至~/.oh-my-zsh目录。此处省略拷贝的操作步骤。
    执行`cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc`
    三选一即可，适合各种环境下的安装，然后需要`source ~/.zshrc`将配置生效。修改了.zshrc文件之后，都执行一下这个命令。
1. 安装完成之后使用的是默认主题，如果需要其他主题参考官网切换主题即可

---
## 其他常用软件软件安装

|软件|下载地址|功能|备注|
|---|-----|----|---|
|Rambox|https://github.com/ramboxapp/community-edition|聊天聚合工具（微信,QQ,钉钉等），具体安装查看wiki||
|sogou拼音|https://pinyin.sogou.com/linux/?r=pinyin|输入法，需要Fcitx中切换输入法|重启，右下角输入法那边可以直接配置就可以使用|
|WPS|官网直接下载Linux版|||
|Remmina|https://github.com/FreeRDP/Remmina|远程连接工具，具体安装查看wiki|需要安装rdp协议：https://community.linuxmint.com/software/view/remmina-plugin-rdp|
|filezilla|`sudo apt install filezilla`|ftp||
|红移|`sudo apt install redshift`|护眼|一般系统都已经自带|

---

## 输入法安装

1. 控制中心-输入法-选择fcitx（简体中文）-安装
1. 安装完之后打开`终端`，输入`im-config`
   > 如果提示无法配置，则根据提示删除`～`下的`.xinproc`文件，再次输入`im-config`根据提示一步一步下去就可以了，到后面选择`fcitx`选项即可。
1. 打开`fcitx-配置`配置输入法`sunpinyin`，配置输入法切换等快捷方式。
1. 配置完毕之后`注销`重新登录。

---

## Linux 关机问题

1. 安装watchdog：`sudo apt install watchdog`
1. 配置开机启动：`sudo systemctl enable watchdog`
1. 启动dog：`sudo systemctl start watchdog`

## Linux 开机问题

* linux开机卡死或者登录之后黑屏
  > 出现这个问题一般是显卡驱动（NVIDIA）问题  
  > 解决方法：系统设置（控制中心）-驱动管理-显卡驱动选择推荐的NVIDIA官方驱动，不要用开源的nouveau驱动。

---

## Linux激活root

激活root用户 `sudo passwd root` 输入新密码

---
## Linux忘记root账号密码处理

##### 不用重启直接修改（非grub方法）

1. 进入/etc文件夹
   > cd /etc

1. 编辑`passwd`这个文件
   > sudo vim passwd

1. 第一行就是`root`的，后面的`:x:`中的`x`就是密码的占位符，我们只把`x`删掉，别删冒号，然后保存。
1. 切换用户(输入su，不需要密码，看到命令行的`$`变成`#`说明成功)
   > su
1. 命令行保持在窗口不要动，重新编辑`passwd`文件,将之前删除的`x`添加到原来位置，保存退出。
   > vim passwd
1. 修改密码，还是用passwd命令。
   > passwd
1. 这时候应该就提示输入root的新密码了，根据提示输入之后修改`root`密码成功。


##### grub方式修改密码

1. 开机启动centos 7.0,看到如下画面，选择下图选单，按"e"键
    ![img](./img/install/passwd-1.png)

1. 在下图linux16行中，将ro这两个字母修改为rw init=/sysroot/bin/sh
    ![img](./img/install/passwd-2.png)

1. 修改结果如下图所示，按ctrl+x进入单用户模式  
   ![img](./img/install/passwd-3.png)

1. 使用命令访问系统： "chroot /sysroot"  
   ![img](./img/install/passwd-4.png)

1. 重置密码："passwd root"

1. 更新selinux信息："touch /.autorelabel"

1. 重新启动系统："reboot",密码修改完成。

---

## SNAP

* 输入`snap help`查看具体命令  
安装snap: `sudo apt install snapd`  
启动snap安装的程序：`snap run xxxx`  
查看snap安装的程序：`snap list`  

---

## 截图工具

1. flameshot:
    安装工具flameshot：`sudo apt install flameshot`  
    设置快捷方式：`系统设置`-》`键盘设置`-》`快捷方式`-》`添加自定义快捷方式`，名称自己定义，命令`/usr/bin/flameshot gui`，然后绑定键盘`F1`
1. shutter:
    安装：`sudo apt install shutter`
---

## 创建快捷方式

1. 创建`desktop`文件

   ```bash
   cd ~/桌面
   cd code DataGrip.desktop #使用vscode编辑，如果没有可以使用vim
   ```
1. 编辑`desktop`文件

   ``` bash
   [Desktop Entry]
   Type=Application
   Name=DataGrip
   Icon=/opt/DataGrip-2018.2.4/bin/datagrip.png  #datagrip/bin 目录下
   Exec=sh /opt/DataGrip-2018.2.4/bin/datagrip.sh
   Terminal=false
   ```
1. 右击`DataGrip.desktop`文件选择`属性`-`权限`，勾选`允许作为程序执行`
1. 双击`DataGrip.desktop`，选择`信任并运行`
1. 移动文件到应用列表中`sudo mv ~/桌面/DataGrip.desktop /usr/share/applications/`

## VMWare

* 安装
1. 官网下载vmware workstation pro
1. 增加执行权限：`chmod +x VMware-Workstation-Full-xxxxx.bundle`
1. 切换到`root`用户：`sudo su`,输入密码
1. 安装：`./VMware-Workstation-Full-xxxxx.bundle`
1. 跳出安装界面，一步一步安装即可（激活码百度查询即可）

* 卸装
1. 先查看安装的虚拟机:`vmware-installer -l`
1. 卸装虚拟机：`sudo vmware-installer –uninstall-product vmware-workstation`

---

## 文件传输

软件名：Dukto  
下载地址：https://software.opensuse.org/download.html?project=home:colomboem&package=dukto

---

## 下载工具

软件名：Motrix
下载地址：https://github.com/agalwood/Motrix/releases

---

## 面板显示调整

1. 添加面板小程序-》窗口列表
1. 右键面板，打开面板编辑模式（可以拖动图标到面板的指定位置左中右即可）

---

## 邮箱管理

1. evolution

---

## 思维导图

1. XMind ZEN

