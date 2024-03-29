# Linux基础介绍

## Linux目录结构

![img](http://cdn.go99.top/docs/other/linux/info1.png)

目录名|目录作用
---|---
`/bin/`|存放系统命令的目录，普通用户和超级用户都可以执行。是`/usr/bin/`目录的软链接。
`/usr/bin/`|存放系统命令的目录，普通用户和超级用户都可以执行。
`/sbin/`|存放系统命令的目录，只有超级用户才可以执行。是`/usr/sbin/`目录的软链接。
`/usr/sbin/`|存放系统命令的目录，只有超级用户才可以执行。
`/boot/`|系统启动目录，保存与系统启动相关的文件，如内核文件和启动引导程序（`grub`）文件等。
`/dev/`|硬件设备文件保存位置。
`/etc/`|配置文件保存位置。系统内所有采用默认安装方式（`rpm`安装）的服务配置文件全部保存在此目录中，如用户信息、服务的启动脚本、常用服务的配置文件等。
`/home/`|普通用户的家目录。在创建用户时，每个用户要有一个默认登录和保存自己数据的位置，就是用户的家目录，所有普通用户的宿主目录是在`/home/`下建立一个和用户名相同的目录。如用户`user1`的家目录就是`/home/user1/`，`~`就是代表当前位置在用户的家目录下。
`/lib/`|系统调用的函数库保存位置。是`/usr/lib/`的软链接。
`/usr/lib/`|也是一个应用程序调用的函数库保存位置。
`/lib64/`|64位函数库保存位置。是`/usr/lib64/`的软链接。
`/lost+found/`|当系统意外崩溃或机器意外关机，而产生一些文件碎片放在这里。当系统启动的过程中`fsck`工具(自动执行)会检查这里，并修复已经损坏的文件系统。这个目录只在每个分区中出现，例如`/lost+found`就是根分区的备份恢复目录，`/boot/lost+found`就是`/boot`分区的备份恢复目录。
`/media/`|挂载目录。系统建议是用来挂载媒体设备的，如软盘和光盘。
`/misc/`|挂载目录。系统建议用来挂载NFS服务的共享目录。
`/mnt/`|挂载目录。早期Linux中只有这一个挂载目录，并没有细分。现在系统建议这个目录用来挂载额外的设备，如U盘、移动硬盘和其他操作系统的分区
`/opt/`|第三方安装的软件保存位置。这个目录是放置和安装其他软件的位置，手工安装的源码包软件都可以安装到这个目录中。不过还是习惯把软件放到`/usr/local/`目录中，也就是说，`/usr/local/`目录也可以用来安装软件。
`/proc/`|虚拟文件系统。该目录中的数据并不保存在硬盘上，而是保存到内存中。主要保存系统的内核、进程、外部设备状态和网络状态等。如`/proc/cpuinfo`是保存CPU信息的，`/proc/devices`是保存设备驱动的列表的，`/proc/filesystems`是保存文件系统列表的，`/proc/net`是保存网络协议信息的。（不要动就好）
`/sys/`|虚拟文件系统。和`/proc/`目录相似，该目录中的数据都保存在内存中，主要保存与内核相关的信息
`/root/`|`root`的宿主目录。普通用户宿主目录在`/home/`下，`root`宿主目录直接在`/`下。
`/selinux/`|Linux系统的增强安全组件的保存位置。
`/srv/`|服务数据目录。一些系统服务启动之后，可以在这个目录中保存所需要的数据。（不许动）
`/tmp/`|临时目录。系统存放临时文件的目录，在该目录下，所有用户都可以访问和写入。我们建议此目录中不能保存重要数据，最好每次开机都把该目录清空。
`/usr/`|系统软件资源目录。注意`usr`不是`user`的缩写，而是`UNIX Software Resource`的缩写，所以不是存放用户数据的目录，而是存放系统软件资源的目录。系统中安装的软件大多数保存在这里
`/usr/local/`|手工安装的软件保存位置。我们一般建议源码包软件安装在这个位置，不建议放在`/opt`目录下。（软件的安装位置）
`/usr/share/`|应用程序的资源文件保存位置，如帮助文档、说明文档和字体目录
`/usr/src/`|源码包保存位置。我们手工下载的源码包和内核源码包都可以保存到这里。不过一般习惯把手工下载的源码包保存到`/usr/local/src/`目录中，把内核源码保存到`/usr/src/kernels/`目录中。（`/usr/src/`是软件安装包的位置）
`/usr/src/kernels/`|内核源码保存位置。
`/var/`|动态数据保存位置。主要保存缓存、日志以及软件运行所产生的文件.
`/var/log/`|系统日志保存位置（默认安装的软件的日志在这里，手动的不在这里）.
`/var/lib/`|程序运行中需要调用或改变的数据保存位置。如`MySQL`的数据库保存在`/var/lib/mysql/`目录中。（默认安装的`MySQL`数据库的保存位置在`/var/lib/mysql/`，这里重点记住）。
`/var/run/`|一些服务和程序运行后，它们的PID（进程ID）保存位置。是/run/目录的软链接
`/var/spool/`|放置队列数据的目录。就是排队等待其他程序使用的数据，比如邮件队列和打印队列。
`/var/spool/mail/`|新收到的邮件队列保存位置。系统新收到的邮件会保存在此目录中。
`/var/spool/cron/`|系统的定时任务队列保存位置。系统的计划任务会保存在这里。