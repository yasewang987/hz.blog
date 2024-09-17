# Nvidia显卡环境安装

* 如果是数据中心的卡，请记住一定要安装`nvidia-fabricmanager`不然无法使用

* 显卡驱动安装查询：https://www.nvidia.cn/drivers/lookup/

* 安装 [nvidia显卡驱动](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)

    https://docs.nvidia.com/datacenter/tesla/tesla-installation-notes/index.html#ubuntu-lts

## 常用命令

```bash
# 查看显卡信息
lspci|grep NVIDIA

# 显卡驱动安装
./NVIDIA-Linux-x86_64-535.183.06.run

# cuda安装
./cuda_12.1.0_530.30.02_linux.run

# cuda卸载
cd /usr/local/cuda-12.1/bin
cuda-uninstaller
```

## 显卡型号查看

显卡型号查询网站：http://pci-ids.ucw.cz/mods/PC/10de?action=help?help=pci

```bash
# 查看硬件
lspci | grep NVIDIA
af:00.0 VGA compatible controller: NVIDIA Corporation Device 2684 (rev a1)
af:00.1 Audio device: NVIDIA Corporation Device 22ba (rev a1)

# 上面的 2684 到【显卡型号查询网站】查询即可
```

## Nvidia显卡驱动和Cuda版本关系

* 显卡驱动：这是让GPU硬件能够被操作系统识别的基础软件，它处理所有与GPU硬件交互的任务，包括图形渲染、视频解码等。
* CUDA：在安装了显卡驱动的基础上，CUDA提供了一层额外的功能，使得GPU可以被用作通用计算设备。CUDA包含了库函数、编译器工具链和API接口，允许开发者编写专门针对GPU优化的应用程序。
* `CUDA Toolkit (nvidia)`: CUDA完整的工具安装包，其中提供了 Nvidia 驱动程序、开发 CUDA 程序相关的开发工具包等可供安装的选项。包括 CUDA 程序的编译器、IDE、调试器等，CUDA 程序所对应的各式库文件以及它们的头文件。
* `CUDA Toolkit (Pytorch)`： CUDA不完整的工具安装包，其主要包含在使用 CUDA 相关的功能时所依赖的动态链接库。不会安装驱动程序。
* `NVCC`: 是CUDA的编译器，只是 CUDA Toolkit 中的一部分
* `cudnn`：为深度学习计算设计的软件库，加速库。

CUDA有两个主要的API：`runtime(运行时) API`和`driver API`，这两个API都有对应的CUDA版本。

* `driver API`是通过`GPU driver installer`安装的，可理解为系统出场安装的默认驱动，`nvidia-smi`显示的是 `driver API`，这里显示的 CUDA 版本表示当前驱动最大支持的 CUDA 版本。
* `runtime API`是通过  `CUDA toolkit`安装的，可理解为用户自己安装的驱动，`nvcc`显示的是`runtime API`。

通常情况下，这两个显示都是不一样的，不过不用担心，只要`driver API`比`runtime API`高，一般都没问题。但是最好不要有大版本的差异，有可能会出现不能用的问题。

`cuDNN（CUDA Deep Neural Network library）`：是`NVIDIA`打造的针对深度神经网络的加速库，是一个用于深层神经网络的GPU加速库。如果你要用GPU训练模型，`cuDNN`不是必须的，但是一般会采用这个加速库。

如果你想在Docker容器中利用NVIDIA GPU的计算能力，你需要确保以下组件正确安装和配置：

物理机器上需要安装：
* NVIDIA显卡驱动：确保你的系统上已经安装了最新版本的NVIDIA显卡驱动。
* NVIDIA Docker 或 NVIDIA Container Toolkit：这些工具可以让你的Docker容器访问GPU资源。你可以在NVIDIA官网下载并安装。

Docker镜像中需要安装：
* CUDA Toolkit：提供基本的CUDA功能，包括编译器和库文件。
* cuDNN（如果需要深度学习应用）：这是一个高度优化的深度神经网络库，通常与CUDA一起使用。

```bash
# cuDNN 版本查询
cat /usr/local/cuda/include/cudnn.h | grep CUDNN_MAJOR -A 2
```

## Ubuntu20.04显卡驱动安装

* 禁用 `nouveau` 驱动

```bash
sudo vim /etc/modprobe.d/blacklist.conf

# 在文件最后部分插入以下两行内容
blacklist nouveau
options nouveau modeset=0

# 更新系统
sudo update-initramfs -u

sudo reboot

# 验证是否已禁用，没有信息显示，说明nouveau已被禁用
lsmod | grep nouveau
```
* 安装 `nvidia` 驱动

```bash
ubuntu-drivers devices
# 输出（推荐安装 recommended 的）
== /sys/devices/pci0000:00/0000:00:01.0/0000:01:00.0 ==
modalias : pci:v000010DEd00001F95sv00001028sd0000097Dbc03sc02i00
vendor   : NVIDIA Corporation
model    : TU117M [GeForce GTX 1650 Ti Mobile]
driver   : nvidia-driver-440 - distro non-free recommended
driver   : xserver-xorg-video-nouveau - distro free builtin

# 自动安装
sudo ubuntu-drivers autoinstall

# 安装对应版本驱动，服务器推荐安装-server版本的
sudo apt install nvidia-driver-440

sudo reboot

# 验证
nvidia-smi
# 输出
Wed Nov 11 22:45:21 2020
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 440.100      Driver Version: 440.100      CUDA Version: 11.1     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  GeForce GTX 165...  Off  | 00000000:01:00.0 Off |                  N/A |
| N/A   41C    P3    14W /  N/A |      4MiB /  3914MiB |      0%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+

+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|    0   N/A  N/A      2323      G   /usr/lib/xorg/Xorg                  4MiB |
+-----------------------------------------------------------------------------+
```

## centos7显卡驱动安装

* 检查内核版本和源码版本，保证一致

```bash
ls /boot | grep vmlinu
vmlinuz-0-rescue-leabcassxx123asfs34
vmlinuz-3.10.0-957.el7.x86_64

rpm -aq | grep kernel-devel
# 如果没有下面这个或者与上面的不一致，则安装对应的版本
kernel-devel-3.10.0-957.el7.x86_64
```

* 安装依赖环境

```bash
# 在线安装
yum install kernel-devel gcc -y
# 离线安装
wget https://people.centos.org/arrfab/shim/results/kernel/20181108233701/3.10.0-957.el7.x86_64/kernel-3.10.0-957.el7.x86_64.rpm
wget https://people.centos.org/arrfab/shim/results/kernel/20181108233701/3.10.0-957.el7.x86_64/kernel-devel-3.10.0-957.el7.x86_64.rpm
wget https://people.centos.org/arrfab/shim/results/kernel/20181108233701/3.10.0-957.el7.x86_64/kernel-headers-3.10.0-957.el7.x86_64.rpm

rpm  -ivh kernel-3.10.0-957.el7.x86_64.rpm
rpm -ivh kernel-devel-3.10.0-957.el7.x86_64.rpm
rpm -ivh kernel-headers-3.10.0-957.el7.x86_64.rpm
```

* 下载显卡驱动文件：https://www.nvidia.cn/Download/index.aspx?lang=cn ，选择对应版本的显卡

* 安装显卡驱动(正常来说到这里就可以了，安装完之后直接执行`nvidia-smi`验证)：

```bash
wget https://cn.download.nvidia.com/tesla/460.106.00/NVIDIA-Linux-x86_64-460.106.00.run

chmod +x NVIDIA-Linux-x86_64-440.64.run

./NVIDIA-Linux-x86_64-440.64.run
```

* 屏蔽系统自带的nouveau

```bash
# 查看命令：
lsmod | grep nouveau

# 修改dist-blacklist.conf文件：
vim /lib/modprobe.d/dist-blacklist.conf

# 添加如下内容：
blacklist nouveau
options nouveau modeset=0

# 验证是否已禁用，没有信息显示，说明nouveau已被禁用
lsmod | grep nouveau
```

* 重建initramfs image步骤

```bash
mv /boot/initramfs-$(uname -r).img /boot/initramfs-$(uname -r).img.bak

dracut /boot/initramfs-$(uname -r).img $(uname -r)
```

* 修改运行级别为文本模式

```bash
systemctl set-default multi-user.target
```

* 重启系统：`reboot`

* 验证：`nvidia-smi`

## CentOS7离线安装显卡驱动
```bash
# 查看系统内核
ls /boot | grep vmlinu

rpm -aq | grep kernel-devel
# 升级内核

```

## nvidia运行docker容器选择

### 开发镜像：

如果上面没有找到符合要求的镜像，也可以到 dockerhub 里面找 【nvidia/cuda】（可以找develop版本）

如果拉取镜像失败，再到Nvidia官方的容器镜像仓库下载：`https://catalog.ngc.nvidia.com/orgs/nvidia/containers/cuda/tags`

如果是`Tensorflow`的，到帮助目录先确认要下载的镜像版本号：https://docs.nvidia.com/deeplearning/frameworks/tensorflow-release-notes/running.html#running

如果是`Pytorch`的，到这个地址确认：https://docs.nvidia.com/deeplearning/frameworks/pytorch-release-notes/index.html

### 运行镜像：

直接到 `hub.docker.com` 找 `nvidia/cuda` 的对应版本（可以找runtime版本）, 建议 `12.2.2-cudnn8-runtime-ubuntu20.04` 这种形式的

如果拉取镜像失败，可以到nvidia的网站拉取 `https://catalog.ngc.nvidia.com/orgs/nvidia/containers/cuda/tags`

通过nvidia官网拉取镜像时，会碰到拉取镜像 `ngc.download.nvidia.cn`报错，需要到 `https://sites.ipaddress.com/` 查询ip地址，然后在修改 `/etc/hosts`，增加如下配置 `23.205.107.10 ngc.download.nvidia.cn` 然后重新拉取即可。

## 常见错误处理

* 运行容器时提示：`Failed to initialize NVML: Unknown Error`，一般都是运行参数有问题，正常命令如下

```bash
# 注意 --gpus all --privileged 是否都有
sudo docker run --rm --gpus all --privileged pytorch/pytorch:1.6.0-cuda10.1-cudnn7-runtime nvidia-smi
```

* 报错 `unable to find the kernel source tree for the currently running kernel.........`，使用下面命令安装，`3.10.0-1062.18.1.el7.x86_64`需要改成自己的目录

```bash
./NVIDIA-Linux-x86_64-440.64.run --kernel-source-path=/usr/src/kernels/3.10.0-1062.18.1.el7.x86_64 -k $(uname -r)
```

* `nvidia-smi`显卡丢失以及`GPU Fan`显示`ERR!`

```bash
# 1. 重启服务器
reboot

# 设置显卡最大功率
# （每次设置下面功率都要先执行）
# 把GPU的persistent mode（常驻模式）打开，这样才能顺利设置power limit
sudo nvidia-smi -pm 1 -i 显卡号
# 把功率限制从默认的250W调整到150W，也可以设置其他值
sudo nvidia-smi -pl 150 -i 显卡号
```

* `NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver`

出现这个问题，大概率是系统内核和显卡驱动不匹配，建议关闭系统自动更新

```bash
# 查看显卡版本号
ls /usr/src | grep nvidia

# 重新安装
sudo apt install dkms
sudo dkms install -m nvidia -v 418.87.00

# 上面的操作如果提示找不到 nvidia-driver-418.87.00 则需要重新安装nvidia驱动
# 然后再执行 dkms install -m nvidia -v 418.87.00
```

* `Error 802: system not yet initialized (Triggered internally at ../c10/cuda/CUDAFunctions.cpp:108` 这个错误一般出现在8卡的A100和H800这些显卡中，需要安装 `NVLink/NVSwitch fabric manager`。【一定要注意机器的驱动版本和`nvidia-fabricmanager`版本一致】

```bash
apt install -y nvidia-fabricmanager-550

# 查看状态
systemctl status nvidia-fabricmanager
# 如果重新安装驱动执行一下
systemctl restart nvidia-fabricmanager
```