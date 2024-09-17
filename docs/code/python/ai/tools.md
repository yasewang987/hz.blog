# 常用模型及工具记录

## llama.cpp（支持cpu）

[参考资料](https://github.com/ggerganov/llama.cpp)

* 支持常见的 `Qwen系列、Baichuan系列、Gemma系列等`

## Ollama【推荐】（支持cpu）

* 支持所有环境，具体参考ollama文档

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

## RTP-LLM（gpu推理加速-推荐）

rtp-llm 是阿里巴巴大模型预测团队开发的 LLM 推理加速引擎。

* github地址：https://github.com/alibaba/rtp-llm/blob/main/README_cn.md
* docker镜像列表：https://github.com/alibaba/rtp-llm/blob/main/docs/DockerHistory.md
* 配置参数：https://github.com/alibaba/rtp-llm/blob/main/docs/Config.md

```bash
# 启动推理服务
docker run -d --gpus all -v /data:/data --name my-llm /data/start.sh
# start.sh
export CUDA_VISIBLE_DEVICES=0
export MODEL_TYPE=chatglm3 
export MODEL_TEMPLATE_TYPE=chatglm3 
export TOKENIZER_PATH=/data/models/chatglm3-6b-32k
export CHECKPOINT_PATH=/data/models/chatglm3-6b-32k
export START_PORT=8088
export MAX_SEQ_LEN=10000
export CONCURRENCY_LIMIT=100 # 最大并发
export PY_LOG_LEVEL=INFO 
export PY_LOG_PATH=logs/
export FT_SERVER_TEST=1 
nohup python -m maga_transformer.start_server > logs/chatglm3_6b_32k.log 2>&1 &
```

## FastLLM（推理加速-目前不推荐）

* `fastllm`：也是一个推理加速引擎（国产），支持android，有时候会出现问题。

## Llama-Factory（主训练-推荐）

[参考资料](https://github.com/hiyouga/LLaMA-Factory)

* `llama-factory`：高效的大语言模型训练和推理框架，带有webui，简化训练门槛，支持常见模型`Baichuan2、ChatGLM3、Gemma、LLaMA系列、Qwen系列、Yi系列`。

## LangChain(RAG框架)

LangChain更加注重在大型语言模型的基础上开发应用程序。它支持各种自然语言处理任务，包括Creative Generation（创意生成）等领域。LangChain的灵活性和多样性使其在创造性应用方面具有独特优势。

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

专门用于构建RAG系统的框架，其主要用途是处理检索、摘要和生成任务。在RAG系统中，检索（Retrieve）、摘要（Answer）和生成（Generate）是三个关键步骤，LLamaIndex通过构建高效的索引和查询系统，为用户提供了强大的检索和生成能力。

