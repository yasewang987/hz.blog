# QEMU虚拟机

qemu官方文档：https://qemu-project.gitlab.io/qemu/system/index.html  ，可以到上面查看对应的资料，比如查看龙芯的虚拟cpu配置，直接在搜索框中输入cpu对应的架构mips64即可找到对应的资料。

参数说明：

|参数|说明|
|---|----|
|qemu-system-aarch64.exe|二进制文件，提供模拟aarch64架构的虚拟机进程|
|-m 2048|分配2048MB内存|
|-M virt|模拟成什么服务器，我们一般选择virt就可以了，他会自动选择最高版本的virt|
|-cpu cortex-a72|模拟成什么CPU，其中cortex-a53\a57\a72都是ARMv8指令集的|
|-smp 2,cores=2,threads=1,sockets=1|2个vCPU，这2个vCPU由qemu模拟出的一个插槽（socket）中的2个核心，每个核心支持一个超线程构成|
|-bios xxx|指定bios bin所在的路径|
|-device xxx|添加一个设备，参数可重复|
|-drive|添加一个驱动器，参数可重复|
|-net|添加网络设备|

## Windows

### 安装步骤

1. 安装工具
    * QEMU：https://qemu.weilnetz.de/w64/  ,直接安装即可。
    * EFI：https://releases.linaro.org/components/kernel/uefi-linaro/latest/release/qemu64/QEMU_EFI.fd ，下载之后拷贝到 `qemu` 安装目录的 `bios` 文件夹。
    * OpenVPN：https://swupdate.openvpn.org/community/releases/openvpn-install-2.4.5-I601.exe?spm=a2c4g.11186623.0.0.16267004Kpu3ZS&file=openvpn-install-2.4.5-I601.exe  ，安装时需要注意勾选安装tap驱动。
    * 需要提前准备好镜像。

1. 配置qemu虚拟机（需要注意一下镜像的cpu架构，在配置虚拟机的时候选择对应的启动命令）

    * 创建镜像：

        ```powershell
        # cd 到 qemu 的安装目录（也可以使用绝对路径）
        .\qemu-img.exe create D:\qemu\vms\kylin\hdd01.img 40G
        ```

    * 安装镜像（系统）：

        ```bash
        .\qemu-system-aarch64.exe -m 10240 -cpu cortex-a72 -smp 8,cores=8,threads=1,sockets=1 -M virt -bios .\bios\QEMU_EFI.fd -net nic,model=pcnet -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -drive if=none,file=D:\qemu\isos\Kylin-arm64.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -drive if=none,file=D:\qemu\vms\kylin\hdd01.img,id=hd0 -device virtio-blk-device,drive=hd0
        ```

    * 启动镜像（系统）,需要注意一下这里启动的时候使用的网络配置，需要先将下一步`openvpn`的`tap`网络桥接做好：

        ```bash
        .\qemu-system-aarch64.exe -m 10240 -cpu cortex-a72 -smp 8,cores=8,threads=1,sockets=1 -M virt -bios .\bios\QEMU_EFI.fd -net nic -net tap,ifname=tap0 -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -device virtio-scsi-device -drive if=none,file=D:\qemu\vms\kylin\hdd01.img,id=hd0 -device virtio-blk-device,drive=hd0
        ```

1. 接入网络

    * 在Windows主机上安装TAP网卡驱动：可下载openvpn客户端软件，只安装其中的TAP驱动；在网络连接中，会看到一个新的虚拟网卡，属性类似于TAP-Windows Adapter V9，将其名称修改为`tap0`。
    * 将虚拟网卡和Windows上真实网卡桥接：选中这两块网卡，右键，桥接。此时，Windows主机将短暂断网，一会儿就会恢复，如果没有恢复则手动配置一下网桥的ip地址。
    * QEMU参数配置：在虚拟机启动命令行添加以下参数`--net nic -net tap,ifname=tap0` tap0为的虚拟网卡名。

### 银河麒麟

```bash
# 安装镜像
.\qemu-system-aarch64.exe -m 10240 -cpu cortex-a72 -smp 8,cores=8,threads=1,sockets=1 -M virt -bios .\bios\QEMU_EFI.fd -net nic,model=pcnet -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -drive if=none,file=D:\qemu\isos\Kylin-arm64.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -drive if=none,file=D:\qemu\vms\kylin\hdd01.img,id=hd0 -device virtio-blk-device,drive=hd0

# 启动系统
.\qemu-system-aarch64.exe -m 10240 -cpu cortex-a72 -smp 8,cores=8,threads=1,sockets=1 -M virt -bios .\bios\QEMU_EFI.fd -net nic -net tap,ifname=tap0 -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -device virtio-scsi-device -drive if=none,file=D:\qemu\vms\kylin\hdd01.img,id=hd0 -device virtio-blk-device,drive=hd0
```

`yum`源设置：

```text
[root@172-17-190-26 ~]# cat /etc/yum.repos.d/kylin_aarch64.repo 
###Kylin Linux Advanced Server 10 - os repo###

[ks10-adv-os]
name = Kylin Linux Advanced Server 10 - Os 
baseurl = http://update.cs2c.com.cn:8080/NS/V10/V10SP1/os/adv/lic/base/$basearch/
gpgcheck = 0
enabled = 1

[ks10-adv-updates]
name = Kylin Linux Advanced Server 10 - Updates
baseurl = http://update.cs2c.com.cn:8080/NS/V10/V10SP1/os/adv/lic/updates/$basearch/
gpgcheck = 0
enabled = 0

[ks10-adv-addons]
name = Kylin Linux Advanced Server 10 - Addons
baseurl = http://update.cs2c.com.cn:8080/NS/V10/V10SP1/os/adv/lic/addons/$basearch/
gpgcheck = 0
enabled = 0
```

设置之后执行如下命令

```bash
yum makecache
```

## Ubuntu


## Mac