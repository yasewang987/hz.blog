# Nvidia显卡环境安装

* 安装 [nvidia显卡驱动](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)

    Ubuntu20.04显卡驱动安装：

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

* 安装 [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian)

* 查看内核显卡版本：`cat /proc/driver/nvidia/version`
* 查看安装的显卡驱动信息： `dpkg --list | grep nvidia`

执行如下命令确认是否安装成功，如果有显卡信息展示说明成功：

```bash
nvidia-smi
```

## 常见错误处理

* 运行容器时提示：`Failed to initialize NVML: Unknown Error`，一般都是运行参数有问题，正常命令如下

```bash
# 注意 --gpus all --privileged 是否都有
sudo docker run --rm --gpus all --privileged pytorch/pytorch:1.6.0-cuda10.1-cudnn7-runtime nvidia-smi
```