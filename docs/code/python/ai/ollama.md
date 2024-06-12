# Ollama

调用了 llama.cpp 的底层能力，并且增加了一些其他能力

* 模型仓库地址：https://ollama.com/library
* api接口地址：https://github.com/ollama/ollama/blob/main/docs/api.md
* hub地址：https://hub.docker.com/r/ollama/ollama

## 常用命令

```bash
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

#### 上传模型（先注册ollama账号）
ollama cp mymodel <your username>/mymodel
ollama push <your username>/mymodel
```

## 常用api

```bash
# 预加载模型，提升响应速度
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b"}'
curl http://localhost:11434/api/chat -d '{"model": "qwen:4b"}'

# 模型长期加载到内存/卸载
# 加载
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b", "keep_alive": -1}'
# 卸载
curl http://localhost:11434/api/generate -d '{"model": "qwen:4b", "keep_alive": 0}'

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

## docker部署

```bash
### cpu版本
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

### gpu版本
# apt安装驱动
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
    | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
    | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
    | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
# yum安装驱动
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo \
    | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo yum install -y nvidia-container-toolkit
# 配置docker使用nv驱动
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
# 运行容器
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

#### amd-gpu
docker run -d --device /dev/kfd --device /dev/dri -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama:rocm
```

## linux手动安装部署

[linux手动安装参考](https://github.com/ollama/ollama/blob/main/docs/linux.md)

* `ollama`：大模型简化部署，没有推理加速。可以通过命令行简单运行大模型（默认使用4bit量化的，如果要用原始的可以指定`tag`），对外提供api服务。支持的纯语言模型包括`llama系列、Yi系列、Qwen、DeepSeek 系列、MoE 模型 Mixtral-8x7B、Phi-2`

```bash
# 下载安装（选择对应版本，arm的下载ollama-linux-arm64）
wget https://ollama.com/download/ollama-linux-amd64

#### 一般运行，直接到ollama仓库拉取模型
# 启动服务
./ollama-linux-amd64 serve
```

## 模型转换

新版本已经可以自动转换pt和safetensors模型，不需要手动转换

```bash
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
```

## functioncall示例

调用天气查询方法

```bash
# 拉取模型
ollama pull qwen:7b
# 安装依赖
pip install -q langchain_experimental
```

```py
from langchain_experimental.llms.ollama_functions import OllamaFunctions

model = OllamaFunctions(model='qwen:7b', base_url='http://192.168.215.1:11434')

def get_weather(city):
  import datetime
  weather_json = {'province': '北京',
    'city': city,
    'adcode': '110000',
    'weather': '晴',
    'temperature': '26',
    'winddirection': '西北',
    'windpower': '4',
    'humidity': '20',
    'reporttime': '2024-06-12 16:38:38',
    'temperature_float': '26.0',
    'humidity_float': '20.0'}
  return f"城市：{weather_json['city']},日期：{weather_json['reporttime']}，天气：{weather_json['weather']}，气温{weather_json['temperature']}摄氏度，{weather_json['winddirection']}风{weather_json['windpower']}级"

fn_map = {
  'get_weather': get_weather
}

llm_with_tools = model.bind_tools(
  tools=[
        {
            "name": "get_weather",
            "description": "根据城市名获取天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名，例如北京"
                    }
                },
                "required": ["city"]
            }
        },
    ],
)

ai_msg = llm_with_tools.invoke('今天北京天气怎么样')
functionInfos = ai_msg.dict()['tool_calls'][0]
print(f"调用函数信息:{functionInfos}")
kwargs = functionInfos['args']['city']
print(f"函数名：{functionInfos['name']}，函数参数：{kwargs}")
res = fn_map[functionInfos['name']](city = kwargs)
print(res)
```