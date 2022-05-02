# Nvidia显卡环境安装

* 安装 [nvidia显卡驱动](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)

    https://docs.nvidia.com/datacenter/tesla/tesla-installation-notes/index.html#ubuntu-lts

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
        # 输出
        == /sys/devices/pci0000:00/0000:00:01.0/0000:01:00.0 ==
        modalias : pci:v000010DEd00001F95sv00001028sd0000097Dbc03sc02i00
        vendor   : NVIDIA Corporation
        model    : TU117M [GeForce GTX 1650 Ti Mobile]
        driver   : nvidia-driver-440 - distro non-free recommended
        driver   : xserver-xorg-video-nouveau - distro free builtin

        # 自动安装
        sudo ubuntu-drivers autoinstall

        # 安装对应版本驱动
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

* 安装依赖环境

```bash
yum install kernel-devel gcc -y
```

* 检查内核版本和源码版本，保证一致

```bash
ls /boot | grep vmlinu

rpm -aq | grep kernel-devel
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

* 下载显卡驱动文件：https://www.nvidia.cn/Download/index.aspx?lang=cn ，选择对应版本的显卡

* 安装显卡驱动：

```bash
chmod +x NVIDIA-Linux-x86_64-440.64.run

./NVIDIA-Linux-x86_64-440.64.run
```

* 验证：`nvidia-smi`

## docker容器使用显卡驱动

* 安装 [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian)

    dockeer19.03版本之后只需要安装 `nvidia-container-runtime` 即可
    
    ```bash
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
        && curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add - \
        && curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

    sudo apt-get update \
        && sudo apt-get install -y nvidia-container-runtime

    # 验证
    sudo docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
    ```

* 查看内核显卡版本：`cat /proc/driver/nvidia/version`
* 查看安装的显卡驱动信息： `dpkg --list | grep nvidia`

执行如下命令确认是否安装成功，如果有显卡信息展示说明成功：

```bash
nvidia-smi
```

## nvidia运行docker容器选择

如果是`Tensorflow`的，到帮助目录先确认要下载的镜像版本号：https://docs.nvidia.com/deeplearning/frameworks/tensorflow-release-notes/running.html#running

如果是`Pytorch`的，到这个地址确认：https://docs.nvidia.com/deeplearning/frameworks/pytorch-release-notes/index.html

如果上面没有找到符合要求的镜像，也可以到 dockerhub 里面找

再到Nvidia官方的容器镜像仓库下载：https://ngc.nvidia.com/catalog/containers

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