# Centos

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

## 修改IP

```bash
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