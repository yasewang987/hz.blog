# Nvidia显卡环境安装

* 安装 [nvidia显卡驱动](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-nvidia-driver.html)
* 安装 [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#installing-on-ubuntu-and-debian)

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