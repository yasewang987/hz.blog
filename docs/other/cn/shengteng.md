# 昇腾官方资源

* 注意：先到资源中心选择对应的服务器型号（一般是加速卡），然后到固件驱动中心选择对应的服务器型号和CANN版本（和资源下载中心的一致）
* （toolkit、torch、kernels等）资源下载中心：https://www.hiascend.com/developer/download
* 固件驱动选择中心：https://www.hiascend.com/hardware/firmware-drivers/community
* cann安装指南：https://www.hiascend.com/document/detail/zh/CANNCommunityEdition/80RC1alpha003/quickstart/quickstart/quickstart_18_0004.html
* pytorch算子优化：https://www.hiascend.com/document/detail/zh/CANNCommunityEdition/80RC1alpha003/devguide/moddevg/ptmigr/AImpug_0074.html

# 昇腾硬件适配-310P3（300I DUO）

本示例以`Atlas800型号3000`服务器为例

## 安装物理系统环境

主要是`7.0.0`版本的`固件、驱动、CANN-Toolkit、CANN-kernels、Ascend Docker`等，[参考资料](https://www.hiascend.com/document/detail/zh/quick-installation/23.0.0/quickinstg/800_3000/quickinstg_800_3000_0005.html)，可以下载社区版的驱动

第一次安装或者已经卸载老的固件驱动，需按照`驱动 > 固件`的顺序安装驱动固件。

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
./Ascend-hdk-910-npu-firmware_7.1.0.4.220.run --full
# 驱动
./Ascend-hdk-910-npu-driver_23.0.2_linux-aarch64.run --full  --install-for-all
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
# 安装python环境（参考python资料）,生产环境推荐直接安装python不要conda
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

#### 下载transformer-llm包（昇腾官方的下载可能比较老，可以找昇腾的技术要新版本）
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
docker save -o llm.tar llm:310p
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

#### 启动容器
# NPU_NUM是设置使用那块显卡，和代码要配合使用
# 启动空容器，主要测试阶段用
docker run -itd \
--cap-add=ALL \
-e NPU_NUM=3 \
--device=/dev/davinci0 \   # 这个测试下来发现可以不要
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

# 做完启动脚本start.sh之后生产环境执行如下
docker run -d \
--cap-add=ALL \
-e NPU_NUM=3 \
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
/bin/bash /data/code/glm2/start.sh

##### 下面的启动项可以整理成 start.sh 脚本去启动，可以参考下面chatglm2-6b的示例脚本
##### 要注意 /data/code/set_env.sh 里面会用到python，如果使用conda，要修改一下python的路径
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

下载官方的代码之后将代码放到 `/data/code/glm2` 目录下

只需要修改程序运行的入口文件，增加如下代码

```py
import os
import acl
import transformers
import torch_npu
from torch_npu.contrib import transfer_to_npu

#### 原始文件中的关于model的加载的内容全部删除

def get_is_format_nz():
    soc_version = torch_npu._C._npu_get_soc_version()
    if soc_version in [200, 201, 202, 203]:
        return True
    elif soc_version in [220, 221, 222, 223, 224]:
        return False
    else:
        raise NotImplementedError
    soc_version = soc_version_map[torch_npu._C._npu_get_soc_version()]
    return soc_version

def get_model():
    transformers.generation.TopKLogitsWarper.filter_value = torch.finfo(torch.float32).min
    # 这里可以设置使用那块NPU卡（建议使用环境变量NPU_NUM控制）
    npu_num = os.environ.get("NPU_NUM", 0)
    torch.npu.set_device(torch.device(f"npu:{npu_num}"))
    torch.manual_seed(1)
    tokenizer = AutoTokenizer.from_pretrained("/data/code/models", trust_remote_code=True)
    model = AutoModel.from_pretrained("/data/code/models", trust_remote_code=True).half().npu()
    torch.npu.set_compile_mode(jit_compile=False)
    model = model.eval()
    is_format_nz = get_is_format_nz()
    if is_format_nz:
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Linear):
                module.weight.data = torch_npu.npu_format_cast(module.weight.data, 29)
    model.set_weight()
    return tokenizer, model
.....
.....
# 一定要在全局加载模型
tokenizer, model = get_model()
# 这个如果是cli_demo不需要
context,ret = acl.rt.get_context()

def predict(input, chatbot, max_length, top_p, temperature, history, past_key_values):
    chatbot.append((parse_text(input), ""))
    # 这个如果是cli_demo不需要
    acl.rt.set_context(context)
    for response, history, past_key_values in model.stream_chat(tokenizer, input, history, past_key_values=past_key_values,
                                                                return_past_key_values=True,
                                                                max_length=max_length, top_p=top_p,
                                                                temperature=temperature):
        chatbot[-1] = (parse_text(input), parse_text(response))

        yield chatbot, history, past_key_values

....
....
# 如果是要调整web_demo.py的运行端口号，按照如下修改
demo.queue().launch(share=False, inbrowser=True, port=8000)
```

### GLM2官方`web_demo.py`示例

```py
from transformers import AutoModel, AutoTokenizer
import transformers
import gradio as gr
import mdtex2html
from utils import load_model_on_gpus
import os
import acl
import torch
import torch_npu
from torch_npu.contrib import transfer_to_npu

"""Override Chatbot.postprocess"""

def get_is_format_nz():
    soc_version = torch_npu._C._npu_get_soc_version()
    if soc_version in [200, 201, 202, 203]:
        return True
    elif soc_version in [220, 221, 222, 223, 224]:
        return False
    else:
        raise NotImplementedError
    soc_version = soc_version_map[torch_npu._C._npu_get_soc_version()]
    return soc_version

def get_model():
    transformers.generation.TopKLogitsWarper.filter_value = torch.finfo(torch.float32).min
    npu_num = os.environ.get("NPU_NUM", 0)
    torch.npu.set_device(torch.device(f"npu:{npu_num}"))
    torch.manual_seed(1)
    tokenizer = AutoTokenizer.from_pretrained("/data/code/models", trust_remote_code=True)
    model = AutoModel.from_pretrained("/data/code/models", trust_remote_code=True).half().npu()
    torch.npu.set_compile_mode(jit_compile=False)
    model = model.eval()
    is_format_nz = get_is_format_nz()
    if is_format_nz:
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Linear):
                module.weight.data = torch_npu.npu_format_cast(module.weight.data, 29)
    model.set_weight()
    return tokenizer, model

def postprocess(self, y):
    if y is None:
        return []
    for i, (message, response) in enumerate(y):
        y[i] = (
            None if message is None else mdtex2html.convert((message)),
            None if response is None else mdtex2html.convert(response),
        )
    return y


gr.Chatbot.postprocess = postprocess


def parse_text(text):
    """copy from https://github.com/GaiZhenbiao/ChuanhuChatGPT/"""
    lines = text.split("\n")
    lines = [line for line in lines if line != ""]
    count = 0
    for i, line in enumerate(lines):
        if "```" in line:
            count += 1
            items = line.split('`')
            if count % 2 == 1:
                lines[i] = f'<pre><code class="language-{items[-1]}">'
            else:
                lines[i] = f'<br></code></pre>'
        else:
            if i > 0:
                if count % 2 == 1:
                    line = line.replace("`", "\`")
                    line = line.replace("<", "&lt;")
                    line = line.replace(">", "&gt;")
                    line = line.replace(" ", "&nbsp;")
                    line = line.replace("*", "&ast;")
                    line = line.replace("_", "&lowbar;")
                    line = line.replace("-", "&#45;")
                    line = line.replace(".", "&#46;")
                    line = line.replace("!", "&#33;")
                    line = line.replace("(", "&#40;")
                    line = line.replace(")", "&#41;")
                    line = line.replace("$", "&#36;")
                lines[i] = "<br>"+line
    text = "".join(lines)
    return text

tokenizer, model = get_model()
context,ret = acl.rt.get_context()

def predict(input, chatbot, max_length, top_p, temperature, history, past_key_values):
    chatbot.append((parse_text(input), ""))
    acl.rt.set_context(context)
    for response, history, past_key_values in model.stream_chat(tokenizer, input, history, past_key_values=past_key_values,
                                                                return_past_key_values=True,
                                                                max_length=max_length, top_p=top_p,
                                                                temperature=temperature):
        chatbot[-1] = (parse_text(input), parse_text(response))

        yield chatbot, history, past_key_values


def reset_user_input():
    return gr.update(value='')


def reset_state():
    return [], [], None


with gr.Blocks() as demo:
    gr.HTML("""<h1 align="center">ChatGLM2-6B</h1>""")

    chatbot = gr.Chatbot()
    with gr.Row():
        with gr.Column(scale=4):
            with gr.Column(scale=12):
                user_input = gr.Textbox(show_label=False, placeholder="Input...", lines=10).style(
                    container=False)
            with gr.Column(min_width=32, scale=1):
                submitBtn = gr.Button("Submit", variant="primary")
        with gr.Column(scale=1):
            emptyBtn = gr.Button("Clear History")
            max_length = gr.Slider(0, 32768, value=8192, step=1.0, label="Maximum length", interactive=True)
            top_p = gr.Slider(0, 1, value=0.8, step=0.01, label="Top P", interactive=True)
            temperature = gr.Slider(0, 1, value=0.95, step=0.01, label="Temperature", interactive=True)

    history = gr.State([])
    past_key_values = gr.State(None)

    submitBtn.click(predict, [user_input, chatbot, max_length, top_p, temperature, history, past_key_values],
                    [chatbot, history, past_key_values], show_progress=True)
    submitBtn.click(reset_user_input, [], [user_input])

    emptyBtn.click(reset_state, outputs=[chatbot, history, past_key_values], show_progress=True)

demo.queue().launch(share=False, inbrowser=True, server_name='0.0.0.0', server_port=8000)
```

### GLM2官方`openai_api.py`示例

```bash
# openapi curl测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"chatglm2-6b", "messages":[{"role":"user", "content":"你好"}], "stream":true}' http://127.0.0.1:8000/v1/chat/completions
```

* 修改代码的时候需要注意一下将 `yield "{}".format(chunk.json(exclude_unset=True, ensure_ascii=False))` 改成 `yield "{}".format(chunk.model_dump_json(exclude_unset=True))`

```py
# coding=utf-8

import time
import torch
import uvicorn
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Literal, Optional, Union
from transformers import AutoTokenizer, AutoModel
from sse_starlette.sse import ServerSentEvent, EventSourceResponse
import os
import transformers
import torch_npu
from torch_npu.contrib import transfer_to_npu

def get_is_format_nz():
    soc_version = torch_npu._C._npu_get_soc_version()
    if soc_version in [200, 201, 202, 203]:
        return True
    elif soc_version in [220, 221, 222, 223, 224]:
        return False
    else:
        raise NotImplementedError
    soc_version = soc_version_map[torch_npu._C._npu_get_soc_version()]
    return soc_version

def get_model():
    transformers.generation.TopKLogitsWarper.filter_value = torch.finfo(torch.float32).min
    # 这里可以设置使用那块NPU卡（建议使用环境变量NPU_NUM控制）
    npu_num = os.environ.get("NPU_NUM", 0)
    torch.npu.set_device(torch.device(f"npu:{npu_num}"))
    torch.manual_seed(1)
    tokenizer = AutoTokenizer.from_pretrained("/data/code/models", trust_remote_code=True)
    model = AutoModel.from_pretrained("/data/code/models", trust_remote_code=True).half().npu()
    torch.npu.set_compile_mode(jit_compile=False)
    model = model.eval()
    is_format_nz = get_is_format_nz()
    if is_format_nz:
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Linear):
                module.weight.data = torch_npu.npu_format_cast(module.weight.data, 29)
    model.set_weight()
    return tokenizer, model


@asynccontextmanager
async def lifespan(app: FastAPI): # collects GPU memory
    yield
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModelCard(BaseModel):
    id: str
    object: str = "model"
    created: int = Field(default_factory=lambda: int(time.time()))
    owned_by: str = "owner"
    root: Optional[str] = None
    parent: Optional[str] = None
    permission: Optional[list] = None


class ModelList(BaseModel):
    object: str = "list"
    data: List[ModelCard] = []


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class DeltaMessage(BaseModel):
    role: Optional[Literal["user", "assistant", "system"]] = None
    content: Optional[str] = None


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_length: Optional[int] = None
    stream: Optional[bool] = False


class ChatCompletionResponseChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: Literal["stop", "length"]


class ChatCompletionResponseStreamChoice(BaseModel):
    index: int
    delta: DeltaMessage
    finish_reason: Optional[Literal["stop", "length"]]


class ChatCompletionResponse(BaseModel):
    model: str
    object: Literal["chat.completion", "chat.completion.chunk"]
    choices: List[Union[ChatCompletionResponseChoice, ChatCompletionResponseStreamChoice]]
    created: Optional[int] = Field(default_factory=lambda: int(time.time()))


@app.get("/v1/models", response_model=ModelList)
async def list_models():
    global model_args
    model_card = ModelCard(id="gpt-3.5-turbo")
    return ModelList(data=[model_card])


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(request: ChatCompletionRequest):
    global model, tokenizer

    if request.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Invalid request")
    query = request.messages[-1].content

    prev_messages = request.messages[:-1]
    if len(prev_messages) > 0 and prev_messages[0].role == "system":
        query = prev_messages.pop(0).content + query

    history = []
    if len(prev_messages) % 2 == 0:
        for i in range(0, len(prev_messages), 2):
            if prev_messages[i].role == "user" and prev_messages[i+1].role == "assistant":
                history.append([prev_messages[i].content, prev_messages[i+1].content])

    if request.stream:
        generate = predict(query, history, request.model)
        return EventSourceResponse(generate, media_type="text/event-stream")

    response, _ = model.chat(tokenizer, query, history=history)
    choice_data = ChatCompletionResponseChoice(
        index=0,
        message=ChatMessage(role="assistant", content=response),
        finish_reason="stop"
    )

    return ChatCompletionResponse(model=request.model, choices=[choice_data], object="chat.completion")


async def predict(query: str, history: List[List[str]], model_id: str):
    global model, tokenizer

    choice_data = ChatCompletionResponseStreamChoice(
        index=0,
        delta=DeltaMessage(role="assistant"),
        finish_reason=None
    )
    chunk = ChatCompletionResponse(model=model_id, choices=[choice_data], object="chat.completion.chunk")
    yield "{}".format(chunk.model_dump_json(exclude_unset=True))

    current_length = 0

    for new_response, _ in model.stream_chat(tokenizer, query, history):
        if len(new_response) == current_length:
            continue

        new_text = new_response[current_length:]
        current_length = len(new_response)

        choice_data = ChatCompletionResponseStreamChoice(
            index=0,
            delta=DeltaMessage(content=new_text),
            finish_reason=None
        )
        chunk = ChatCompletionResponse(model=model_id, choices=[choice_data], object="chat.completion.chunk")
        yield "{}".format(chunk.model_dump_json(exclude_unset=True))


    choice_data = ChatCompletionResponseStreamChoice(
        index=0,
        delta=DeltaMessage(),
        finish_reason="stop"
    )
    chunk = ChatCompletionResponse(model=model_id, choices=[choice_data], object="chat.completion.chunk")
    yield "{}".format(chunk.model_dump_json(exclude_unset=True))
    yield '[DONE]'



if __name__ == "__main__":
    tokenizer, model = get_model()
    uvicorn.run(app, host='0.0.0.0', port=8000, workers=1)
```

### 容器运行启动脚本

```sh
#!/bin/bash
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
# 启动服务
cd /data/code/glm2
/root/miniconda3/bin/python web_demo.py
```

### 模型替换

直接将微调之后的`pytorch*`带头的几个模型覆盖官方的模型即可。其他文件不用替换（目前测试其他文件替换会出问题）。

# 昇腾910A适配

## 固件驱动安装

本示例以`atlas 300T Pro`服务器为例（npu-smi看到如果显卡型号是910B后面没有其他数字说明是910A系列的，真*910B都是B几）

固件驱动、docker-runtime安装方式参考上面310P3，只有版本的差异

下载地址：https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=19&cann=8.0.RC1.alpha003&driver=1.0.22.alpha

```bash
# 驱动
./Ascend-hdk-910-npu-driver_23.0.2_linux-aarch64.run --full --install-for-all
# 固件
./Ascend-hdk-910-npu-firmware_7.1.0.4.220.run --full
# 重启服务器
reboot
### 先安装docker再安装ascend-docker
./Ascend-docker-runtime_5.0.0_linux-aarch64.run --install
# 重启docker
systemctl restart docker
```

## 制作基础docker镜像

主流程和310P3一样，对应的toolkit和kernels替换成910b支持的版本

下载地址：https://www.hiascend.com/developer/download/community/result?module=pt+cann&pt=6.0.RC1.alpha003&cann=8.0.RC1.alpha003&product=2&model=19

```bash
# 拉取基础镜像
docker pull ubuntu:18.04
# 运行安装环境的空容器
docker run -itd --name test111 ubuntu:18.04 /bin/bash

docker exec -it test111 bash
# 初始化操作（速度慢可以改成清华源，注意选择arm版本）
apt update
# 安装python（如果python安装到其他目录，需要设置PATH环境变量到python的bin目录下）
apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev git wget vim -y
wget https://mirrors.huaweicloud.com/python/3.10.14/Python-3.10.14.tgz
tar zxf Python-3.10.14.tgz && cd Python-3.10.14
./configure --prefix=/usr/local --enable-optimizations
make
make install
# 安装python依赖
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple torch==2.1.0 pyyaml setuptools numpy torch-npu==2.1.0 decorator attrs sse_starlette fastapi uvicorn

# 安装昇腾cann套件（这里有个坑，不要用最新版本的cann套件，容易出问题）
./Ascend-cann-toolkit_8.0.RC1.alpha001_linux-aarch64.run --install --install-for-all --quiet
./Ascend-cann-kernels-910_8.0.RC1.alpha001_linux.run --install --install-for-all --quiet

### 调整环境变量（放到.bashrc业务容器启动的时候source执行会不生效）
vim ~/.profile
# 增加如下配置
export ASCEND_BASE=/usr/local/Ascend
export LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libgomp.so.1
export LD_LIBRARY_PATH=$ASCEND_BASE/driver/lib64/common:$ASCEND_BASE/driver/lib64/driver:$LD_LIBRARY_PATH
source $ASCEND_BASE/ascend-toolkit/set_env.sh

### 安装qwen依赖（查看github上官方demo的requirements.txt）
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

### 清理容器内的所有run包和其他数据
rm -f *.run
rm -rf ~/.cache
history -c
### 生成镜像
docker commit test111 llm:910a
### 导出导入镜像
docker save -o llm.tar llm:910a
docker load -i llm.tar
```

## qwen模型适配及运行

```bash
# 启动调试容器
docker run -itd \
--cap-add=ALL \
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
--name fc-llm-test llm:910a \
/bin/bash
# 验证npu是否可以使用（需要返回一个true，后一个不要报错）
python3 -c "import torch;import torch_npu;print(torch_npu.npu.is_available());print(torch.npu.is_bf16_supported())"

# 下载模型
docker exec -it fc-llm-test bash
cd /data
vim download.py
------download.py
from modelscope.hub.snapshot_download import snapshot_download
model_dir = snapshot_download('qwen/Qwen-7B-Chat', cache_dir='/data/models', revision='v1.1.9')
------download.py
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple modelscope
nohup python3 download.py &
# 下载之后把模型转移到/data/models目录下，方便替换
mv /data/models/qwen/Qwen-7B-Chat/* /data/models
rm -rf /data/models/temp /data/models/qwen
# 下载官方代码（或者浏览器直接下载Qwen-main.zip）
git clone https://github.com/QwenLM/Qwen.git
mv Qwen /data/llm
```

* 适配，代码调整

```py
#### 模型代码修改（模型下载的目录中的modeling_qwen.py）
SUPPORT_CUDA = torch.npu.is_available()
#SUPPORT_BF16 = SUPPORT_CUDA and torch.cuda.is_bf16_supported()
SUPPORT_BF16 = torch.npu.is_bf16_supported()
#SUPPORT_FP16 = SUPPORT_CUDA and torch.cuda.get_device_capability(0)[0] >= 7
SUPPORT_FP16 = True

#### 业务代码修改（hf上的demo）
import torch
import torch_npu
from torch_npu.contrib import transfer_to_npu

npu_num = os.environ.get("NPU_NUM", 0)
torch.npu.set_device(torch.device(f"npu:{npu_num}"))
tokenizer = AutoTokenizer.from_pretrained("/data/models", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("/data/models", trust_remote_code=True).half().npu()
torch.npu.set_compile_mode(jit_compile=False)
model.eval()

#### 业务代码修改（qwen官方github代码）-要删除resume_download=True和device_map
# open_api.py（只需要修改 __name__ 里面的代码）
import transformers
import torch_npu
from torch_npu.contrib import transfer_to_npu
...
...
def _get_args():
    parser = ArgumentParser()
    parser.add_argument(
        '-c',
        '--checkpoint-path',
        type=str,
        default='/data/models', # 这里
        help='Checkpoint name or path, default to %(default)r',
    )
    ...
    ...
    parser.add_argument(
        '--server-name',
        type=str,
        default='0.0.0.0', # 这里
        help=
        'Demo server name. Default: 127.0.0.1, which is only visible from the local computer.'
        ' If you want other computers to access your server, use 0.0.0.0 instead.',
    )
    ...
    ...
    return args
...
...
if __name__ == '__main__':
    args = _get_args()
    npu_num = os.environ.get("NPU_NUM", 0) # here
    torch.npu.set_device(torch.device(f"npu:{npu_num}")) #here
    tokenizer = AutoTokenizer.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ) # here

    if args.api_auth:
        app.add_middleware(BasicAuthMiddleware,
                           username=args.api_auth.split(':')[0],
                           password=args.api_auth.split(':')[1])

    if args.cpu_only:
        device_map = 'cpu'
    else:
        device_map = 'auto'

    model = AutoModelForCausalLM.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ).half().npu() # here
    torch.npu.set_compile_mode(jit_compile=False) # here
    model.eval() # here

    model.generation_config = GenerationConfig.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ) # here
    uvicorn.run(app, host=args.server_name, port=args.server_port, workers=1)
```

* 最后启动业务容器

```bash
### start.sh----
#!/bin/bash
source /root/.profile
cd /data/llm
python3 openai_api.py
#--------------

### 启动容器
docker run -d \
-e NPU_NUM=2 \
--cap-add=ALL \
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
-p 8002:8000 \
--name fc-llm-2 ifuncun/llm:910a-3 \
bash /data/llm/start.sh

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"glm3", "messages":[{"role":"user", "content":"你好"}], "stream":true}' http://127.0.0.1:8002/v1/chat/completions
```

# 昇腾910B适配

服务器型号：`altlas 800t A2`

## 固件驱动

参考910A的方式去安装

```bash
# 驱动
./Ascend-hdk-910b-npu-driver_23.0.3_linux-aarch64.run --full --install-for-all
# 固件
./Ascend-hdk-910b-npu-firmware_7.1.0.5.220.run --full
# 重启服务器
reboot
### 先安装docker再安装ascend-docker
./Ascend-docker-runtime_5.0.0_linux-aarch64.run --install
# 重启docker
systemctl restart docker
```

## 制作基础docker镜像

* 注意如果是mindspore的话，需要确认和cann的对应关系：https://www.mindspore.cn/versions#ascend%E9%85%8D%E5%A5%97%E8%BD%AF%E4%BB%B6%E5%8C%85

```bash
# 拉取基础镜像
docker pull ubuntu:18.04
# 运行安装环境的空容器
docker run -itd --name test111 ubuntu:18.04 /bin/bash

docker exec -it test111 bash
# 初始化操作（速度慢可以改成清华源，注意选择arm版本）
apt update
# 安装python（如果python安装到其他目录，需要设置PATH环境变量到python的bin目录下）
apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev git wget vim -y
wget https://mirrors.huaweicloud.com/python/3.9.18/Python-3.9.18.tgz
tar zxf Python-3.9.18.tgz && cd Python-3.9.18
./configure --prefix=/usr/local --enable-optimizations
make
make install

# 安装昇腾cann套件（这里有个坑，不要用最新版本的cann套件，容易出问题）
./Ascend-cann-toolkit_7.0.0_linux-aarch64.run --install --install-for-all --quiet
./Ascend-cann-kernels-910b_7.0.0_linux.run --install --install-for-all --quiet

### 调整环境变量（放到.bashrc业务容器启动的时候source执行会不生效）
vim ~/.profile
# 增加如下配置
export ASCEND_BASE=/usr/local/Ascend
export LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libgomp.so.1
export LD_LIBRARY_PATH=$ASCEND_BASE/driver/lib64/common:$ASCEND_BASE/driver/lib64/driver:$LD_LIBRARY_PATH
source $ASCEND_BASE/ascend-toolkit/set_env.sh

### 清理容器内的所有run包和其他数据
rm -f *.run
rm -rf ~/.cache
history -c
### 生成镜像
docker commit test111 llm:temp
```

## glm3模型适配

**mindspore方式：**

参考资料：https://www.mindspore.cn/install
mindspore和cann对应关系：https://www.mindspore.cn/versions#ascend%E9%85%8D%E5%A5%97%E8%BD%AF%E4%BB%B6%E5%8C%85

```bash
# 启动调试容器(将模型和代码都放到data目录下)
docker run -itd \
--cap-add=ALL \
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
--name test222 llm:temp \
/bin/bash
# 安装ai套件
pip3 uninstall te topi hccl -y
pip3 install sympy
pip3 install /usr/local/Ascend/ascend-toolkit/latest/lib64/te-*-py3-none-any.whl
pip3 install /usr/local/Ascend/ascend-toolkit/latest/lib64/hccl-*-py3-none-any.whl
# 执行如下代码，如果未报错且输出了mindspore版本，证明mindspore安装成功
python3 -c "import mindspore;mindspore.set_context(device_target='Ascend');mindspore.run_check()"

# 安装mindformers-注意修改sh脚本中的python和pip版本(https://gitee.com/mindspore/mindformers)
git clone -b dev https://gitee.com/mindspore/mindformers.git
cd mindformers
bash build.sh
# 如果有问题则需要安装低版本的mindformers
wget https://gitee.com/mindspore/mindformers/releases/download/v1.0.0/mindformers-1.0.0-py3-none-any.whl
pip3 install mindformers-1.0.0-py3-none-any.whl

### 安装依赖（查看github上官方demo的requirements.txt）
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

**torch方式:**

```bash
# 安装python依赖
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple torch==2.1.0 pyyaml setuptools numpy decorator attrs sse_starlette fastapi uvicorn
# 安装torch-npu
wget https://gitee.com/ascend/pytorch/releases/download/v5.0.0-pytorch2.1.0/torch_npu-2.1.0-cp39-cp39-manylinux_2_17_aarch64.manylinux2014_aarch64.whl
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple torch_npu-2.1.0-cp39-cp39-manylinux_2_17_aarch64.manylinux2014_aarch64.whl
# 验证npu是否可以使用（需要返回一个true，后一个不要报错）
python3 -c "import torch;import torch_npu;print(torch_npu.npu.is_available());print(torch.npu.is_bf16_supported())"

# 下载模型
cd /data
vim download.py
------download.py
from modelscope.hub.snapshot_download import snapshot_download
model_dir = snapshot_download('qwen/Qwen-7B-Chat', cache_dir='/data/models')
------download.py
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple modelscope
nohup python3 download.py &
# 下载之后把模型转移到/data/models目录下，方便替换
mv /data/models/qwen/Qwen-7B-Chat/* /data/models
rm -rf /data/models/temp /data/models/qwen
# 下载官方代码（或者浏览器直接下载Qwen-main.zip）
git clone https://github.com/QwenLM/Qwen.git
mv Qwen /data/llm

#### 模型代码修改（模型下载的目录中的modeling_qwen.py）
SUPPORT_CUDA = torch.npu.is_available()
SUPPORT_BF16 = SUPPORT_CUDA and torch.npu.is_bf16_supported()
SUPPORT_FP16 = True

#### 业务代码修改（hf上的demo）
import torch
import torch_npu
from torch_npu.contrib import transfer_to_npu

npu_num = os.environ.get("NPU_NUM", 0)
torch.npu.set_device(torch.device(f"npu:{npu_num}"))
torch.npu.set_compile_mode(jit_compile=False)

tokenizer = AutoTokenizer.from_pretrained("/data/models", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("/data/models", trust_remote_code=True).npu().eval()

#### 业务代码修改（qwen官方github代码）-要删除resume_download=True和device_map
# open_api.py
import transformers
import torch_npu
from torch_npu.contrib import transfer_to_npu
npu_num = os.environ.get("NPU_NUM", 0)
torch.npu.set_device(torch.device(f"npu:{npu_num}"))
torch.npu.set_compile_mode(jit_compile=False)

...
...
def _get_args():
    parser = ArgumentParser()
    parser.add_argument(
        '-c',
        '--checkpoint-path',
        type=str,
        default='/data/models', # 这里
        help='Checkpoint name or path, default to %(default)r',
    )
    ...
    ...
    parser.add_argument(
        '--server-name',
        type=str,
        default='0.0.0.0', # 这里
        help=
        'Demo server name. Default: 127.0.0.1, which is only visible from the local computer.'
        ' If you want other computers to access your server, use 0.0.0.0 instead.',
    )
    ...
    ...
    return args
...
...
if __name__ == '__main__':
    args = _get_args()
    tokenizer = AutoTokenizer.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ) # here

    if args.api_auth:
        app.add_middleware(BasicAuthMiddleware,
                           username=args.api_auth.split(':')[0],
                           password=args.api_auth.split(':')[1])

    if args.cpu_only:
        device_map = 'cpu'
    else:
        device_map = 'auto'

    model = AutoModelForCausalLM.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ).half().npu().eval() # here

    model.generation_config = GenerationConfig.from_pretrained(
        args.checkpoint_path,
        trust_remote_code=True,
    ) # here
    uvicorn.run(app, host=args.server_name, port=args.server_port, workers=1)
```

## glm3运行

```bash
### 清理容器内的所有run包和其他数据
rm -f *.run
rm -rf ~/.cache
history -c
### 生成镜像
docker commit test222 llm:910b
### start_glm3.sh----
#!/bin/bash
source /root/.profile
cd /data/code/script
python3 ../model/glm3/run_chat_server.py
#--------------
### 启动容器
docker run -d \
-e NPU_NUM=2 \
--cap-add=ALL \
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
-p 8002:8000 \
--name fc-llm-2 ifuncun/llm:910b \

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"glm3", "messages":[{"role":"user", "content":"写一篇《关于春节放假的通知》,字数500以内。"}], "stream":true}' http://127.0.0.1:8002/v1/chat/completions
### 导出导入镜像
docker save -o llm.tar ifuncun/llm:910b
docker load -i llm.tar
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

* `RuntimeError: Failed to set compile option ACL_OP_COMPILER_CACHE_MODE, result = 500001, set value enable`，应该是固件驱动和对应的cann和pytorch的版本不对应（CANN版本太新，可以降低版本试试）

* 报错信息中出现：`ASCEND_LAUNCH_BLOCKING=1`，则设置环境变量`export ASCEND_LAUNCH_BLOCKING=1`，然后重新运行，会提示详细报错信息，一般是python依赖库，直接根据提示安装对应的库即可。

* `torch.npu.mem_get_info`报错找不到，是因为cann官方没有适配mem_get_info,可以打开`/usr/local/lib/python3.10/site-packages/accelerate/utils/modeling.py`文件, 注释掉`798`行代码，然后改成如下

```py
#max_memory = {i: torch.npu.mem_get_info(i)[0] for i in range(torch.npu.device_count())}
max_memory = {0: 33554432000,
                        1: 33554432000,
                        2: 33554432000,
                        3: 33554432000,
                        4: 33554432000,
                        5: 33554432000,
                        6: 33554432000,
                        7: 33554432000}
```