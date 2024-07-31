# 昇腾官方资源

npu-smi看到如果显卡型号是910B后面没有其他数字说明是910A系列的，真*910B都是B几

* 注意：先到资源中心选择对应的服务器型号（一般是加速卡），然后到固件驱动中心选择对应的服务器型号和CANN版本（和资源下载中心的一致）
* 固件驱动选择中心：https://www.hiascend.com/hardware/firmware-drivers/community
* docker-runtime: https://gitee.com/ascend/ascend-docker-runtime/releases
* （toolkit、torch、kernels等）资源下载中心：https://www.hiascend.com/developer/download。实际地址：https://www.hiascend.com/developer/download/community/result?module=pt+cann&product=2&model=17
* cann安装指南：https://www.hiascend.com/document/detail/zh/CANNCommunityEdition/80RC1alpha003/quickstart/quickstart/quickstart_18_0004.html
* pytorch算子优化：https://www.hiascend.com/document/detail/zh/CANNCommunityEdition/80RC1alpha003/devguide/moddevg/ptmigr/AImpug_0074.html

* 注意2:mindspore的方式安装一定要cann、mindspore、mindformers版本匹配，参考下面的对应关系
* mindspore官网：https://www.mindspore.cn/install/
* mindspore和固件驱动对应关系：https://www.mindspore.cn/versions
* mindformers官方文档：https://mindformers.readthedocs.io/zh-cn/latest/Version_Match.html
* mindformers-glm3适配教程：https://mindformers.readthedocs.io/zh-cn/latest/docs/model_cards/glm3.html
* mindformers-mindspore对应关系（版本查看对应tag标签）：https://gitee.com/mindspore/mindformers/tree/v1.1.0/

* mindie官方文档：https://www.hiascend.com/document/detail/zh/mindie/1.0.RC1/releasenote/releasenote_0001.html
* mindie-pytorch-cann对应关系包：https://www.hiascend.com/developer/download/community/result?module=ie%2Bpt%2Bcann

## 注意事项

* 如果使用了`torch_npu`需要引入`acl，acl`中依赖了`decorator、psutil`，一定要在做镜像的时候加上

## 固件驱动安装流程

**注意选择版本需要参考下面具体型号。**

第一次安装或者已经卸载老的固件驱动，需按照`驱动 > 固件`的顺序安装驱动固件。

```bash
# 【经过试验，可以不用创建用户】root登陆用户之后，创建普通用户
groupadd HwHiAiUser
useradd -g HwHiAiUser -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bash
# 若用户后续需使用从AscendHub拉取的容器镜像，则请用户执行如下命令创建uid和gid为1000的驱动运行用户HwHiAiUser。
groupadd -g 1000 HwHiAiUser
useradd -g HwHiAiUser -u 1000 -d /home/HwHiAiUser -m HwHiAiUser -s /bin/bash

# 将下载的驱动、固件、ascend-docker等修改权限并安装
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

## 基础镜像制作流程

这里需要用到cann的套件

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
# 【源码】安装python（如果python安装到其他目录，需要设置PATH环境变量到python的bin目录下）
apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev \
xz-utils tk-dev libffi-dev liblzma-dev git wget vim -y
wget https://mirrors.huaweicloud.com/python/3.9.19/Python-3.9.19.tgz
tar zxf Python-3.9.19.tgz && cd Python-3.9.19
./configure --prefix=/usr/local --enable-optimizations
make
make install

### 安装torch依赖【这个只有在torhc_npu版本需要执行】
pip install -i https://pypi.douban.com/simple pyyaml wheel typing_extensions
# 安装pytorch【这里要特别注意，torch版本要和Ascend-cann-llm_7.0.0_linux-aarch64_torch1.11.0-abi0.tar.gz中的一样】
pip install -i https://pypi.douban.com/simple torch==2.1.0
# 下载torch_npu，https://gitee.com/ascend/pytorch/releases，一定要选择对应版本
pip install torch_npu-2.0.1.post1-cp39-cp39-linux_aarch64.whl
# 若返回True则说明PyTorch安装成功
python3 -c "import torch;import torch_npu;print(torch_npu.npu.is_available())"

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

#### 下载安装加速库【可选】
# 确认下载使用abi0还是abi1包
# 在python环境下运行如下两行。若返回True，则flag=1；若返回False则flag=0
python
import torch
torch.compiled_with_cxx11_abi()
exit()
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

#### 调整环境变量
vim ~/.profile ~/.bashrc
## 增加如下配置【普通】
export ASCEND_BASE=/usr/local/Ascend
export LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libgomp.so.1   # 这个配置需要慎重，可能会导致系统命令无法正常使用，建议放到启动脚本里
export LD_LIBRARY_PATH=$ASCEND_BASE/driver/lib64/common:$ASCEND_BASE/driver/lib64/driver:$LD_LIBRARY_PATH
source $ASCEND_BASE/ascend-toolkit/set_env.sh
## 增加如下配置【langchain】
# 源码安装
export LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libgomp.so.1:/usr/local/lib/python3.9/site-packages/scikit_learn.libs/libgomp-d22c30c5.so.1.0.0:/usr/local/lib/python3.9/site-packages/torch.libs/libgomp-6e1a1d1b.so.1.0.0
# miniconda3
export LD_PRELOAD=/root/miniconda3/lib/libgomp.so.1:/root/miniconda3/lib/python3.9/site-packages/scikit_learn.libs/libgomp-d22c30c5.so.1.0.0:/root/miniconda3/lib/python3.9/site-packages/torch.libs/libgomp-6e1a1d1b.so.1.0.0
export ASCEND_BASE=/usr/local/Ascend
export LD_LIBRARY_PATH=$ASCEND_BASE/driver/lib64/common:$ASCEND_BASE/driver/lib64/driver:$LD_LIBRARY_PATH
source $ASCEND_BASE/ascend-toolkit/set_env.sh

# 下面执行看情况【可选】
source $ASCEND_BASE/atb/set_env.sh
if [ -f "/data/code/set_env.sh" ]; then
  source "/data/code/set_env.sh"
fi

### 清理容器内的所有run包和其他数据
rm -rf *.run Python-3.9.19* ~/.cache

### 生成镜像
docker commit test111 llm:310p
### 导出导入镜像
docker save -o llm.tar llm:310p
docker load -i llm.tar
```

## 镜像运行命令

```bash
# 这里千万要注意不要用--device=/dev/davinci0映射设备，直接用--privileged=true，就可以多容器共享显卡
docker run -d --privileged=true --device=/dev/davinci_manager --device=/dev/devmm_svm --device=/dev/hisi_hdc -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi -v /usr/local/Ascend/driver:/usr/local/Ascend/driver -v /etc/localtime:/etc/localtime -v $PWD:/data -w /data -p 18130:18130 --name langchain-0 llm-lc:910a-0710 /bin/bash /data/start.sh
```

## 昇腾310P3适配（300I DUO）

### torch_npu

* 固件驱动下载（1.0.22.alpha）：https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=17&cann=7.0.0.beta1&driver=1.0.22.alpha
* CANN套件-toolkit（7.0.0.beta1）：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%207.0.0/Ascend-cann-toolkit_7.0.0_linux-aarch64.run
* CANN套件-kernel：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%207.0.0/Ascend-cann-kernels-310p_7.0.0_linux.run

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

# 做完启动脚本start.sh之后生产环境执行如下
docker run -d \
--cap-add=ALL \   # 这个参数可以选择执行，如果有报错权限问题可以加上
-e NPU_NUM=3 \   # 根据业务需要添加（如果是映射单卡。代码可以默认使用0卡即可，不用加这个参数）
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /usr/local/dcmi:/usr/local/dcmi \   # 可以去掉
-v /etc/ascend_install.info:/etc/ascend_install.info \    # 可以去掉
-v /etc/vnpu.cfg:/etc/vnpu.cfg \      # 可以去掉
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

### chatglm2官方代码适配修改

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

### 容器运行启动脚本-start.sh

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

## 昇腾910A适配（300T Pro）

### glm3适配（ms）

* 固件驱动下载（1.0.23.alpha）：https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=19&cann=8.0.RC1.beta1&driver=1.0.23.alpha
* CANN套件-toolkit（8.0.RC1.beta1）：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%208.0.RC1/Ascend-cann-toolkit_8.0.RC1_linux-aarch64.run
* CANN套件-kernel：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%208.0.RC1/Ascend-cann-kernels-910_8.0.RC1_linux.run
* MindFormers（r1.1.0）：直接pip安装 `mindformers==1.1.0`或者 https://www.mindspore.cn/versions#2.3.0-rc2:~:text=mindformers%2D1.1.0%2Dpy3%2Dnone%2Dany.whl
* MindSpore（2.3.0rc2）：https://www.mindspore.cn/versions#2.3.0-rc2参考下载对应版本，例如python3.9地址：https://ms-release.obs.cn-north-4.myhuaweicloud.com/2.3.0rc2/MindSpore/unified/aarch64/mindspore-2.3.0rc2-cp39-cp39-linux_aarch64.whl


### qwen模型适配及运行（trochnpu）

```bash
# 启动调试容器
docker run -itd \
-e NPU_NUM = 1 \
--privileged=true \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /data:/data \
--name fc-llm-test llm:temp \
/bin/bash

# 安装python依赖
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple torch==2.1.0 pyyaml setuptools numpy torch-npu==2.1.0 decorator attrs sse_starlette fastapi uvicorn
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
### 安装qwen依赖（查看github上官方demo的requirements.txt）
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
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


#### embedding模型
import acl
import torch
import torch_npu
from torch_npu.contrib import transfer_to_npu

torch.npu.set_device(torch.device("npu:0"))
torch.npu.set_compile_mode(jit_compile=False)
npucontext,ret = acl.rt.get_context()
...
...
current_path = os.path.abspath(__file__)
father_path = os.path.dirname(os.path.dirname(os.path.dirname(current_path)))
model_name = father_path+"/models/embedding_models/gte-base-zh"
model_kwargs = {'device': 'npu'}
embeddings = HuggingFaceEmbeddings(model_name=model_name, model_kwargs=model_kwargs)
...
...
@app.route('/aiwriter_docQA', methods=['POST'])
    def get_doc_answer():
        acl.rt.set_context(npucontext)
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
--name fc-llm-2 llm:910a-3 \
bash /data/llm/start.sh

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"glm3", "messages":[{"role":"user", "content":"你好"}], "stream":true}' http://127.0.0.1:8002/v1/chat/completions
```

### glm2模型适配及运行（mindspore）

```bash
# 启动调试容器(将模型和代码都放到data目录下)
docker run -itd \
-e NPU_NUM = 1 \
--privileged=true \
--device=/dev/davinci0 \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /data2:/data \
--name test222 llm:temp \
/bin/bash
# 安装ai套件
pip3 uninstall te topi hccl -y
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple sympy
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple /usr/local/Ascend/ascend-toolkit/latest/lib64/te-*-py3-none-any.whl
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple /usr/local/Ascend/ascend-toolkit/latest/lib64/hccl-*-py3-none-any.whl

# 正常安装，到这里选择对应版本的whl包（包含mindformers）：https://www.mindspore.cn/versions#2214
wget https://ms-release.obs.cn-north-4.myhuaweicloud.com/2.2.14/MindSpore/unified/aarch64/mindspore-2.2.14-cp39-cp39-linux_aarch64.whl
wget https://ms-release.obs.cn-north-4.myhuaweicloud.com/2.2.14/MindFormers/any/mindformers-1.0.2-py3-none-any.whl
pip3 install  -i https://pypi.tuna.tsinghua.edu.cn/simple mindspore-2.2.14-cp39-cp39-linux_aarch64.whl mindformers-1.0.0-py3-none-any.whl 
# 执行如下代码，如果未报错且输出了mindspore版本，证明mindspore安装成功
# 注意需确认显卡上没有运行其他程序再执行
python3 -c "import mindspore;mindspore.set_context(device_id=0,device_target='Ascend');mindspore.run_check()"
# 【注意】如果程序运行的时候有问题则需要安装低版本的mindformers
wget https://gitee.com/mindspore/mindformers/releases/download/v1.0.0/mindformers-1.0.0-py3-none-any.whl
pip3 install mindformers-1.0.0-py3-none-any.whl
# 【不推荐】源码安装mindformers-注意修改sh脚本中的python和pip版本(https://gitee.com/mindspore/mindformers)
git clone -b r1.0 https://gitee.com/mindspore/mindformers.git
cd mindformers
bash build.sh

### 安装依赖(根据项目定)
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 保存镜像
docker commit test222 llm:910a-ms

### 启动容器
docker run -d \
-e NPU_NUM = 1 \
--privileged=true \
--device=/dev/davinci0 \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /data2:/data \
-p 8005:8999 \
--name fc-llm-5 llm:910a-ms \
bash /data/glm2_infer_ascend/start.sh

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"chat-glm2", "messages":[{"role":"user", "content":"写一篇《关于春节放假的通知》,字数500以内。"}], "stream":true}' http://127.0.0.1:8005/v1/chat/completions
### 导出导入镜像
docker save -o llm.tar llm:910a-ms
docker load -i llm.ta
```

## 昇腾910B适配（800T A2）

### 固件驱动

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

### glm3模型适配-ms

* 固件驱动下载（1.0.23.alpha）：https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=19&cann=8.0.RC1.beta1&driver=1.0.23.alpha
* CANN套件-toolkit（8.0.RC1.beta1）：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%208.0.RC1/Ascend-cann-toolkit_8.0.RC1_linux-aarch64.run
* CANN套件-kernel：https://ascend-repo.obs.cn-east-2.myhuaweicloud.com/CANN/CANN%208.0.RC1/Ascend-cann-kernels-910b_8.0.RC1_linux.run
* MindFormers（1.1.0）：直接pip安装 `mindformers==1.1.0`或者 https://www.mindspore.cn/versions#2.3.0-rc2:~:text=mindformers%2D1.1.0%2Dpy3%2Dnone%2Dany.whl
* MindSpore（2.3.0rc2）：https://www.mindspore.cn/versions#2.3.0-rc2参考下载对应版本，例如python3.9地址：https://ms-release.obs.cn-north-4.myhuaweicloud.com/2.3.0rc2/MindSpore/unified/aarch64/mindspore-2.3.0rc2-cp39-cp39-linux_aarch64.whl

**mindspore方式：**

```bash
# 启动调试容器(将模型和代码都放到data目录下)
docker run -itd \
--NPU_NUM=1 \
--privileged=true \
--device=/dev/davinci0 \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /data:/data \
--name test222 llm:temp \
/bin/bash
# 安装ai套件
pip3 uninstall te topi hccl -y
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple sympy
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple /usr/local/Ascend/ascend-toolkit/latest/lib64/te-*-py3-none-any.whl
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple /usr/local/Ascend/ascend-toolkit/latest/lib64/hccl-*-py3-none-any.whl


# 正常安装，到这里选择对应版本的whl包（包含mindformers）：https://www.mindspore.cn/versions#2214
pip3 install  -i https://pypi.tuna.tsinghua.edu.cn/simple mindspore-2.3.0rc2-cp39-cp39-linux_aarch64.whl mindformers-1.1.0-py3-none-any.whl 
# 执行如下代码，如果未报错且输出了mindspore版本，证明mindspore安装成功
# 注意需确认显卡上没有运行其他程序再执行
python3 -c "import mindspore;mindspore.set_context(device_id=0,device_target='Ascend');mindspore.run_check()"
# 【不推荐】源码安装mindformers-注意修改sh脚本中的python和pip版本(https://gitee.com/mindspore/mindformers)
git clone https://gitee.com/mindspore/mindformers.git
cd mindformers
bash build.sh

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

### glm3运行

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
--NPU_NUM=1 \
--privileged=true \
--device=/dev/davinci0 \
--device=/dev/davinci_manager \
--device=/dev/devmm_svm \
--device=/dev/hisi_hdc \
-v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
-v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
-v /data:/data \
-p 8002:8000 \
--name fc-llm-2 llm:910b \

# 测试
curl -X POST -H 'Content-Type: application/json' -d '{"model":"glm3", "messages":[{"role":"user", "content":"写一篇《关于春节放假的通知》,字数500以内。"}], "stream":true}' http://127.0.0.1:8002/v1/chat/completions
### 导出导入镜像
docker save -o llm.tar llm:910b
docker load -i llm.tar
```

### mindie适配

* 固件驱动下载（1.0.23.alpha）：`Ascend-hdk-910b-npu-driver_24.1.rc1_linux-aarch64.run`、`Ascend-hdk-910b-npu-firmware_7.1.0.6.220.run`,https://www.hiascend.com/hardware/firmware-drivers/community?product=2&model=19&cann=8.0.RC1.beta1&driver=1.0.23.alpha
* 镜像、使用参考资料地址：阿里云盘
* 目前只支持`safetensors`格式的模型

模型调整：
* 找到模型目录，修改里面config.json，倒数第五、六行， `torch_dtype`将`bflow16`改成`flow16`
* 找到`tokenizer_config.json`，增加`chat_template`配置 `"chat_template": "{% for message in messages %}{% if loop.first and messages[0]['role'] != 'system' %}{{ '<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n' }}{% endif %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}",`


`mindie-service`主要修改``配置文件`config.json`:

```json
{
    "OtherParam":
    {
        "ResourceParam" :
        {
            "cacheBlockSize" : 128,
            "preAllocBlocks" : 4
        },
        "LogParam" :
        {
            "logLevel" : "Info",
            "logPath" : "/logs/mindservice.log" // 日志文件保存位置
        },
        "ServeParam" :
        {
            "ipAddress" : "0.0.0.0", // ip地址
            "port" : 1026, // 对外提供服务的端口
            "maxLinkNum" : 300,
            "httpsEnabled" : false,
            "tlsCaPath" : "security/ca/",
            "tlsCaFile" : ["ca.pem"],
            "tlsCert" : "security/certs/server.pem",
            "tlsPk" : "security/keys/server.key.pem",
            "tlsPkPwd" : "security/pass/mindie_server_key_pwd.txt",
            "kmcKsfMaster" : "tools/pmt/master/ksfa",
            "kmcKsfStandby" : "tools/pmt/standby/ksfb",
            "tlsCrl" : "security/certs/server_crl.pem"
        }
    },
    "WorkFlowParam":
    {
        "TemplateParam" :
        {
            "templateType": "Standard",
            "templateName" : "Standard_llama",
            "pipelineNumber" : 1
        }
    },
    "ModelDeployParam":
    {
        "maxSeqLen" : 8192,  // 这里根据模型的最大上下文设置
        "npuDeviceIds" : [[0,1,2,3]], // 使用哪些卡
        "ModelParam" : [
            {
                "modelInstanceType": "Standard",
                "modelName" : "qwen",
                "modelWeightPath" : "/home/aifirst/zhiyuan/officialgpt_online/model", // 离线模型地址
                "worldSize" : 4, // 上面配置的卡的总数
                "cpuMemSize" : 5,
                "npuMemSize" : 8,
                "backendType": "atb"
            }
        ]
    },
    "ScheduleParam":
    {
        "maxPrefillBatchSize" : 50,
        "maxPrefillTokens" : 8192, // 这个参数和上面的maxseqlen一致
        "prefillTimeMsPerReq" : 150,
        "prefillPolicyType" : 0,

        "decodeTimeMsPerReq" : 50,
        "decodePolicyType" : 0,

        "maxBatchSize" : 200,
        "maxIterTimes" : 4096, // 这里需要注意，请求的时候设置的max_tokens不能超过这个值
        "maxPreemptCount" : 200,
        "supportSelectBatch" : false,
        "maxQueueDelayMicroseconds" : 5000
    }
}
```

```bash
# mindie容器启动命令
docker run -d --restart=always --privileged=true --device=/dev/davinci_manager --device=/dev/devmm_svm --device=/dev/hisi_hdc -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi -v /usr/local/Ascend/driver:/usr/local/Ascend/driver -v /etc/localtime:/etc/localtime -v $PWD:/data -w /data -p 8000:1026 --name fc-llm mindie_service:1.0.T56 bash start.sh

#### start.sh 内容如下
#!/bin/bash

source /usr/local/Ascend/ascend-toolkit/set_env.sh
source /usr/local/Ascend/mindie/set_env.sh
source /usr/local/Ascend/mindie/latest/mindie-service/set_env.sh
source /opt/atb-models/set_env.sh
# 用上面的config.json覆盖默认的
/bin/cp -f /data/config.json /usr/local/Ascend/mindie/latest/mindie-service/conf
cd /usr/local/Ascend/mindie/latest/mindie-service
# 后台启动
nohup ./bin/mindieservice_daemon 2>&1 &
tail -f ./logs/mindservice.log
```

## 重排-嵌入模型demo

```py
#### 重排reranker
from fastapi import FastAPI
import torch
import numpy
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from typing import List, Dict
from pydantic import BaseModel
import acl
import torch_npu
from torch_npu.contrib import transfer_to_npu

# 初始化NPU设备
torch.npu.set_device(torch.device("npu:0"))
torch.npu.set_compile_mode(jit_compile=False)
npucontext, _ = acl.rt.get_context()

app = FastAPI()

model_name = "/data/models/bge-reranker-large"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

device = torch.device("npu")
model.to(device)

class RerankRequest(BaseModel):
    query: str
    documents: List[str]

def rerank(query: str, documents: List[str]) -> List[Dict[str, float]]:
    inputs = tokenizer([query] * len(documents), documents, return_tensors="pt", padding=True, truncation=True).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        scores = outputs.logits.squeeze().cpu().numpy().flatten().tolist()

    ranked_docs = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)

    return [{"document": doc, "score": score} for doc, score in ranked_docs]

@app.post("/rerank")
async def rerank_endpoint(request: RerankRequest):
    acl.rt.set_context(npucontext)
    query = request.query
    documents = request.documents

    results = rerank(query, documents)

    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

## 测试
curl -X POST -H 'Content-Type: application/json' -d  '{"query": "自然语言处理是什么？", "documents": ["自然语言处理是计算机科学的一个领域。"]}' http://localhost:8000/rerank

#### 嵌入模型embed
from fastapi import FastAPI
import torch
import numpy as np
from transformers import AutoModel, AutoTokenizer
from typing import List, Dict
from pydantic import BaseModel
import acl
import torch_npu
from torch_npu.contrib import transfer_to_npu

app = FastAPI()

torch.npu.set_device(torch.device("npu:0"))
torch.npu.set_compile_mode(jit_compile=False)
npucontext, _ = acl.rt.get_context()

model_name = "/data/models/bge-base-zh-v1.5"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

device = torch.device("npu")
model.to(device)

class EmbeddingRequest(BaseModel):
    texts: List[str]

def generate_embeddings(texts: List[str]) -> List[np.ndarray]:
    inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy()

    return embeddings.tolist()

@app.post("/embeddings")
async def embedding_endpoint(request: EmbeddingRequest):
    acl.rt.set_context(npucontext)
    texts = request.texts

    embeddings = generate_embeddings(texts)

    return {"embeddings": embeddings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

## 测试
curl -X POST -H "Content-Type: application/json" -d '{"texts": ["这是一个测试句子。", "这是另一个不同的句子。"]}' http://localhost:8000/embeddings
```

## 昇腾适配问题列表

* 碰到`生成内容重复`或者`生成内容异常`，通常需要调整配置文件中的推理超参数解决，配置文件一般是`config.yaml`或者`run_chat_glm2_6b.yaml`

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

* `ImportError: /usr/local/gcc7.3.0/lib64/libgomp.so.1: cannot allocate memory in static TLS block`，其他路径的提示也一样的方式处理

```bash
# 查看gomp库
find / -name 'libgomp.so.1'
# 替换成系统自带的gomp库
export LD_PRELOAD=/usr/local/gcc7.3.0/lib64/libgomp.so.1
# 还有其他的gomp库
export LD_PRELOAD=/usr/local/gcc7.3.0/lib64/libgomp.so.1:/usr/local/lib/python3.9/site-packages/scikit_learn.libs/libgomp-d22c30c5.so.1.0.0:/usr/local/lib/python3.9/site-packages/torch.libs/libgomp-6e1a1d1b.so.1.0.0
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

* 运行mindspore包错：`cannot import name 'swap_cache' from 'mindspore._c_expression'`，直接注释代码

```bash
vim /usr/local/lib/python3.9/site-packages/mindformers/model_runner.py

# 注释掉包错那行代码，以及 swap_cache 相关的代码
```

* `module 'mindspore' has no attribute 'hal'`

【推荐】出现这个问题一般是 mindformers、mindspore、cann、固件驱动的版本不匹配，可以参考mindformers的gitee仓库对应的版本去安装其他依赖项。

【不推荐】上面问题还有一个特殊处理方式，例如 `glm3` 需要设置 `use_past=False` ，但是这个设置推理速度会变得很慢。

* `Get soc name failed`或者`dcmi module initialize failed. ret is -8005`一般是容器内找不到硬件了。需要在运行的时候设置 `--privileged=true` 或者`--device=/dev/davinci0 `

* 启动多个容器，第一个正常，第二个就提示包错。一般都是显卡被其他设备占用了。是因为通过 `--device=/dev/davinci4` 映射了单张卡导致的，可以不设置davinci4，直接设置`--privileged=true`这样就可以使用所有卡并且不冲突了。

* `aclnnRsubs failed, detail:EZ9999`，报这个错一般是因为没有装cann的kernel文件，需要重新安装一下kernel.run文件

* `python openai_api.py`后，调用报错：`dumps_kwargs keyword arguments are no longer supported`

```bash
# 将包错文件中的
chunk.json(exclude_unset=True, ensure_ascii=False)
# 替换为
chunk.model_dump_json(exclude_unset=True,exclude_none=True)
```

* 报错`max_length`不能大于`seq_length`，则需要修改模型的 `yaml` 文件，将 `seq_length` 改大。

* mindie报错：`list index out of range、status: error, npuBlockNum:0,cpubloknum:0`

找到模型目录，修改里面config.json，倒数第五、六行， 将`bflow16`改成`flow16`

* mindie报错：`缺少chat_template`，则需要在模型目录下的`tokenizer_config.json`增加`chat_template`的配置

* mindie报错：`vcom：recv fin packet, socket fd 22. errono:0`是因为`curl`等请求中没有设置`max_tokens`或者这个值比较小被截断了
