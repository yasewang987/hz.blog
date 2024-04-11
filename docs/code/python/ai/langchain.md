# Langchain


## llama.cpp

```bash
# 安装环境
apt install build-essential
# 拉取代码
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
# 编译
make
# 运行测试
./main -m qwen1_5-7b-chat-q5_k_m.gguf -n 512 --color -i -cml -f prompts/chat-with-qwen.txt
```

## 简单rag文本生成示例

* 依赖环境

```bash
# 先安装miniconda，推荐python3.11版本
# 安装依赖项
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple llama-cpp-python langchain psycopg2 pgvector transformers sentence_transformers

```

* rag简单示例

```bash
```