# 寒武纪适配

## 适配环境及资料

* 操作系统：银河麒麟V10SP2
* cpu：海光
* 整体适配流程参考：https://forum.cambricon.com/index.php?m=content&c=index&a=show&catid=169&id=2441
* 寒武纪驱动资料：https://sdk.cambricon.com/download?sdk_version=V1.15.0&component_name=Driver
* 寒武纪docker资料：https://sdk.cambricon.com/download?component_name=PyTorch
* 寒武纪pytorch1.13用户手册：https://www.cambricon.com/docs/sdk_1.15.0/cambricon_pytorch_1.17.0/user_guide_1.13/index.html
* github地址：https://github.com/CambriconKnight/dev-env-ubuntu
* 自动代码转换：`python /torch/src/catch/tools/torch_gpu2mlu/torch_gpu2mlu.py -i ChatGLM3/`

## 驱动安装

```bash
# 查看系统版本及内核版本
cat /etc/os-release
rpm -qa | grep kernel

# 下载kernel-devel安装包，到下面网址找到对应的包（4.19.90-25.9.v2101.ky10.x86_64）
# https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/x86_64/Packages/
wget https://update.cs2c.com.cn/NS/V10/V10SP2/os/adv/lic/updates/x86_64/Packages/kernel-devel-4.19.90-25.9.v2101.ky10.x86_64.rpm
rpm -ivh kernel-devel-4.19.90-25.9.v2101.ky10.x86_64.rpm

# 下载寒武纪驱动下载：https://sdk.cambricon.com/download?sdk_version=V1.15.0&component_name=Driver
wget https://sdk.cambricon.com/static/Driver/MLU370_v5.10.22_X86_kylinv10_rpm/cambricon-mlu-driver-kylinV10-5.10.22-1.ky10.x86_64.rpm
# 查看环境依赖包（如果没有安装需要先安装）
rpm -qa | grep dkms
rpm -qa | grep gcc
rpm -qa | grep kernel-headers
rpm -qa | grep kernel-devel
# 假如dkms没有安装（也可以源码编译 https://github.com/dell/dkms/releases）
wget https://dl.fedoraproject.org/pub/epel/7/aarch64/Packages/d/dkms-2.7.1-1.el7.noarch.rpm
rpm -ivh dkms-2.8.7-1.el7.noarch.rpm

# 安装驱动(出现successful说明安装成功)
rpm -ivh cambricon-mlu-driver-kylinV10-5.10.22-1.ky10.x86_64.rpm
# 重启服务器
reboot
# 验证驱动是否安装成功
cnmon
# 输出
Wed Nov  8 16:16:45 2023
+------------------------------------------------------------------------------+
| CNMON v5.10.22                                               Driver v5.10.22 |
+-------------------------------+----------------------+-----------------------+
| Card  VF  Name       Firmware |               Bus-Id | Util        Ecc-Error |
| Fan   Temp      Pwr:Usage/Cap |         Memory-Usage | Mode     Compute-Mode |
|===============================+======================+=======================|
| 0     /   MLU370-X8    v1.1.6 |         0000:13:00.0 | 0%                  0 |
|  0%   28C        107 W/ 250 W |     0 MiB/ 20638 MiB | FULL          Default |
+-------------------------------+----------------------+-----------------------+
| 1     /   MLU370-X8    v1.1.6 |         0000:16:00.0 | 0%                  0 |
|  0%   32C        107 W/ 250 W |     0 MiB/ 20638 MiB | FULL          Default |
+-------------------------------+----------------------+-----------------------+

+------------------------------------------------------------------------------+
| Processes:                                                                   |
|  Card  MI  PID     Command Line                             MLU Memory Usage |
|==============================================================================|
|  No running processes found                                                  |
+------------------------------------------------------------------------------+
```

## docker镜像验证

注意：需要先安装docker

```bash
# 下载镜像
wget https://sdk.cambricon.com/static/PyTorch/MLU370_1.13_v1.17.0_X86_ubuntu20.04_python3.10_docker/pytorch-v1.17.0-torch1.13.1-ubuntu20.04-py310.tar.gz
# 加载镜像并查看是否成功
docker load -i pytorch-v1.17.0-torch1.13.1-ubuntu20.04-py310.tar.gz
docker images
# 运行调试容器
docker run -itd \
--privileged \
--device /dev/cambricon_dev0 \
--device /dev/cambricon_dev1 \
--device /dev/cambricon_ctl \
--device /dev/cambricon_ipcm0 \
-v /usr/bin/cnmon:/usr/bin/cnmon \
-v $PWD:/data \
--name test111 \
yellow.hub.cambricon.com/pytorch/pytorch:v1.17.0-torch1.13.1-ubuntu20.04-py310 \
/bin/bash

# 检查pytorch是否可用
python
>>> import torch
>>> import torch_mlu
>>> torch.__version__
'1.13.1'
>>> torch_mlu.__version__
'1.17.0-torch1.13'
>>> a=torch.randn(2,3).mlu() # 该示例需要在MLU服务器上运行。
>>> a.abs()
```

## glm3适配

github地址：https://github.com/CambriconKnight/dev-env-ubuntu/tree/master/pytorch1.13/chatglm3

```bash
######### 推理
cd /data
# 下载 transformers 源码
git clone -b v4.40 https://github.com/huggingface/transformers
# 下载 ChatGLM3 源码
git clone https://github.com/THUDM/ChatGLM3 && cd ChatGLM3 && git checkout 35f21dda9f567
# 下载glm3模型
vim download.py
------download.py
from modelscope.hub.snapshot_download import snapshot_download
model_dir = snapshot_download('ZhipuAI/chatglm3-6b', cache_dir='/data/models')
------download.py
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple modelscope
nohup python3 download.py &
# 修改transformers
python /torch/src/catch/tools/torch_gpu2mlu/torch_gpu2mlu.py -i transformers/
cd transformers_mlu && pip install -e .
cd /data
# 修改ChatGLM3
python /torch/src/catch/tools/torch_gpu2mlu/torch_gpu2mlu.py -i ChatGLM3/
cd ChatGLM3_mlu
sed -i 's/torch/# torch/' requirements.txt
sed -i 's/transformers/# transformer/' requirements.txt
pip install -r requirements.txt
cd /data
# 下载dev-env-ubuntu
git clone https://github.com/CambriconKnight/dev-env-ubuntu.git
# 修改模型文件 modeling_chatglm.py
mv models/ZhipuAI/chatglm3-6b/modeling_chatglm.py models/ZhipuAI/chatglm3-6b/modeling_chatglm.py.back
cp -rf dev-env-ubuntu/pytorch1.13/chatglm3/tools/modeling_chatglm_mlu_infer.py models/ZhipuAI/chatglm3-6b/modeling_chatglm.py

# 运行简单demo
cp -rvf dev-env-ubuntu/pytorch1.13/chatglm3/tools/demo.py ChatGLM3_mlu/
cd ChatGLM3_mlu
export MLU_VISIBLE_DEVICES=0,1
# 根据实际环境修改demo.py 中模型路径(加载比较慢，大概需要5分钟)
python demo.py

### 运行官方openapi接口
# 下载embedding模型（可选，如果不测试embedding，可以注释掉openai_api_request.py的embedding请求）
------download.py
from modelscope import snapshot_download
model_dir = snapshot_download('maidalun/bce-embedding-base_v1', cache_dir='/data/models')
------download.py
export EMBEDDING_PATH=/data/models/maidalun/bce-embedding-base_v1

cd openapi_api_demo
# 修改api_server里的tokenizer地址为MODEL_PATH
vim api_server.py
# 设置环境变量，根据实际环境修改模型路径
export MODEL_PATH=/data/models/ZhipuAI/chatglm3-6b
python api_server.py
# 验证（需要注释掉embedding、function_call的请求）
python openai_api_request.py
# 或者
curl -X POST -H 'Content-Type: application/json' -d '{"model":"chatglm3-6b", "messages":[{"role":"user", "content":"你好"}], "stream":true}' http://127.0.0.1:8000/v1/chat/completions

########## 训练
```