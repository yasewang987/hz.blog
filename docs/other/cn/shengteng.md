# 昇腾硬件适配

## 安装系统环境

主要是固件、驱动、CANN等，[参考资料](https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=17&cann=6.3.RC2.alpha003&driver=1.0.19.alpha)

```bash
# 安装驱动前需要创建驱动运行用户HwHiAiUser（运行驱动进程的用户），安装驱动时无需指定运行用户，默认即为HwHiAiUser
groupadd -g 1000 HwHiAiUser
useradd -g HwHiAiUser -u 1000 -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bash

# 下载固件（6.3.0）
Ascend-hdk-310p-npu-firmware_6.3.0.1.241.run		

# 下载驱动(npu)【23.0.rc1】
Ascend-hdk-310p-npu-driver_23.0.rc1_linux-aarch64.run

# 安装NPU驱动 
./Ascend-hdk-310p-npu-driver_23.0.rc1_linux-aarch64.run --full --install-for-all
# 查看驱动加载是否成功，回显芯片信息表示加载成功
npu-smi info
# 安装NPU固件
./Ascend-hdk-310p-npu-firmware_6.3.0.1.241.run --full
# 重启OS
reboot

#### 【这个如果使用镜像可以先不安装】CANN-Toolkit部分
# 下载cann套件（cann_6.3.2）
Ascend-cann-toolkit_7.0.0_linux-aarch64.run
# 安装CANN（以Toolkit为例）
./Ascend-cann-toolkit_7.0.0_linux-aarch64.run --install --install-for-all --quiet
# 执行如下命令配置环境变量。若需要设置环境变量永久生效，可在~/.bashrc文件最后一行后面添加以下命令，执行source ~/.bashrc命令
source /usr/local/Ascend/ascend-toolkit/set_env.sh
```

## 安装docker

如果要自己制作容器，参考 [镜像制作](https://www.hiascend.com/document/detail/zh/quick-installation/23.0.0/quickinstg/800_3000/quickinstg_800_3000_0048.html)

* [runtime下载地址](https://gitee.com/ascend/ascend-docker-runtime/releases/tag/v5.0.0)
* [310系列推理镜像地址](https://ascendhub.huawei.com/#/detail/ascend-infer) ,推理的话推荐下载镜像`infer-modelzoo`
* [910系列镜像地址](http://mirrors.cn-central-221.ovaijisuan.com/mirrors.html)

```bash
# 先安装docker
# 在安装runtime
chmod +x Ascend-docker-runtime_5.0.0_linux-aarch64.run
./Ascend-docker-runtime_5.0.0_linux-aarch64.run --install
# 重启docker
systemctl restart docker


docker run -itd -e ASCEND_VISIBLE_DEVICES=0 -v /data/model:/data/model ascend-toolkit:7.0.0-ubuntu18.04-arm64  /bin/bash
# 进入容器，查看可用设备
ls /dev/ | grep davinci*
# davinci_manager为管理模块的字符设备节点
# davinci0为该容器使用的davinci设备
```