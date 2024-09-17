# AI相关软件安装

* nvidia基础镜像地址下载地址：https://developer.download.nvidia.com/compute/cuda/opensource/image/

## openblas安装

```bash
git clone https://github.com/xianyi/OpenBLAS.git
cd OpenBLAS
make
# 如果安装到其他目录，需要设置LD_LIBRARY_PATH:/yourpath/OpenBLAS/lib
make PREFIX=/usr/local install
```

## tensorrt镜像制作

1. 运行空的基础镜像容器
1. 要安装tensorrt9.1（具体版本参考实际情况）：https://developer.nvidia.com/downloads/compute/machine-learning/tensorrt/secure/9.1.0/tars/tensorrt-9.1.0.4.linux.x86_64-gnu.cuda-12.2.tar.gz
1. 解压到`usr/local/tensorrt`文件夹，设置环境变量:`LD_LIBRARY_PATH=/usr/local/tensorrt/lib:$LD_LIBRARY_PATH`
1. 解压后`tensorrt/python`文件夹下有`tensorrt==9.1.0.post12.dev4`的包，`pip install tensorrt_lean-9.1.0.post12.dev4-cp310-none-linux_x86_64.whl`
1. 安装gcc9，g++9
