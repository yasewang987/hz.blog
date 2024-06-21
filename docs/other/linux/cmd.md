# Linux常用命令

## 下载源修改

参考：https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/ ,需要注意，如果是`arm`等的，需要使用ports的源，注意切换之后修改

```bash
#### Ubuntu
# 查看系统版本
lsb_release -a
# 备份老文件
mv /etc/apt/sources.list /etc/apt/sources.list.back
# 输入新源
sudo vim /etc/apt/sources.list
# 更新
sudo apt-get update
sudo apt-get upgrade

# 如果上面的执行报错 `does not have a Release file`，则需要加上trusted
sed -i 's/deb/deb [trusted=yes]/g' /etc/apt/sources.list

# 如果上面的执行报错 `URL redirect target contains control characters, rejecting`
# 那一般是网络限制问题，可以通过手机热点试试
```

## 修改IP，DNS

```bash
#### Ubuntu / 银河麒麟v10
sudo vim /etc/systemd/resolved.conf
DNS=114.114.114.114 233.5.5.5 8.8.8.8
# 重启生效
systemctl restart systemd-resolved

# 银河麒麟如果没有生效，直接修改 /etc/resolv.conf 文件
vim /etc/resolv.conf
# 增加这行（不需要重启直接可以使用）
nameserver 114.114.114.114

vim /etc/netplan/xx-netcfg.yaml
# DNS修改(修改文件中的nameservers)
nameservices:
  addresses: [8.8.8.8,114.114.114.114]
# 生效
netplan apply


#### Centos
# 查看网卡id
ip addr
# centos7 / kylin-v10
vi /etc/sysconfig/network-scripts/ifcfg-网卡id
# 修改如下内容
BOOTPROTO=static  # static/dhcp
ONBOOT=yes
# 加入如下内容
IPADDR=192.168.1.160
NETMASK=255.255.255.0
# 下面的如果不需要可以不设置
GATEWAY=192.168.1.1
DNS1=119.29.29.29
DNS2=8.8.8.8
# 重启网络服务生效
systemctl restart network
```

## 允许root用户远程登陆

```bash
sudo vim /etc/ssh/sshd_config
#找到PermitRootLogin without-password 修改为PermitRootLogin yes

# 重启ssh服务
sudo systemctl restart sshd
# 或者
service sshd restart
```

## SSH免密登录

在做免密登录的时候要先确定哪个用户需要做免密登录，如果没有指定默认的是当前用户，远程服务器是root用户

* 比如`gitlab-runner`运行的默认帐号是`gitlab-runner`，我们就需要切换到这个用户下面做免密登录配置,全部配置完成之后需要手动登录一次

如果是在`sh`等脚本里面执行`ssh`免密登录，需要在添加参数`-tt`(例如：`ssh root@192.168.20.10 -tt`)

`server1`免密登录`server2`

1. `server1`生成rsa或者ed：`ssh-keygen -t rsa -C server1`
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
    StrictModes yes
    PubkeyAuthentication yes
    AuthorizedKeysFile .ssh/authorized_keys
    PasswordAuthentication yes # 设置是否使用口令验证。
    PermitEmptyPasswords no #不允许空密码登录
    # 修改完毕之后需要重启sshd服务`systemctl restart sshd`
    ```
如果调整之后还是不能免密码远程登录，需要注意下 `~/.ssh/authorized_keys` 文件的权限。确实是 `700`或者`600`, 调整完权限之后需要重启`sshd`服务。

## SSH、Telnet黑白名单

```bash
# 白名单 /etc/hosts.allow
sshd:192.168.92.135:allow
sshd:192.168.92.0/24:allow
# 或者
sshd:192.168.92.110
sshd:192.168.92.
# telnet示例
in.telnetd:192.168.220.1
in.telnetd:192.168.221.

# 黑名单 /etc/hosts.deny
sshd:192.168.92.135:deny
sshd:192.168.92.0/24:deny
# 或者
sshd:192.168.92.110
sshd:192.168.92.

# 设置之后重启生效
systemctl restart sshd
```

## 用户/用户组常用命令

```bash
# 查看正常登录用户
cat /etc/passwd | grep /bin/bash
# 查看用户组
cat /etc/group
# 增加用户
useradd abc
# 设置密码
passwd abc
# 删除用户
userdel abc
# 增加用户组
groupadd gabc
# 将用户加入用户组
usermod -G gbac abc
# 修改文件所属权限
chown abc:gabc file
### 用户赋予sudo权限
vim /etc/sudoers
# 添加如下内容
username    ALL=(ALL)   ALL
```
## 文件权限相关

777对应的用户：文件所有者、群组用户、其他用户  

权限|权限数字|含义
---|---|---
r|4|读取read
w|2|写入write
x|1|执行execute

```bash
chmod 777 filename
# 给用户添加执行权限
chmod u+x filename 
```

## 查看linux系统编码

```bash
# 查看所有系统编码
locale -a

# 查看当前系统编码
locale
```

## 获取当前日期时间

```sh
version=`date +%y%m%d%H%M%s`
```

## 查看系统信息

1. 查看发行版本：`cat /etc/os-release` , `cat /etc/issue`
1. 查看内核版本：`uname -a`，`uname -m`, `uname -s`，`uname -p`

```bash
uname -m 显示机器的处理器架构
uname -r 显示正在使用的内核版本
lspci -tv 罗列 PCI 设备
lsusb -tv 显示 USB 设备
```

## 查看linux cpu，磁盘、内存

```bash
# 使用`shift+m`会按照内存使用从大到小排序。
# us: 用户空间cpu使用占比
# sy: 内核空间cpu使用占比
# ni：用户进程空间内改变过优先级的进程占用cpu百分比
# id：空闲cpu百分比
# wa：等待输入输出的cpu时间百分比
# hi：cpu服务于硬件中断所消耗的时间总额
# si：cpu服务软中断所消耗的时间总额
top

# cpu
lscpu
# cpu空闲 - 百分比
vmstat | awk '{print $15}' | sed -n '$p'
# cpu型号
cat /proc/cpuinfo | grep name | sort | uniq | awk -F ':' '{print $2}'
# cpu路数
cat /proc/cpuinfo | grep "physical id" | sort | uniq | wc -l
# cpu线程数
cat /proc/cpuinfo | grep "physical id" | wc -l

# 查看物理磁盘情况
lsblk
# 查看所有磁盘
fdisk -l
# 磁盘使用情况（磁盘，容量，已用，可用，已用%，挂载点）
df -hl | awk '$1 ~ /\/dev\//'
# 查看所有挂载的磁盘使用情况
df -h
# 查看当前目录下各个文件及目录占用空间大小
du -sh *
# 查看/home 下的所有的一级目录文件大小
du -h --max-depth=1 /home

# 内存
free -h

### vmstat监控CPU使用率，内存使用，虚拟内存交换情况,IO读写情况
# 第一个参数是采样的时间间隔数，单位是秒，第二个参数是采样的次数
# 2表示每个两秒采集一次服务器状态，1表示只采集一次
vmstat 2 1
### 表示每2秒采集一次（在一段时间内一直监控，不想监控直接结束vmstat就行了）
# delay：刷新时间间隔。如果不指定，只显示一条结果。
# count：刷新次数。如果不指定刷新次数，但指定了刷新时间间隔，这时刷新次数为无穷。
# -t：显示时间戳
# -S：使用指定单位显示。参数有 k 、K 、m 、M ，分别代表 1000、1024、1000000、1048576 字节（byte）。默认单位为 K（1024 bytes）
# -a：显示活跃和非活跃内存
# -f：显示从系统启动至今的 fork 数量 
# -m：显示 slabinfo
# -n：只在开始时显示一次各字段名称
# -s：显示内存相关统计信息及多种系统活动数量
# -d：显示磁盘相关统计信息。
# -p：显示指定磁盘分区统计信息
# 
vmstat 2
procs -----------memory---------- ---swap-- -----io---- -system-- ----cpu----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa
 1  0      0 3499840 315836 3819660    0    0     0     1    2    0  0  0 100  0
 0  0      0 3499584 315836 3819660    0    0     0     0   88  158  0  0 100  0
 0  0      0 3499708 315836 3819660    0    0     0     2   86  162  0  0 100  0
 0  0      0 3499708 315836 3819660    0    0     0    10   81  151  0  0 100  0
 1  0      0 3499732 315836 3819660    0    0     0     2   83  154  0  0 100  0
### 进程信息字段：
# -r：等待运行的进程数，数量越大，系统越繁忙。
# -b：不可被唤醒的进程数量，数量越大，系统越繁忙
### CPU信息字段：
# -us：非内核进程消耗 CPU 运算时间的百分比。
# -sy：内核进程消耗 CPU 运算时间的百分比。
# -id：空闲 CPU 的百分比。
# -wa：等待 I/O 所消耗的 CPU 百分比。
# -st：被虚拟机所盗用的 CPU 百分比。
# cpu us: 持续大于50%，服务高峰期可以接受， 如果长期大于50 ，可以考虑优化
# cpu sy: 现实内核进程所占的百分比，这里us + sy的参考值为80%，如果us+sy 大于 80%说明可能存在CPU不足。
# cpu wa: 列显示了IO等待所占用的CPU时间的百分比。这里wa的参考值为30%，如果wa超过30%，说明IO等待严重，这可能是磁盘大量随机访问造成的， 也可能磁盘或者磁盘访问控制器的带宽瓶颈造成的(主要是块操作)。
# cpu id:  CPU 空闲时所占百分比  平常持续小于50，服务高峰期可以接受。
###系统信息字段：
# -in：每秒被中断的进程次数。
# -cs：每秒进行的事件切换次数。
# 这两个数越大，代表系统与接口设备的通信越繁忙。
### 磁盘读/写信息字段：
# -bi：从块设备中读入的数据的总量，单位是块。
# -bo：写到块设备的数据的总量，单位是块。
# bi/bo: 磁盘写的数据量稍大，如果是大文件的写，10M以内基本不用担心，如果是小文件写2M以内基本正常
# 这两个数越大，代表系统的 I/O 越繁忙。
###交换分区信息字段：
# -si：从磁盘中交换到内存中数据的数量，单位为 KB。
# -so：从内存中交换到磁盘中数据的数量，单位为 KB。
# 这两个数越大，表明数据需要经常在磁盘和内存之间进行交换，系统性能越差
# swpd 虚拟内存已使用的大小，如果大于0，表示物理内存不足，
# 但如果swpd的值不为0，但是SI，SO的值长期为0，这种情况不会影响系统性能
```
## 挂载磁盘
```bash
# -a,--all:挂载/etc/fstab里面所有的文件系统；
# -r,--read-only:以只读的权限挂载文件系统；
# -w,--re,--read-write:以读写权限挂载文件系统；
# -L,--label LABEL:根据指定的卷标挂载文件系统；
# -U,--uuid UUID:根据指定的uuid挂载文件系统；
# -o OPTIONS:指定挂载文件系统的方式；
#    ro:以只读方式挂载；
#    rw:以读写方式挂载，默认挂载选项；
#    async:异步IO，数据写操作优先于内存完成，然后再根据某种策略同步至硬盘中，默认挂载选项；
#    sync:同步IO；
#    atime/noatime:设置文件和目录被访问时是否更新最近一次的访问时间戳；
#    auto/noauto:设置设备是否支持mount的-a选项自动挂载，默认挂载为auto；
#    diratime/nodiratime:目录被访问时是否更新最近一次的访问时间戳；
#    dev/nodev:设置是否支持在此设备上使用设备，默认挂载为dev；
#    exec/noexec:设置是否允许执行此设备上得二进制程序文件，默认挂载为exec；
#    suid/nosuid:设置是否支持在此设备的文件上使用suid，默认挂载为suid；
#    user/nouser:设置是否允许普通挂载此文件设备，默认挂载为nouser；
#    remount:重新挂载选项；
#    acl:设置在此设备上是否支持使用facl，默认不支持；

# 查看所有磁盘
fdisk -l
# 对新增磁盘进行分区
fdisk /dev/vdb
# 按提示操作 p查看分区表  n新增 d 删除 w操作生效 q退出
n
# 选择默认 p 选择主分区  e 扩展分区 直接默认回车就是选择 p
p
# 输入分区号，默认从1开始，默认回车
回车
# sector 起始扇区 (2048-4294967295, 默认 2048)：默认回车
回车
# + 多少扇区 或多大空间，不会计算的话 可以 写 +1G 或者 选择默认回车
回车
# 最后保存w
w
# 分区格式化（ext4、xfs）
mkfs.ext4 /dev/vdb1
# 挂载分区到目录下
mkdir -p /mnt/home
mount /dev/vdb1 /mnt/home
# 查看
df -h

##### 转移之前的挂载目录
#把home下的东西拷到挂载的目录下，备份
cp -a /home/* /mnt/home/
# 删除home下所有东西
rm -rf /home/*
# 卸载分区
umount /dev/vdb1
# 设置开机挂载
vi /etc/fstab
# 末尾增加一行
/dev/vdb1  /home  ext4  defaults  1  2
# 查看 /home是否被挂载
df -h
# 挂载/etc/fstab 中未挂载的分区
mount -a
# 查看确实转移成功
df -h


#### 卸载
# -a:卸载文件/etc/mtab中记录的所有的文件系统；
# -v:显示命令执行的过程；
# -h:显示帮助；
# -n:卸载时不要将信息存入/etc/mtab文件中；
umount -v /dev/cdrom
```
## 查看系统进程及占用资源情况

```bash
# 查看进程
ps -ef | grep nginx
# 关闭进程
sudo kill -9 <PID>

# 查看进程占用cpu，内存资源
ps -aux | grep nginx

USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND

# 或者使用top命令查看
top -p 进程id

# 批量关闭进程,xargs命令把前面命令的输出结果（PID）作为"kill -9"命令的参数
ps -ef|grep GSM_run.py|grep -v grep|awk '{print $2}'|xargs kill -9
# 更简单的方式
pkill -9 GSM_run.py
# kill pc 用户的所有的用户的进程
pkill -u pc
# kill 除了 root 用户外的所有的用户的进程
pkill -vu root
```
## 服务器内存释放

```bash
# 建议先执行清理文件系统缓存
sync
# 释放页缓存
echo 1 > /proc/sys/vm/drop_caches
# 释放dentries和inodes
echo 2 > /proc/sys/vm/drop_caches
# 释放所有缓存
echo 3 > /proc/sys/vm/drop_caches
```
## 查看进程执行目录

```bash
ll /proc/<pid>

cwd 符号链接的是进程运行目录；

exe 符号连接就是执行程序的绝对路径；

cmdline 就是程序运行时输入的命令行命令；

environ 记录了进程运行时的环境变量；

fd 目录下是进程打开或使用的文件的符号连接 
```

## 端口使用情况

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

## 文件压缩解压

### Pigz

```bash
# 安装
apt install pigz
yum -y install pigz
## 语法
# -0 ~ -9 压缩等级，数字越大压缩率越高，速度越慢，默认为6
# -k --keep 压缩后不删除原始文件
# -l --list 列出压缩输入的内容
# -K --zip Compress to PKWare zip (.zip) single entry format
# -d --decompress 解压缩输入
# -p --processes n 使用n核处理，默认为使用所有CPU核心
pigz [ -cdfhikKlLmMnNqrRtz0..9,11 ] [ -b blocksize ] [ -p threads ] [ -S suffix ] [ name ...  ]
unpigz [ -cfhikKlLmMnNqrRtz ] [ -b blocksize ] [ -p threads ] [ -S suffix ] [ name ...  ]
## 压缩单文件
# 加上-k选项保留原始文件，会在当前工作目录获得压缩后的your_file_name.gz 文件
pigz -k your_file_name
## 压缩文件夹
tar -cvf - dir1 dir2 dir3 | pigz > output.tgz
# 或者
tar --use-compress-program=pigz -cvpf package.tgz ./package

# 解压（需要保留.gz文件，记得加上-k选项）
unpigz -d your_file_name.gz
# 或者
tar -xvf --use-compress-program=pigz package.tgz -C .
# 查看压缩文件后的压缩率
pigz -l your_file_name.gz
```

### TAR

查看tar压缩包中的内容：`tar -tf xxx.tar` 或者 `tar -tvf xxx.tar.gz`

* tar在Linux上是常用的打包、压缩、加压缩工具，他的参数很多，折里仅仅列举常用的压缩与解压缩参数

1. 参数：
`-c` ：create 建立压缩档案的参数；  
`-x` ： 解压缩压缩档案的参数；
`-t` ： 查看压缩文件列表；  
`-z` ： 是否需要用gzip压缩；  
`-v` ： 压缩的过程中显示档案；  
`-f` ： 置顶文档名，在f后面立即接文件名，不能再加参数  

```bash
#### 压缩
tar -cvf /home/www/images.tar /home/www/images ← 仅打包，不压缩
tar -zcvf /home/www/images.tar.gz /home/www/images ← 打包后，以gzip压缩
# 排除某些文件夹
tar -zcvf /home/www/images.tar.gz --exclude=/home/www/images/aaa --exclude=/home/www/images/bbb /home/www/images

#### 解压
#将/source/kernel.tgz解压到 /source/linux-2.6.29 目录  
`tar zxvf /source/kernel.tgz -C /source/linux-2.6.29`

#### 查看压缩包文件列表
tar -ztvf xxxxx.tgz
```

* 在参数f后面的压缩文件名是自己取的，习惯上用tar来做，如果加z参数，则以tar.gz 或tgz来代表gzip压缩过的tar file文件

### ZIP

* 解压：`unzip -d ~/test ~/Downloads/test.zip`

### XZ

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

## 查看安装的软件包

使用dpkg命令  
`sudo dpkg --list | grep -i jdk`

使用ps命令
`ps -aux  | grep pkgname

---

## 开机启动服务

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

## 复制文件

```bash
# 一般cp和mv命令被系统设置了别名，自带了-i参数，强制需要交互确认
alias

# 复制文件夹
cp -r myproject newproject
# 强制覆盖文件夹里面的文件(会覆盖my下面的data)
/bin/cp -rf test/data my

# 移动
mv -f newproject /home

# 重命名
mv oldname newname
```

## iso u盘镜像制作

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

## 查看命令安装位置

下面以`java`命令为例子查询jdk安装路径

```bash
# 1. 查看命令位置
which java
# 输出内容   /usr/bin/java

# 2. 查看执行文件详细信息
ls -l /usr/bin/java
# output: lrwxrwxrwx 1 root root 22 Dec  6 10:42 /usr/bin/java -> /etc/alternatives/java

# 3. 继续查看执行文件位置
ls -l /etc/alternatives/java
# output: lrwxrwxrwx 1 root root 43 Dec  6 10:42 /etc/alternatives/java -> /usr/lib/jvm/java-11-openjdk-amd64/bin/java

# 到这里就已经是java命令的最终目录了
```

## linux复制文件

```bash
# 从本地拷贝到远程
scp -P 2022 localdir/localfile guoyujun@aa.bb.cc:remotedir
# 拷贝文件夹
scp -r -P 2022 localfile/localdir guoyujun@aa.bb.cc:remotedir

# 从远程拷贝到本地
scp -P 2022 guoyujun@aa.bb.cc:remotedir/file localdir
```

## 将用户加入某个用户组

```bash
# 加入
sudo usermod -aG docker gitlab-runner

# 验证
sudo -u gitlab-runner -H docker info
```

## 命令行跳转快捷键

* 行首：ctrl + a
* 行尾：ctrl + e

## 后台执行命令

```bash
# 输出到当前目录的 nohup.out
nohup 命令 &

# 输出到指定文件
nohup yourcmd > ./myfile.log 2>&1 &
```

## 执行远程服务器脚本

```sh
ssh -tt root@192.168.20.71 << closessh
chmod u+x /home/erpaggregateservice/Build.sh
source /home/erpaggregateservice/Build.sh
exit
closessh
```

## /dev/null

`/dev/null`: 表示的是一个黑洞，通常用于丢弃不需要的数据输出，或者用于输入流的空文件。

将无用的输出流写入到黑洞丢弃：`00 01 * * * /bin/sh/server/scripts/mysqlbak.sh >/dev/null 2>&1`

* `>`: 代表重定向到哪里
* `/dev/null` 代表空设备文件
* `2>` 表示`stderr`标准错误
* `&` 表示 `等同于` 的意思，`2>&1`，表示`2`的输出重定向 `等同于 1`
* `1` 表示`stdout`标准输出，系统默认值是`1`，所以`>/dev/null`等同于 `1>/dev/null`

所以 `>/dev/null 2>&1` == `1> /dev/null 2> &1`

`1>/dev/null` ：首先表示标准输出重定向到空设备文件，也就是不输出任何信息到终端，说白了就是不显示任何信息。
`2>&1` ：接着，标准错误输出重定向 到标准输出，因为之前标准输出已经重定向到了空设备文件，所以标准错误输出也重定向到空设备文件（较多的时候我们会用`command > file 2>&1` 这样的写法）

清空文件： `cat /dev/null > /home/omc/h.txt`

## 查看服务使用端口号

可以查看 `/etc/services` 文件来找到端口号和服务名称之间的联系

## 查看进程下的线程

```bash
# “-T”选项可以开启线程查看
ps -T -p <pid>

# "-H"选项开启线程查看
top -H -p <pid>
```

## 查看网卡带宽使用情况

```bash
# 查看网卡信息
ifconfig
ip addr

#### Ubuntu
# 安装nload
apt install nload
# 查看某块网卡带宽使用情况
nload em1

#### Centos
# 安装iftop
yum install epel-release
yum install iftop
# 查看某块网卡带宽使用情况，通过 q 退出
iftop -i eth1
#"TX"：从网卡发出的流量
#"RX"：网卡接收流量
#"TOTAL"：网卡发送接收总流量
#"cum"：iftop开始运行到当前时间点的总流量
#"peak"：网卡流量峰值
#"rates"：分别表示最近2s、10s、40s 的平均流量
```

## 查找文件

```bash
# 查找文件
find / -name myfile

# 查找当前目录及子目录下的md格式文件
find ./ -name " *.md"

# 查找软链接
find /app -type l
```

## 统计文件中的字节数、字数、行数

```bash
wc [选项] 文件
#-c 统计字节数。
#-l 统计行数。
#-m 统计字符数。这个标志不能与 -c 标志一起使用。
#-w 统计字数。一个字被定义为由空白、跳格或换行字符分隔的字符串。
#-L 打印最长行的长度。
#-help 显示帮助信息

# 统计当前文件夹下的所有log文件的字符数和行数
wc -m *.log
wc -l *.log
```

## cut字符截取

`cut`:

* `-b` ：以字节为单位进行分割。这些字节位置将忽略多字节字符边界，除非也指定了`-n`标志。
* `-c` ：以字符为单位进行分割。
* `-d`：自定义分隔符，默认为制表符(tab)。
* `-f`：与`-d`一起使用，指定显示哪个区域。
* `-n`：取消分割多字节字符。仅和`-b`标志一起使用。如果字符的最后一个字节落在由`-b`标志的List参数指示的范围之内，该字符将被写出；否则，该字符将被排除。

```bash
# 剪切字符串中的第2和第5个字节:2b
echo "123abc" | cut -b 2,5
# 11-14位置的字符: bcde
 echo "123456789abcdefghjklmnopq" | cut -b 11-14
# 输出/etc/passwd文件每一行的前4个字符
cut -c 1-4 /etc/passwd
# 以 % 分割 ： CPU:  busy 14
echo "CPU:  busy 14%  (system=10% user=3% nice=0% idle=85%)" | cut -d \% -f 1
# (system=10
echo "CPU:  busy 14%  (system=10% user=3% nice=0% idle=85%)" | cut -d \% -f 2
```

## head取前N行

```bash
# 取 /etc/password 文件 第一行
cat /etc/password | head -1
```

## tail取后N行

```bash
# 取 /etc/password 文件最后两行
cat /etc/password | tail -2
```

## 创建软链接

```bash
ln -s [源文件] [软链接文件]

# 删除软链接（正确）
rm -rf ./xxx

# 删除（错误），会把xxx文件夹下的内容删除
rm -rf ./xxx/
```

## 查看进程对应的容器

```bash
docker inspect $(docker ps -q) --format '{{.State.Pid}}, {{.Name}}' | grep 56249
```

## 查看已安装包

```bash
# ubuntu,debian
apt list --installed
# 或者
dpkg-query -l
# 如果是snap
snap list
# Flatpak
flatpak list
```

## yum命令只下载rpm包不安装

```bash
# 未安装相应的软件
yum install --downloadonly --downloaddir=/tmp/ podman

# 已安装相应的软件
yum reinstall --downloadonly --downloaddir=/tmp/ podman

# 拷贝到离线机用rpm进行安装, 用--nodeps是保证可以不按顺序进行安装
sudo rpm -ivh ./* --nodeps
```

## apt只下载不安装deb包

```bash
# 未安装相应的软件
apt-get install -d  PackageName

# 已安装相应的软件
apt-get install -d --reinstall  PackageName

# 默认保存目录
/var/cache/apt/archives/
```

## 开机时间/重启历史记录

```bash
who -b
# 显示信息（开机时间）
system boot  2020-06-12 17:44

last reboot
# 显示信息（历史记录）
reboot   system boot  3.10.0-957.12.2. Fri Jun 12 17:44 - 10:21 (20+16:37)  
reboot   system boot  3.10.0-957.12.2. Fri Jun 12 09:28 - 10:21 (21+00:53)  
reboot   system boot  3.10.0-957.12.2. Mon Jun  8 15:27 - 16:02  (00:35)    
reboot   system boot  3.10.0-957.12.2. Wed May 27 11:41 - 20:49  (09:08)    
reboot   system boot  3.10.0-957.12.2. Tue May 19 09:52 - 20:49 (8+10:57)
```

## History命令

历史命令保存在 `~/.bash_history` 文件中

```bash
# 查看历史记录(不包含缓存中的历史命令)
history
# 将缓存中的历史命令保存到.bash_history
history -w
# 清理历史命令需要删除.bash_history中的历史
rm -rf ~/.bash_history
# 清空历史命令
history -c
# 设置历史命令保存条数10000
vim /etc/profile
HISTSIZE 10000
```

## 无vim写文件

* 输入如下内容到文件`test.conf`

```conf
server {
    listen 80;
    server_name hello;
}
```
* 可以通过如下方式维护

```bash
# 创建文件
touch test.conf

# echo方式
echo "server {\n    listen 80;\n    server_name hello;\n}" > test.conf

# cat方式
cat <<EOF >> test.conf
server {
  listen 80;
  server_name _;
}
EOF
```

## 修改服务器时区

```bash
tzselect

# 选择亚洲 Asia，确认之后选择中国（China)，最后选择北京(Beijing)

cp /usr/share/zoneinfo/Asia/Shanghai  /etc/localtime
```

## 禁止/启动内核更新

```bash
#### Ubuntu
# 查看是否禁用
dpkg --get-selections |grep linux-image
dpkg --get-selections | grep hold
# 或者
apt-mark showhold

# 查看内核版本
uname -r
> 5.4.0-105-generic
# 查看内核列表
dpkg --list | grep linux-image
dpkg --list | grep linux-headers
dpkg --list | grep linux-modules
# 禁止内核自动更新
apt-mark hold linux-image-5.4.0-105-generic
apt-mark hold linux-headers-5.4.0-105-generic
apt-mark hold linux-modules-extra-5.4.0-105-generic
apt-mark hold linux-image-generic linux-headers-generic linux-image-extra

# 解除锁定更新
sudo apt-mark unhold linux-generic
sudo apt-mark unhold linux-image-generic
sudo apt-mark unhold linux-headers-generic
# 更新升级
apt install linux-generic
# 或者使用hwe
apt install linux-generic-hwe-20.04

#### Centos
```

## 服务器禁ping

```bash
vim /etc/sysctl.conf
# 增加如下内容
net.ipv4.icmp_echo_ignore_all = 1

# 生效
sysctl -p
```

## 查看linux日志方法

```bash
# 查找ERROR日志，以及它的后10行
$ grep -A 10 ERROR app.log

# 查找ERROR日志，以及它的前10行
$ grep -B 10 ERROR app.log

# -C代表前10行和后10行
$ grep -C 10 ERROR app.log
```

## grep带空格等字符

通过`\`反斜杠转译

```bash
sh -c 'curl -sS http://localhost:18350/check | grep serviceStatus\":\ 0,\ \"serviceItems || exit 1'
```

## iso挂载卸载

```bash
# 挂载
mount -o loop /home/test/xxxxxx.iso /mnt/test/

# 卸载
umount /mnt/test
```

## zsh安装

```bash
sudo apt install zsh
sudo apt install  git
chsh -s /bin/zsh

# 安装oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# 第一次安装完之后需要选择，可以直接选择2
```

## 大文件拆分/合并

```bash
# 以 my-split 开头拆分
split mytest.rpm my-split
# -l：按照每2行拆分，默认是1000行
split -l 2 my.txt
# -b：按照指定大小拆分(k,m,g)
split -b 100m mytest.rpm
# -n：按照文件数拆分（拆成3个文件）
split -n 3 mytest.rpm
# -d：使用数字标记文件（x00，x01，x02）
split -l 2 -d my.txt
# -a：设置后缀长度(x0,x1,x2)
split -l 2 -d -a 1 my.txt
# 简单示例，拆分成4个文件，开头指定为my-split，后缀使用1位数字
split -n 4 -d -a 1 mytest.rpm my-split

### 合并文件
cat my-split* > mytest.rpm
```

## 查看文件md5

```bash
# 可以一次性查看多个
md5sum file1 file2
```

## 查看so文件位数

```bash
od -h -N 10 xxx.so
# 32位第四段是0101
00000000 457f 464c 0101 0001 0000
# 64位第四段是0102
00000000 457f 464c 0102 0001 0000
```

## 查看pagesize

```bash
# 查看系统pagesize
getconf PAGESIZE
# 修改so文件pagesize（参考paddle文档）
patchelf --page-size 65536 core_noavx.so
```

## 批量修改文件内容

```bash
# 批量查找某个目录下文件包含指定内容
grep -rn "查找的内容" ./

# 批量替换某个目下所有包含的文件的内容
sed -i "s/查找的内容/替换后的内容/g" `grep -rl "查找的内容" ./`
```