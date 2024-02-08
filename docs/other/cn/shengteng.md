# 昇腾硬件适配-310P3（300I DUO）

本示例以`Atlas800型号3000`服务器为例

## 安装物理系统环境

主要是`7.0.0`版本的`固件、驱动、CANN-Toolkit、CANN-kernels、Ascend Docker`等，[参考资料](https://www.hiascend.com/document/detail/zh/quick-installation/23.0.0/quickinstg/800_3000/quickinstg_800_3000_0005.html)，可以下载社区版的驱动

第一次安装或者已经卸载老的固件驱动，需按照“驱动 > 固件”的顺序安装驱动固件。

```bash
# root登陆用户之后，创建普通用户
groupadd HwHiAiUser
useradd -g HwHiAiUser -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bash
# 若用户后续需使用从AscendHub拉取的容器镜像，则请用户执行如下命令创建uid和gid为1000的驱动运行用户HwHiAiUser。
groupadd -g 1000 HwHiAiUser
useradd -g HwHiAiUser -u 1000 -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bash

# 将上面下载的驱动、固件、ascend-docker等修改权限并安装
chmod +x Ascend-hdk-310p-npu-driver_23.0.1_linux-aarch64.run
chmod +x Ascend-hdk-310p-npu-firmware_7.1.0.4.220.run
chmod +x Ascend-docker-runtime_5.0.0_linux-aarch64.run

# 安装NPU驱动 
./Ascend-hdk-310p-npu-driver_23.0.1_linux-aarch64.run --full --install-for-all
# 出现如下信息表示安装成功（如果报错了，可以参考上面的【参考资料】链接中的错误处理方法）
Driver package installed successfully!
# 安装NPU固件
./Ascend-hdk-310p-npu-firmware_7.1.0.4.220.run --full
# 出现如下信息表示安装成功
Firmware package installed successfully! Reboot now or after driver installation for the installation/upgrade to take effect 
# 重启OS
reboot
# 查看是否成功
npu-smi info
# 查看可用设备
ls /dev/ | grep davinci*


### 先安装docker再安装ascend-docker
./Ascend-docker-runtime_5.0.0_linux-aarch64.run --install
# 出现如下信息表示安装成功
xxx install success
# 重启docker
systemctl restart docker
```

如果是`升级驱动`需按照`固件 > 驱动`的顺序安装固件驱动。

```bash
# 固件
./Ascend-hdk-310p-npu-firmware_7.1.0.4.220.run --full

# 驱动
./Ascend-hdk-310p-npu-driver_23.0.1_linux-aarch64.run --full  --install-for-all

# 重启
reboot
```

## 制作docker镜像

如果要自己制作容器镜像，镜像内容参考的是官方的`chatglm2-6b`运行例子，[下载链接](https://www.hiascend.com/developer/download/community/result?module=cann&cann=7.0.0.beta1)，选择`tar.gz`和`run`格式文件，具体可以根据cpu的架构和显卡型号选择下载文件，具体参考下面说明文档。

```bash
# 拉取基础镜像
docker pull ubuntu:18.04
# 运行安装环境的空容器
docker run -itd --name test111 ubuntu:18.04
docker exec -it test111 bash
# 初始化操作
apt update
apt install --no-install-recommends pciutils -y
mkdir /lib64 && ln -sf /lib/ld-linux-aarch64.so.1 /lib64/ld-linux-aarch64.so.1
# 安装python环境（参考python资料）
miniconda3
# 退出重新进容器即可生效miniconda的python环境

#### 安装cann相关
# 平台开发套件软件包，用于用户开发应用、自定义算子和模型转换，适用于命令行方式安装场景
Ascend-cann-toolkit_7.0.0_linux-aarch64.run
Ascend-cann-kernels-310p_7.0.0_linux.run   # 算子要根据显卡型号选择
# 安装
chmod +x Ascend-cann-toolkit_7.0.0_linux-aarch64.run
chmod +x Ascend-cann-kernels-310p_7.0.0_linux.run
./Ascend-cann-toolkit_7.0.0_linux-aarch64.run --install --install-for-all --quiet
./Ascend-cann-kernels-310p_7.0.0_linux.run --install --install-for-all --quiet
# 生效环境变量
source /usr/local/Ascend/ascend-toolkit/set_env.sh

### 安装torch依赖
pip install -i https://pypi.douban.com/simple pyyaml wheel typing_extensions
# 安装pytorch（这里要特别注意，torch版本要和Ascend-cann-llm_7.0.0_linux-aarch64_torch1.11.0-abi0.tar.gz中的一样）
pip install -i https://pypi.douban.com/simple torch==2.0.1
# 下载torch_npu，https://gitee.com/ascend/pytorch/releases，一定要选择对应版本
pip install torch_npu-2.0.1.post1-cp39-cp39-linux_aarch64.whl
# 若返回True则说明PyTorch安装成功
python3 -c "import torch;import torch_npu;print(torch_npu.npu.is_available())"
#### 确认下载使用abi0还是abi1包
# 在python环境下运行如下两行。若返回True，则flag=1；若返回False则flag=0
python
import torch
torch.compiled_with_cxx11_abi()
exit()

#### 下载安装加速库
# 昇腾Transformer加速库软件包，提供了基础的高性能的算子，或一种高效的算子组合技术（Graph），方便模型加速
Ascend-cann-atb_7.0.0_linux-aarch64_abi0.run
Ascend-cann-atb_7.0.0_linux-aarch64_abi1.run
# 安装
chmod +x Ascend-cann-atb_7.0.0_linux-aarch64_abi0.run
./Ascend-cann-atb_7.0.0_linux-aarch64_abi0.run --install 
# 生效环境变量
source /usr/local/Ascend/atb/set_env.sh

#### 下载transformer-llm包
# 平台大语言模型推理参考实例（这个操作在容器外面解压）
Ascend-cann-llm_7.0.0_linux-aarch64_torch2.0.1-abi0.tar.gz
Ascend-cann-llm_7.0.0_linux-aarch64_torch2.0.1-abi1.tar.gz
tar xzf Ascend-cann-llm_7.0.0_linux-aarch64_torch1.11.0-abi0.tar.gz -C /data
mv Ascend-cann-llm_7.0.0_linux-aarch64_torch1.11.0-abi0 code
# 查看chatglm2依赖
cat /data/code/pytorch/examples/chatglm2_6b/requirements.txt
### 安装glm2依赖（这个在容器中执行）
pip install -i https://pypi.douban.com/simple transformers==4.30.2 sentencepiece
# 安装atb_speed
docker cp /data/code/pytorch/examples/atb_speed_sdk test111:/tmp
docker exec -it test111 bash
cd /tmp
pip install .
rm -rf /tmp/atb_speed_sdk

### 调整环境变量
vim ~/.profile
# 增加如下配置
export ASCEND_BASE=/usr/local/Ascend
export LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libgomp.so.1
export LD_LIBRARY_PATH=$ASCEND_BASE/driver/lib64:$ASCEND_BASE/driver/lib64/common:$ASCEND_BASE/driver/lib64/driver:$LD_LIBRARY_PATH
source $ASCEND_BASE/ascend-toolkit/set_env.sh
source $ASCEND_BASE/atb/set_env.sh
if [ -f "/data/code/set_env.sh" ]; then
  source "/data/code/set_env.sh"
fi

### 清理容器内的所有run包和其他数据
rm -f *.run
rm -rf ~/.cache

### 生成镜像
docker commit test111 llm:310p
### 导出导入镜像
docker save -0 llm.tar llm:310p
docker load -i llm.tar
```

## 准备代码、模型并在物理机运行

* 具体参考`Ascend-cann-llm_7.0.0_linux-aarch64_torch1.11.0-abi0.tar.gz`解压后的`chatglm2_6b`的`README.md`文件

```bash
# 下载模型（如果网络有问题，可以去modelscope先手动下载bin和model模型文件，然后再去huggingface下载非lfs文件，再合并到一起）
# 将下载后的模型和文件放到 /data/code/models目录下
# 请自行确认已安装 git-lfs
git lfs install
git clone https://huggingface.co/THUDM/chatglm2-6b
# 最终的目录结构如下
|-- config.json
|-- configuration_chatglm.py
|-- modeling_chatglm.py
|-- pytorch_model-00001-of-00007.bin
|-- pytorch_model-00002-of-00007.bin
|-- pytorch_model-00003-of-00007.bin
|-- pytorch_model-00004-of-00007.bin
|-- pytorch_model-00005-of-00007.bin
|-- pytorch_model-00006-of-00007.bin
|-- pytorch_model-00007-of-00007.bin
|-- pytorch_model.bin.index.json
|-- quantization.py
|-- tokenization_chatglm.py
|-- tokenizer_config.json
|-- tokenizer.model
# 在config.json文件中增加如下配置
{ 
  ......
  "world_size": 1,
}
# 设置环境变量
export CHECKPOINT=/data/code/models

### 获取量化权重（可选）
下载路径：
[300I DUO 量化权重下载](https://model-weight.obs.cn-north-4.myhuaweicloud.com/chatglm2_6B_310p.tar.gz)
[300T A2 量化权重下载](https://model-weight.obs.cn-north-4.myhuaweicloud.com/chatglm2_6B_910b.tar.gz)
# 解压
tar -zxf chatglm2_6B_310p.tar.gz -C /data/code/models
# 设置环境变量
export QUANT_WEIGHT_PATH=/data/code/models/quant_weight

### 下载 `C-Eval` 数据集（可选）
https://cloud.tsinghua.edu.cn/f/e84444333b6d434ea7b0
# 将数据解压，放到 /data/code/models 目录下
# 设置环境变量
export DATASET=/data/code/models/CEval

# 可开启CPU Performance模式以提高模型推理性能（物理机器）
cpupower frequency-set -g performance

# 服务器上启动容器，再去里面运行服务
docker run -itd \
--cap-add=ALL \
--device=/dev/davinci0 \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/dcmi:/usr/local/dcmi \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver/lib64/common:/usr/local/Ascend/driver/lib64/common \
-v /usr/local/Ascend/driver/lib64/driver:/usr/local/Ascend/driver/lib64/driver \
-v /usr/local/Ascend/driver/version.info:/usr/local/Ascend/driver/version.info \
-v /etc/ascend_install.info:/etc/ascend_install.info \
-v /etc/vnpu.cfg:/etc/vnpu.cfg \
-v /data:/data \
--name fc-llm llm:310p \
/bin/bash

# 启动环境变量
source ~/.profile

# 设置环境变量
export CHECKPOINT=/data/code/models
export QUANT_WEIGHT_PATH=/data/code/models/quant_weight
export DATASET=/data/code/models/CEval
export HCCL_BUFFSIZE=110
export HCCL_OP_BASE_FFTS_MODE_ENABLE=1
export TASK_QUEUE_ENABLE=1
export ATB_OPERATION_EXECUTE_ASYNC=1
export ATB_LAYER_INTERNAL_TENSOR_REUSE=1
# 300 Ipro 和 300 IDuo 上使能多 stream 可提升性能
export ATB_USE_TILING_COPY_STREAM=1

# 单芯场景
python main.py --mode cli_demo --model_path ${CHECKPOINT} --device 0

# 双芯场景
python generate_weights.py --model_path ${CHECKPOINT} --tp_size 2
torchrun --nproc_per_node 2 --master_port 2000 main.py --mode cli_demo --model_path ${CHECKPOINT} --tp_size 2 --device 0

# 量化单芯场景
export ENABLE_QUANT=1
export QUANT_WEIGHT_PATH=${QUANT_WEIGHT_PATH}
python generate_weights.py --model_path ${CHECKPOINT}
python main.py --mode cli_demo --model_path ${CHECKPOINT} --device 0

# 量化双芯场景(300 IDuo)
export ENABLE_QUANT=1
export QUANT_WEIGHT_PATH=${QUANT_WEIGHT_PATH}
python generate_weights.py --model_path ${CHECKPOINT} --tp_size 2
torchrun --nproc_per_node 2 --master_port 2000 main.py --mode cli_demo --model_path ${CHECKPOINT} --tp_size 2 --device 0
```

## chatglm2官方代码适配修改

只需要修改程序运行的入口文件，增加如下代码

```py
import torch_npu
from torch_npu.contrib import transfer_to_npu
torch.npu.set_device(torch.device("npu:2"))


# 如果是要调整web_demo.py的运行端口号，按照如下修改
demo.queue().launch(share=False, inbrowser=True, port=8000)
```

# 昇腾适配问题列表

* 碰到报错 `No module named _sqlite3`

```bash
# 查找系统中的 _sqlite3 文件
find / -name _sqlite3*
# 查看 sys.path
python
import sys
sys.path
# 复制so文件到对应目录下
cp /usr/lib/python3.6/lib-dynload/_sqlite3.cpython-36m-aarch64-linux-gnu.so /usr/local/python3.9.2/lib/python3.9/lib-dynload/_sqlite3.so
```

* `ImportError: /usr/local/gcc7.3.0/lib64/libgomp.so.1: cannot allocate memory in static TLS block`

```bash
# 查看gomp库
find / -name 'libgomp.so.1'
# 替换成系统自带的gomp库
export LD_PRELOAD=/usr/local/gcc7.3.0/lib64/libgomp.so.1
```

* `ImportError: This modeling file requires the following packages that were not found in your environment: atb_speed. Run "pip install atb_speed"`

```bash
cd /data/code/pytorch/examples/atb_speed_sdk
pip install .
```