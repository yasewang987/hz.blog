# 大模型基本概念

* `Temperature`：temperature 的参数值越小，模型就会返回越确定的一个结果。如果调高该参数值，大语言模型可能会返回更随机的结果，也就是说这可能会带来更多样化或更具创造性的产出。
* `Top_p`：【改变一个就行，不用都调整】核心采样，使用 top_p（与 temperature 一起称为核采样的技术），可以用来控制模型返回结果的真实性。如果你需要准确和事实的答案，就把参数值调低。如果你想要更多样化的答案，就把参数值调高一些。

* `batch size`：每批训练数据的数量。
* `epoch`：一个完整的迭代过程，即一次完整的训练。
* `batch`：一组训练数据

* `Pre-Training`：二次预训练(增量预训练)，可以在原来的预训练模型的基础上，对于之前没学过的知识进行再学习，是处于预训练和微调之间的过渡阶段。可以利用`小规模、高质量的领域数据`（GB级别），可以通过`lora`方式训练
* `Supervised Fine-Tuning	`：指令监督微调
* `Reward Modeling`：奖励模型训练
* `PPO Training`：近端策略优化 (`Proximal Policy Optimization，PPO`) 微调初始 LM 的部分或全部参数，一定需要配合 `RM奖励模型` 和 `SFT` 去强化学习
* `DPO Training`：替代`PPO`的，去掉了`RM model`，只需要 `SFT model`，提高速度，降低显存

16 位浮点精度（`FP16`）的模型，推理所需`显存`（以 `GB` 为单位）约为`模型参数量`（以 `10 亿`为单位）的两倍，Llama 2 7B（70 亿）对应需要约 14GB 显存以进行推理

**模型答案评估：**

* 一致性：在给定上下文的情况下，比较实际情况与预测之间的一致性。
* 相关性：衡量答案在上下文中如何有效地回答问题的主要方面。
* 真实性：定义了答案是否逻辑上符合上下文中包含的信息，并提供一个整数分数来确定答案的真实性。

## 学习率设置

![1](http://cdn.go99.top/docs/code/python/ai1.webp)

* 当学习率设置的较小，训练收敛较慢，需要更多的epoch才能到达一个较好的局部最小值；
* 当学习率设置的较大，训练可能会在接近局部最优的附件震荡，无法更新到局部最优处；
* 当学习率设置的非常大，正如上一篇文章提到可能直接飞掉，权重变为NaN;

### 人工调整
学习率一般是根据我们的经验值进行尝试，首先在整个训练过程中学习率肯定不会设为一个固定的值，原因如上图描述的设置大了得不到局部最优值，设置小了收敛太慢也容易过拟合。通常我们会尝试性的将初始学习率设为：`0.1，0.01，0.001，0.0001`等来观察网络初始阶段`epoch的loss`情况：

* 如果训练`初期loss出现梯度爆炸或NaN`这样的情况（暂时排除其他原因引起的loss异常），说明`初始学习率偏大`，可以将初始学习率`降低10倍`再次尝试；
* 如果训练`初期loss下降缓慢`，说明`初始学习率偏小`，可以将初始学习率`增加5倍或10倍`再次尝试；
* 如果训练`一段时间后loss下降缓慢或者出现震荡`现象，可能训练进入到一个局部最小值或者鞍点附近。如果在`局部最小值`附近，需要`降低学习率`使训练朝更精细的位置移动；如果处于`鞍点附近`，需要适当`增加学习率`使步长更大跳出鞍点。
* 如果网络权重采用随机初始化方式从头学习，有时会因为`任务复杂`，`初始学习率需要设置的比较小`，否则很容易梯度飞掉带来模型的不稳定(振荡)。这种思想也叫做Warmup，在预热的小学习率下，模型可以慢慢趋于稳定,等模型相对稳定后再选择预先设置的学习率进行训练,使得模型收敛速度变得更快，模型效果更佳。形状如下：

![2](http://cdn.go99.top/docs/code/python/ai2.webp)

* 如果网络基于预训练权重做的`finetune`，由于模型在原数据集上以及收敛，有一个较好的起点，可以将`初始学习率设置的小一些进行微调`，比如`0.0001`。

这里只说了如果设置学习率，至于学习率降低到什么程序可以停止训练，理论上训练loss和验证loss都达到最小的时候就可以了。

### 策略调整学习率

策略调整学习率包括固定策略的学习率衰减和自适应学习率衰减，由于学习率如果连续衰减，不同的训练数据就会有不同的学习率。当学习率衰减时，在相似的训练数据下参数更新的速度也会放慢，就相当于减小了训练数据对模型训练结果的影响。为了使训练数据集中的所有数据对模型训练有相等的作用，通常是以epoch为单位衰减学习率。

# LORA微调

## 重要事项

* 模型加速（`vLLM`）
* 数据集质量很重要（需要包含我们关心的所有任务的数据）
* 数据类型越多样化，需要设置越高的秩（`r`）【数据类型多样化可以一定程度解决遗忘问题】
* 对于静态数据集，多个`epoch`可能导致模型性能下降，微调一般可以只设置一个·`epoch`，可以设置2个`epoch`测试一下效果【导致过拟合】。
* 较高的`r`值意味着更强的表达能力，但可能导致`过拟合`；较低的`r`值可以减少过拟合，但代价是`降低了表达能力`。
* `Alpha`值推荐设置成`r`值的两倍。在保持LoRA的`alpha参数不变`的情况下，`增加`了矩阵秩r，`较高的alpha`更强调`低秩结构或正则化`，`较低的alpha`则减少了其影响，使模型`更依赖于原始参数`。调整`alpha`有助于在`拟合数据和通过正则化防止过拟合之间`保持平衡（请注意，当使用扩散模型时，情况可能不同）
* 在整合`LoRA`（Low-Rank Adaptation）时，为了最大化模型性能，请确保将其`应用于所有层`，而不仅仅是键和值的矩阵。
* 推荐使用`Adam`优化器，虽然`Adam`优化器因为为每个模型参数额外引入两个参数而被认为是内存密集型的，但实际上它对LLM的峰值内存需求的影响并不显著。这是因为内存的主要消耗在于大型矩阵乘法，而不是存储这些额外的参数。

**过拟合处理：**通常，较大的 `r` 会导致更多的过拟合，因为它决定了可训练参数的数量。如果模型存在过度拟合，则首先要探索的是`降低 r` 或`增加数据集大小`。此外，您可以尝试`提高` AdamW 或 SGD 优化器中的`权重衰减率`，并且可以考虑`增加 LoRA 层的丢弃值`。

【推荐】AdamW学习率（`learning_rate`）是3e-4，衰减率为（`weight_decay`）0.01；

【不推荐】SGD（内存占用较少）学习率是0.1，动量为0.9


```bash
# Hyperparameters
learning_rate = 3e-4
batch_size = 128
micro_batch_size = 1
max_iters = 50000  # train dataset size
weight_decay = 0.01
lora_r = 8
lora_alpha = 16
lora_dropout = 0.05
lora_query = True
lora_key = False
lora_value = True
lora_projection = False
lora_mlp = False
lora_head = False
warmup_steps = 100
```

```bash
r=8
alpha=16
可训练参数：20277248个
不可训练参数：6738415616个
内存占用：16.42 GB

##### 推荐这个配置,效果稍微好一些
r=16
alha=32
可训练参数：40554496个
不可训练参数：6738415616个
内存占用：16.47 GB

### 最佳配置（具体还是需要根据数据集包含的任务类型来调整，数据类型越多，需要设置越高）
# 选择的r值过大，可能会使模型更容易过拟合，即模型在训练数据上表现得很好，但在未见过的数据上表现不佳
r=256
alpha=512
```

我们还可以在查询权重矩阵、投影层、多头注意力模块之间的其他线性层以及输出层启用 LoRA，如果我们在这些附加层上加入 LoRA，那么对于 7B 的 Llama 2 模型，可训练参数的数量将从 4,194,304 增加到 20,277,248，增加五倍。在更多层应用 LoRA，能够显著提高模型性能，但也对内存空间的需求量更高。

可以节省多少内存呢？这取决于秩`r`，它是一个超参数。例如，如果`ΔW`有`10,000行`和`20,000列`，它存储了`2亿个参数`。如果我们选择秩`r=8`的A和B，那么A有10,000行和8列，B有8行和20,000列，那就是`10,000×8 + 8×20,000 = 240,000`个参数，大约比2亿少830倍。


## QLoRA

QLoRA提出了一种折中方案：在GPU内存受限的情况下，它能够在增加`39%的运行时间`的情况下节省`33%的内存`。

`QLoRA`, 与 LoRA 方式类似，也是训练两个拟合参数层来达到对原始模型的调整。区别在于为了节省训练硬件资源， QLoRA 会先将原始模型参数`量化`至 `4-bit` 并冻结，然后添加一小组可学习的低秩适配器权重（ Low-rank Adapter weights），这些权重通过量化权重的`反向传播梯度`进行调优，在量化之后的参数上进行 LoRA 训练，这将大幅下降显存的占用（33b 的模型 以 FP16 全量加载需消耗 80GB 显存，量化至 4 bit之后模型加载仅需要 20 GB 左右显存的占用）。除了量化并冻结原始参数，QLoRA 还支持分页优化器：使用NVIDIA统一内存特性，将部分显存溢出的部分 offload 到内存中实现分页，来进一步避免 OOM 的问题。

# RAG

## 主要步骤

1. 索引 — 将文档库分割成较短的 Chunk，并通过编码器构建向量索引。
2. 检索 — 根据问题和 chunks 的相似度检索相关文档片段。
3. 生成 — 以检索到的上下文为条件，生成问题的回答。

```
请基于```内的内容回答问题。
```
检索片段1
检索片段2
```
我的问题是：
{content}
```

## 向量库选择

* milvus
* redis-stack
* elasticsearch
* mongo

## 成功要求

* 检索必须能够找到与用户查询最相关的文档。
* 生成必须能够充分利用检索到的文档来足够回答用户的查询。

## 找到与用户查询最相关的文档

用户文档的存储要合理，不能直接保存原文切分之后的块向量。

* 块大小优化：由于LLMs受上下文长度限制，在构建外部知识数据库时需要对文档进行分块。太大或太小的块可能会导致生成组件出现问题，从而导致不准确的响应。
* 结构化外部知识：在复杂的场景中，可能需要比基本的向量索引更加结构化地构建外部知识，以便在处理合理分离的外部知识源时进行递归检索或路由检索。
* 如果需要从许多文档中检索信息，能够高效地在其中进行搜索，找到相关信息，并在单个答案中综合这些信息，并引用来源。在处理大型数据库时，一种高效的方法是创建两个索引（一个由摘要组成，另一个由文档片段组成），并分两步进行搜索，首先通过摘要筛选出相关文档，然后仅在这个相关组内部进行搜索。

## 充分利用检索到的文档

检索到的数据不要直接传给LLM进行推理，尽量优化重组之后再给LLM。

* 信息压缩：LLM不仅受上下文长度限制，而且如果检索到的文档包含太多噪音（即无关信息），可能会导致响应降级。
* 结果重新排名：LLM（大型语言模型）遭受所谓的“中间丢失”现象，即LLM倾向于关注提示的极端部分。基于此，有益的做法是在将检索到的文档传递给生成组件之前对其进行重新排名。

## 同时解决检索和生成成功要求的高级技术

* 生成器增强检索：这些技术利用LLM固有的推理能力，在执行检索之前，对用户查询进行细化，以更好地指示需要提供有用响应的内容。
* 迭代式检索生成器RAG：对于一些复杂情况，可能需要多步推理来提供对用户查询有用且相关的答案。
* 最终prompt发送给LLM生成回答：一是通过逐块发送检索到的上下文到LLM来迭代地完善答案；二是总结检索到的上下文以适应提示；三是基于不同的上下文块生成多个答案，然后将它们连接或总结起来。



# 常用模型及工具记录

## llama.cpp（支持cpu）

[参考资料](https://github.com/ggerganov/llama.cpp)

* 支持常见的 `Qwen系列、Baichuan系列、Gemma系列等`

## Ollama（支持cpu）

支持多平台部署

调用了 llama.cpp 的底层能力，并且增加了一些其他能力，[linux手动安装参考](https://github.com/ollama/ollama/blob/main/docs/linux.md)

模型仓库地址：https://ollama.com/library

* `ollama`：大模型简化部署，没有推理加速。可以通过命令行简单运行大模型（默认使用4bit量化的，如果要用原始的可以指定`tag`），对外提供api服务。支持的纯语言模型包括`llama系列、Yi系列、Qwen、DeepSeek 系列、MoE 模型 Mixtral-8x7B、Phi-2`

```bash
# 下载安装（选择对应版本，arm的下载ollama-linux-arm64）
wget https://ollama.com/download/ollama-linux-amd64

#### 一般运行，直接到ollama仓库拉取模型
# 启动服务
./ollama-linux-amd64 serve

# 创建模型
ollama create choose-a-model-name -f Modelfile

#### 常见环境变量
# 默认127.0.0.1 port 11434 
OLLAMA_HOST=0.0.0.0
# 跨域
OLLAMA_ORIGINS=true
# 模型保存位置
# macOS: ~/.ollama/models
# Linux: ~/.ollama/models
# Windows: C:\Users\<username>\.ollama\models
OLLAMA_MODELS=/data/models
# 代理
HTTPS_PROXY=https://proxy.example.com

### 下面创建运行模型也可以通过api调用（）
# 下载模型
ollama pull llama2
# 运行模型
ollama run llama2
# 删除模型
ollama rm llama2

# 预加载模型，提升响应速度
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b"}'
curl http://localhost:11434/api/chat -d '{"model": "qwen:4b"}'

# 模型长期加载到内存/卸载
# 加载
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b", "keep_alive": -1}'
# 卸载
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b", "keep_alive": 0}'


#### 如果是PyTorch & Safetensors模型，需要做一下转换
git clone git@github.com:ollama/ollama.git ollama
cd ollama
git submodule init
# 下载llama.cpp
git submodule update llm/llama.cpp
python3 -m venv llm/llama.cpp/.venv
source llm/llama.cpp/.venv/bin/activate
pip install -r llm/llama.cpp/requirements.txt
# 安装量化工具
make -C llm/llama.cpp quantize
# 下载原始模型
git lfs install
git clone https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1 model
# 转换模型（For example, Qwen models require running convert-hf-to-gguf.py instead of convert.py）
python llm/llama.cpp/convert.py ./model --outtype f16 --outfile converted.bin
# 量化模型
llm/llama.cpp/quantize converted.bin quantized.bin q4_0
# 编写modelfile
FROM quantized.bin
TEMPLATE "[INST] {{ .Prompt }} [/INST]"
# 创建ollama模型
ollama create mymodel -f Modelfile
# 运行模型
ollama run mymodel "What is your favourite condiment?"

#### 上传模型（先注册ollama账号）
ollama cp mymodel <your username>/mymodel
ollama push <your username>/mymodel


#### openapi方式调用
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "qwen:4b",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "方寸无忧的电话是多少!"
            }
        ]
    }'
```

## FastChat（主部署、加速-目前不太推荐）

* `fastchat`：【部署模型居多，可整合vllm】一个用于训练、部署和评估基于大型语言模型的聊天机器人的开放平台
```bash
# 安装
pip3 install fschat
# 或
pip install "fschat[model_worker,webui]"
pip install vllm
##### 部署openai形式的服务
# 启动controller，默认端口为 21001，可通过 --port 指定
python3 -m fastchat.serve.controller
# 启动vLLM Worker
# 默认端口为 21002，可通过 --port 指定。FastChat 的 Worker 会向 Controller 注册自身，并通过心跳机制保持连接。
python3 -m fastchat.serve.vllm_worker meta-llama/Llama-2-7b-chat-hf --num-gpus 2
# 启动 Gradio Web Server，提供了可视化交互聊天界面，默认端口为 7860，可通过 --port 指定
python3 -m fastchat.serve.gradio_web_server
# 启动 OpenAI API Server，默认端口为 8000，可通过 --port 指定
python3 -m fastchat.serve.openai_api_server
# 使用 OpenAI SDK
pip install openai
# py代码
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="na")
model = "meta-llama/Llama-2-7b-chat-hf"


#### 其他
# 单gpu
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3
# 多gpu
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --num-gpus 2
# 使用CPU
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device cpu
# Metal后端（Apple Silicon或AMD GPU的Mac电脑）
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device mps --load-8bit
# Intel XPU（Intel Data Center和Arc A-Series GPU），安装Intel Extension for PyTorch[27]。设置OneAPI环境变量
source /opt/intel/oneapi/setvars.sh
python3 -m fastchat.serve.cli --model-path lmsys/vicuna-7b-v1.3 --device xpu
```

## vLLM（推理加速-gpu推荐）

* `vLLM`：推理加速的引擎，提高整体吞吐量，单batch效果不明显，预先分配大量显存，提高推理速度，实现了`Rolling Batch`批处理以及`PagedAttention`的全新的注意力算法，相对于静态`batch`，vLLM 提供了高达`数十倍`的吞吐量，而无需进行任何模型架构更改，支持Huggingface常见的模型`llama系列、qwen系列、baichuan`
    
### 推理
```py
#### 检查模型是否被 vLLM 支持，返回成功则是支持的
from vllm import LLM
llm = LLM(model=...)  # Name or path of your model
output = llm.generate("Hello, my name is")
print(output)

#### 离线批量推断
from vllm import LLM, SamplingParams

prompts = [
    "Hello, my name is",
    "The president of the United States is",
    "The capital of France is",
    "The future of AI is",
]
sampling_params = SamplingParams(temperature=0.8, top_p=0.95)

llm = LLM(model="facebook/opt-125m")
outputs = llm.generate(prompts, sampling_params)
# Print the outputs.
for output in outputs:
    prompt = output.prompt
    generated_text = output.outputs[0].text
    print(f"Prompt: {prompt!r}, Generated text: {generated_text!r}")

#### api服务
# 代码参考地址：https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/api_server.py
python -m vllm.entrypoints.api_server
# 客户端请求示例：https://github.com/vllm-project/vllm/blob/main/examples/api_client.py
curl http://localhost:8000/generate \
-d '{
    "prompt": "San Francisco is a",
    "use_beam_search": true,
    "n": 4,
    "temperature": 0
}'

#### openai的api服务
# 代码参考地址：https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/api_server.py
python -m vllm.entrypoints.openai.api_server --model facebook/opt-125m
# 客户端示例：https://github.com/vllm-project/vllm/blob/main/examples/api_client.py
curl http://localhost:8000/v1/completions \
-H "Content-Type: application/json" \
-d '{
    "model": "facebook/opt-125m",
    "prompt": "San Francisco is a",
    "max_tokens": 7,
    "temperature": 0
}'
# 使用openai的sdk
import openai
# Modify OpenAI's API key and API base to use vLLM's API server.
openai.api_key = "EMPTY"
openai.api_base = "http://localhost:8000/v1"
completion = openai.Completion.create(model="facebook/opt-125m", prompt="San Francisco is a")
print("Completion result:", completion)

#### 分布式推理
# 安装分布式框架 ray
pip install ray
# tensor_parallel_size 可以指定使用 GPU 的数量
from vllm import LLM
llm = LLM("facebook/opt-13b", tensor_parallel_size=4)
output = llm.generate("San Franciso is a")
# Server 指定 GPU 数量
python -m vllm.entrypoints.api_server \
    --model facebook/opt-13b \
    --tensor-parallel-size 4
# 分别在一个主节点和多个工作节点安装 ray 并运行服务。然后在主节点运行上述的 Server，GPU 数量可以指定为集群内所有的 GPU 数量总和。
# On head node
ray start --head
# On worker nodes
ray start --address=<ray-head-address>
```

### 训练

```bash
# 使用以下命令使用 4 x A100 (40GB) 训练 Vicuna-7B。—model_name_or_path使用 LLaMA 权重的实际路径和—data_path数据的实际路径进行更新
torchrun --nproc_per_node=4 --master_port=20001 fastchat/train/train_mem.py \
    --model_name_or_path ~/model_weights/llama-7b  \
    --data_path data/dummy_conversation.json \
    --bf16 True \
    --output_dir output_vicuna \
    --num_train_epochs 3 \
    --per_device_train_batch_size 2 \
    --per_device_eval_batch_size 2 \
    --gradient_accumulation_steps 16 \
    --evaluation_strategy "no" \
    --save_strategy "steps" \
    --save_steps 1200 \
    --save_total_limit 10 \
    --learning_rate 2e-5 \
    --weight_decay 0. \
    --warmup_ratio 0.03 \
    --lr_scheduler_type "cosine" \
    --logging_steps 1 \
    --fsdp "full_shard auto_wrap" \
    --fsdp_transformer_layer_cls_to_wrap 'LlamaDecoderLayer' \
    --tf32 True \
    --model_max_length 2048 \
    --gradient_checkpointing True \
    --lazy_preprocess True
```

## FastLLM（推理加速-目前不推荐）

* `fastllm`：也是一个推理加速引擎（国产），支持android，有时候会出现问题。

## Llama-Factory（主训练-推荐）

[参考资料](https://github.com/hiyouga/LLaMA-Factory)

* `llama-factory`：高效的大语言模型训练和推理框架，带有webui，简化训练门槛，支持常见模型`Baichuan2、ChatGLM3、Gemma、LLaMA系列、Qwen系列、Yi系列`。

## LangChain(RAG框架)

* langchain+ollama 简单demo

```py
# 加载模型
from langchain.llms import Ollama
ollama = Ollama(base_url='http://localhost:11434', model="qwen:4b")

# 外部数据
from langchain.document_loaders import WebBaseLoader
loader = WebBaseLoader("http://www.ifuncun.cn/NewsStd_528.html")
data = loader.load()

# 数据切分
from langchain.text_splitter import RecursiveCharacterTextSplitter
text_splitter=RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
all_splits = text_splitter.split_documents(data)

# 数据向量化（如果有报错sqlite3，参考python问题列表处理）
from langchain.embeddings import OllamaEmbeddings
from langchain.vectorstores import Chroma
oembed = OllamaEmbeddings(base_url="http://localhost:11434", model="nomic-embed-text")
vectorstore = Chroma.from_documents(documents=all_splits, embedding=oembed)

# 相关问题查询（从外部数据检索）
question="方寸无忧公司的电话是多少？"
docs = vectorstore.similarity_search(question)
print(docs)

# 合并发送给大模型处理
from langchain.chains import RetrievalQA
qachain=RetrievalQA.from_chain_type(ollama, retriever=vectorstore.as_retriever())
qachain.invoke({"query": question})
```

## LlamaIndex(RAG框架)

## 常用模型

* `AI编程模型`：`Stable Code 3B`
* `语音转文字`：`PaddleSpeech、FunAsr`


