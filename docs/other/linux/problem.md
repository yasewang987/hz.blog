# Linux问题处理汇总

## 内存溢出自动kill进程

`Linux`内核有个机制叫`OOM killer(Out Of Memory killer)`，该机制会监控那些占用内存过大，尤其是瞬间占用内存很快的进程，然后防止内存耗尽而自动把该进程杀掉。内核检测到系统内存不足、挑选并杀掉某个进程的过程可以参考内核源代码`linux/mm/oom_kill.c`，当系统内存不足的时候，`out_of_memory()`被触发，然后调用`select_bad_process()`选择一个`bad`进程杀掉。如何判断和选择一个`bad`进程呢？linux选择`bad`进程是通过调用`oom_badness()`，挑选的算法和想法都很简单很朴实：最bad的那个进程就是那个最占用内存的进程。

查看系统日志方法：

```bash
grep -i -r 'killed process' /var/log
```

## 服务器重启(宕机)问题定位

```bash
dmesg | grep -i error
# 输出
ERST: Error Record Serialization Table (ERST) support is initialized.
ACPI Error: No handler for Region [IPMI] (ffff88081cd55420) [IPMI] (20090903/evregion-319)
ACPI Error: Region IPMI(7) has no handler (20090903/exfldio-295)
ACPI Error (psparse-0537): Method parse/execution failed [\_SB_.PMI0._GHL] (Node ffff88101c853a38), AE_NOT_EXIST
ACPI Error (psparse-0537): Method parse/execution failed [\_SB_.PMI0._PMC] (Node ffff88101c853a88), AE_NOT_EXIST

# 问题处理：升级内核
yum install kernel
# 升级完之后重启
reboot
```

查看 `/var/log/messages` 里面记录了系统启动后的信息和错误日志

```bash
# 安全相关日志
/var/log/secure
# 定时任务日志
/var/log/cron
# 守护进程相关日志
/var/log/boot.log
# 永久记录每个用户登录、注销和系统启动、停机事件
/var/log/wtmp
# 记录当前正在登录系统的用户
/var/log/utmp
# 记录登录失败的信息
/var/log/btmp
```

## 服务器启动一段时间后自动关机（休眠）

大概率应该安装了`gnome`等桌面相关的应用导致的休眠问题

```bash
# 查看是否休眠
systemctl status sleep.target
# 如果显示状态是下面状态，则需要关闭
Loaded: loaded

# 关闭自动休眠
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
# 查看自动休眠是否关闭
systemctl status sleep.target
# 关闭之后的状态是
Loaded: masked

# 重新启动休眠
systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

## centos7无故重启-内核升级

ELRepo仓库：http://elrepo.org/tiki/tiki-index.php ，可以打开网页查看对应内核的升级操作

```bash
# 查看内核版本
uname -sr

# 导入公钥，如果失败, 执行下面一步yum
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
yum update nss

# 升级安装 ELRepo
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm

# 查看列表
yum --disablerepo="*" --enablerepo="elrepo-kernel" list available

# 安装最新的主线稳定内核
yum --enablerepo=elrepo-kernel install kernel-ml

# 编辑/etc/default/grub 并设置 GRUB_DEFAULT=0    意思是 GRUB 初始化页面的第一个内核将作为默认内核

# 查看系统当前可使用的内核
cat /boot/grub2/grub.cfg |grep menuentry

# 修改开机时默认使用的内核，(此处应看清自己的内核版本，不要一味的复制)
grub2-set-default 'CentOS Linux (4.18.3-1.el7.elrepo.x86_64) 7 (Core)'

# 重启系统
reboot

# 查看当前使用的内核
uname -sr
```

其他解决方案：

`vi /boot/grub/grub.conf`在`kernel`一行最后加上添加 `intremap=off` 或者 `intremap=no_x2apic_optout`

然后重启服务器即可。

参数解释：
`intremap={on,off,nosid,no_x2apic_optout}`

* `on`：(默认值)开启中断重映射,BIOS中默认开启
* `off`：关闭中断重映射
* `nosid`：重映射时不对SID(Source ID)做检查
* `no_x2apic_optout`：无视BIOS的设置，强制禁用x2APIC特性，主要用于解决某些对x2APIC支持有缺陷的BIOS导致的故障

## Failed to connect to raw.githubusercontent.com port 443 解决方案

查询真实IP

在`https://ip.cn/`查询`raw.githubusercontent.com`的真实IP。

通过修改hosts解决此问题

```bash
199.232.68.133 raw.githubusercontent.com
```

## 忘记root账号密码处理

不用重启直接修改（非grub方法）

```bash
cd /etc
# 第一行就是`root`的，后面的`:x:`中的`x`就是密码的占位符，我们只把`x`删掉，别删冒号，然后保存
vim passwd
# 切换用户
su
# 命令行保持在窗口不要动，重新编辑`passwd`文件,将之前删除的`x`添加到原来位置，保存退出
vim passwd
# 修改密码
passwd
# 这时候应该就提示输入root的新密码了
```

## rpm 和 yum 执行卡住，解决方法

执行安装：`rpm -ivh xxx.rpm`  一直卡住不动。
然后 使用  `rpm -ivh  -vv  xxx.rpm` 看到一直卡在：

```bash
D: loading keyring from pubkeys in /var/lib/rpm/pubkeys/*.key
D: couldnt find any keys in /var/lib/rpm/pubkeys/*.key
D: loading keyring from rpmdb
# ..  卡在这里不在动了。
```

* 解决办法一：

```bash
# 查看锁文件的位置
find / -name '.dbenv.lock'
# 删除文件
rm -f /var/lib/rpm/.dbenv.lock
```

* 解决方法二

```bash
# 删除rpm数据文件
rm -f /var/lib/rpm/__db.00*
# 重新创建rpm数据文件
rpm --rebuilddb
```

## 服务器磁盘只读无法写入

```bash
# 确认是否是只读问题
mount | grep '/ .*ro'
# 输出如下，说明只读
/dev/sda1 on / type ext4 (ro,relatime,...)

# 修改可读写，如果不成功，参考下面（大概率不成功）
sudo mount -o remount,rw /
# 不成功会输出如下信息
mount point not mounted or bad option

# 可以使用 dmesg 命令来查看内核消息缓冲区的内容。如果在启动过程中文件系统有自动进行过检查和修复，相关的消息通常会出现在这里。
dmesg | grep fsck
# 报错如下（说明出现了26次错误）：
error count since last fsck: 26
# 查看分区（确认待修复的分区）
fdisk -l
# 手动修复，将 /dev/sda1 替换为你的实际修复分区设备名
sudo fsck /dev/sda1

# 修复完重启系统
reboot
```