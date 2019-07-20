# Linux常用命令

## 目录
---
* [权限相关](#permission)
* [查看远程端口是否可用](#serverport)
* [查看端口使用情况](#port)
* [文件压缩](#filecompress)
* [复制-移动文件](#copyfile)
* [查看安装的软件包](#dpkg)
* [chmod](#chmod)
* [添加开机启动](#openstart)
* [centos](#centos)
* [iso u盘镜像制作](#iso)
* [SSH免密登录](#sshlogin)
---

<h2 id="permission">权限相关</h2>

```bash
chmod 777 filename
adduser username #添加用户
passwd username #添加密码
```

---

<h2 id="port">端口使用情况</h2>

```bash
nc -vz 12.12.12.12 28301
```

<h2 id="port">端口使用情况</h2>

1、lsof -i:端口号 用于查看某一端口的占用情况，比如查看8000端口使用情况，`lsof -i:8000`
```bash
# lsof -i:8000
COMMAND   PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
lwfs    22065 root    6u  IPv4 4395053      0t0  TCP *:irdmi (LISTEN)
```
2、`netstat -tunlp |grep 端口号`，用于查看指定的端口号的进程情况，如查看8000端口的情况，netstat -tunlp |grep 8000
```bash
# netstat -tunlp 
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address               Foreign Address             State       PID/Program name   
tcp        0      0 0.0.0.0:111                 0.0.0.0:*                   LISTEN      4814/rpcbind        
tcp        0      0 0.0.0.0:5908                0.0.0.0:*                   LISTEN      25492/qemu-kvm      
tcp        0      0 0.0.0.0:6996                0.0.0.0:*                   LISTEN      22065/lwfs          
tcp        0      0 192.168.122.1:53            0.0.0.0:*                   LISTEN      38296/dnsmasq       
tcp        0      0 0.0.0.0:22                  0.0.0.0:*                   LISTEN      5278/sshd           
tcp        0      0 127.0.0.1:631               0.0.0.0:*                   LISTEN      5013/cupsd          
tcp        0      0 127.0.0.1:25                0.0.0.0:*                   LISTEN      5962/master         
tcp        0      0 0.0.0.0:8666                0.0.0.0:*                   LISTEN      44868/lwfs          
tcp        0      0 0.0.0.0:8000                0.0.0.0:*                   LISTEN      22065/lwfs
```
参数含义
```
-t (tcp) 仅显示tcp相关选项
-u (udp)仅显示udp相关选项
-n 拒绝显示别名，能显示数字的全部转化为数字
-l 仅列出在Listen(监听)的服务状态
-p 显示建立相关链接的程序名
```

<h2 id="filecompress">文件压缩解压</h2>

##### 一、TAR

* tar在Linux上是常用的打包、压缩、加压缩工具，他的参数很多，折里仅仅列举常用的压缩与解压缩参数

1. 参数：
`-c` ：create 建立压缩档案的参数；  
`-x` ： 解压缩压缩档案的参数；  
`-z` ： 是否需要用gzip压缩；  
`-v` ： 压缩的过程中显示档案；  
`-f` ： 置顶文档名，在f后面立即接文件名，不能再加参数  

1. 举例： 一，将整个/home/www/images 目录下的文件全部打包为 /home/www/images.tar

```bash
tar -cvf /home/www/images.tar /home/www/images ← 仅打包，不压缩
tar -zcvf /home/www/images.tar.gz /home/www/images ← 打包后，以gzip压缩
```

* 在参数f后面的压缩文件名是自己取的，习惯上用tar来做，如果加z参数，则以tar.gz 或tgz来代表gzip压缩过的tar file文件

1. 将tgz文件解压到指定目录  
`tar zxvf test.tgz -C 指定目录`  
比如将/source/kernel.tgz解压到 /source/linux-2.6.29 目录  
`tar zxvf /source/kernel.tgz -C /source/ linux-2.6.29`
1. 将指定目录压缩到指定文件  
比如将linux-2.6.29 目录压缩到 kernel.tgz  
`tar czvf kernel.tgz linux-2.6.29`

##### 二、ZIP

* 解压：`unzip -d ~/test ~/Downloads/test.zip`

##### 三、XZ

```bash
# 压缩（-k 保留被压缩的文件）
xz -z -k 要压缩的文件

# 解压
xz -d -k 要解压的文件

# 解压 tar.xz
xz -d xxx.tar.xz
tar xvf xxx.tar
```

---

<h2 id="dpkg">查看安装的软件包</h2>

使用dpkg命令  
`sudo dpkg --list | grep -i jdk`

---

<h2 id="chmod">chmod相关</h2>

常见格式：`sudo chmod 777 /home/xxx`  
777对应的用户：文件所有者、群组用户、其他用户  

权限|权限数字|含义
---|---|---
r|4|读取read
w|2|写入write
x|1|执行execute

---

<h2 id="openstart">开机启动服务</h2>

1. 增加开机启动脚本：`sudo vim /etc/init.d/aria2c`

  ```bash
  #!/bin/sh
  ### BEGIN INIT INFO
  # Provides: aria2
  # Required-Start: $remote_fs $network
  # Default-Start: 2 3 4 5
  # Default-Stop: 0 1 6
  # Short-Description: Aria2 Downloader
  ### END INIT INFO
  case "$1" in
  start)
   echo -n "已开启Aria2c"
   sudo -u user aria2c --conf-path=/etc/aria2/aria2.conf -D
  ;;
  stop)
   echo -n "已关闭Aria2c"
   killall aria2c
  ;;
  restart)
   killall aria2c
   sudo -u user aria2c --conf-path=/etc/aria2/aria2.conf -D
  ;;
  esac
  exit
  ```
  结合前面修改好了的/etc/sudoers文件，这样运行起来的aria2才是处在普通用户身份下，而不是处在root（sudo）用户身份下，下载下来的文件才不是只读的。  
  配置普通用户（root以外的用户）的运行权限
  * 打开文件/etc/sudoers:`sudo vim /etc/sudoers`
  * 在 %sudo ALL=(ALL:ALL)ALL 这行的下面添加新行：`user ALL=NOPASSWD:/usr/bin/aria2c, /etc/aria2/aria2.conf`
1. 修改开机启动脚本文件的权限为755:`sudo chmod 755 /etc/init.d/aria2c`
1. 添加aria2c服务到开机启动:`sudo update-rc.d aria2c defaults`
1. 删除开机启动：`update-rc.d -f aria2c remove`
1. 启动服务:`sudo service aria2c start`
1. 查看服务aria2c的运行状态:`sudo systemctl status aria2c`

---

<h2 id="centos">查看安装的软件包</h2>

查看所有的已安装软件名称:`rpm -qa`
显示软件的安装路径:`rpm -ql 软件名称`

---

<h2 id="copyfile">复制文件</h2>

```bash
# 复制
cp -r myproject newproject

# 移动
mv -f newproject /home

# 重命名
mv oldname newname
```

<h2 id="iso">iso u盘镜像制作</h2>

```bash
# 查看所有存储设备，注意记录u盘名称 /dev/sdc
fdisk -l

# 卸装U盘
umount /dev/sdc

# 格式化U盘(也可以直接手动格式化)
mkfs.fat /dev/sdc -I

# 将ISO镜像文件写入到U盘
dd if=ubuntu-16.0.3-desktop-amd64.iso of=/dev/sdb

```

---

<h2 id="sshlogin">SSH免密登录</h2>

在做免密登录的时候要先确定哪个用户需要做免密登录，如果没有指定默认的是当前用户，远程服务器是root用户（比如gitlab-runner运行的默认帐号是gitlab-runner，我们就需要切换到这个用户下面做免密登录配置）

如果是在`sh`等脚本里面执行`ssh`免密登录，需要在添加参数`-tt`(例如：`ssh root@192.168.20.10 -tt`)

`server1`免密登录`server2`

1. `server1`生成rsa或者dsa：`ssh-keygen -t rsa -C server1`
1. 直接用`ssh-copy-id`:`ssh-copy-id -i id_rsa.pub root@192.168.20.10`,输入密码即可（或者使用下面方式）
1. 将`server1`生成的公钥复制到`server2`

    ```bash
    scp id_rsa.pub root@server2ip:/root/.ssh
    ```
1. 在`server2`上创建`authorized_keys`，如果有就不需要了，并将`server1`的`id_rsa.pub`内容附加到`authorized_keys`中
    
    ```bash
    # 创建文件
    touch authorized_keys
    # 附加内容
    cat id_rsa.pub >> authorized_keys
    ```
1. 修改目录及文件权限

    ```bash
    chmod 644 authorized_keys id_rsa.pub
    chmod 600 id_rsa
    ```

* 配置完成之后如果使用root帐号登录提示没有权限，需要修改`/etc/ssh/sshd_config`:
    
    ```bash
    PermitRootLogin yes #允许root登录
    PermitEmptyPasswords no #不允许空密码登录
    PasswordAuthentication yes # 设置是否使用口令验证。
    StrictModes yes
    # 修改完毕之后需要重启sshd服务`systemctl restart sshd`
    ```

