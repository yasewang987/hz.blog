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
./main -m /data/models/qwen1_5-7b-chat-q4_k_m.gguf -n 512 --color -i -cml -f prompts/chat-with-qwen.txt
./server -m /data/models/qwen1_5-7b-chat-q4_k_m.gguf -c 2048 -f prompts/chat-with-qwen.txt
```

## 简单rag文本生成示例

* 依赖环境

```bash
# 先安装miniconda，推荐python3.11版本
# 安装依赖项
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple llama-cpp-python langchain psycopg2 pgvector transformers sentence_transformers
# 需要提前下载好向量和推理模型
```

* rag简单示例

```py
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.llms import LlamaCpp
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores.pgvector import PGVector
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from langchain.chains import LLMChain
import os
import pathlib

# 数据库连接
CONNECTION_STRING = PGVector.connection_string_from_db_params(
    driver=os.environ.get("PGVECTOR_DRIVER", "psycopg2"),
    host=os.environ.get("PGVECTOR_HOST", "172.17.0.1"),
    port=int(os.environ.get("PGVECTOR_PORT", "5432")),
    database=os.environ.get("PGVECTOR_DATABASE", "postgres"),
    user=os.environ.get("PGVECTOR_USER", "postgres"),
    password=os.environ.get("PGVECTOR_PASSWORD", "hz123456"),
)
# conn = psycopg2.connect(host='172.17.0.1',port='5432',database='postgres',user='postgres',password='hz123456')
# 加载向量模型
model_name = "/data/models/acge_text_embedding"
model_kwargs = {"device": "cpu"}
encode_kwargs = {"normalize_embeddings": True}
embedding_model = SentenceTransformerEmbeddings(model_name=model_name, model_kwargs=model_kwargs,encode_kwargs=encode_kwargs)
# 加载生成模型(llama.cpp)
# callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
# n_ctx：控制输入token的数量（上下文长度）
llm_model = LlamaCpp(
  model_path="/data/models/qwen1_5-1_8b-chat-q4_0.gguf", 
  temperature=0.4, 
  n_ctx=2048,
  verbose=False,
)
prompt_template = """Use the context below to write a 400 word blog post about the topic below:
 Context: {context}
 Topic: {topic}
 Blog post:"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "topic"]
)
chain = LLMChain(llm=llm, prompt=PROMPT)

# 获取原始数据（托管在Github上的由markdown文件组成的文档站点）
def get_docs(localpath):
    repo_path = pathlib.Path(localpath)
    markdown_files = list(repo_path.glob("*.md"))+list(repo_path.glob("*.mdx"))
    for markdown_file in markdown_files:
      with open(markdown_file, "r") as f:
        relative_path = markdown_file.relative_to(repo_path)
        url = f"{relative_path}"
        yield Document(page_content=f.read(), metadata={"source": url})
    
# 文本分块处理
def spliter_docs():
  sources = get_docs("/data/project/hz.blog/docs/other/book")
  source_chunks = []
  spliter = CharacterTextSplitter(separator=" ", chunk_size=1024, chunk_overlap=0)
  for source in sources:
    for chunk in spliter.split_text(source.page_content):
      source_chunks.append(Document(page_content=chunk, metadata=source.metadata))
  return source_chunks
# 向量化数据并存入数据库
def embedding_docs():
  # 向量化数据
  docs = spliter_docs()
  # 存入数据库（PGVector模块将尝试使用集合名称创建表。因此，请确保集合名称唯一且用户有权限创建表）
  db = PGVector.from_documents(
    embedding=embedding_model,
    documents=docs,
    collection_name="test_data_union",
    connection_string=CONNECTION_STRING,
  )
# rag问答（带分数的简单问答）
def simpe_rag(query):
  db = PGVector.from_existing_index(
    embedding=embedding_model,
    collection_name="test_data_union",
    connection_string=CONNECTION_STRING,
  )
  result = db.similarity_search(query, k=4)
  return result

# 带大模型推理(生成)+rag
def llm_rag(topic):
  docs = simpe_rag(topic)
  inputs = [{"context": doc.page_content, "topic": topic} for doc in docs]
  print(chain.apply(inputs))

if __name__ == '__main__': 
  # 初始化数据
  # db = embedding_docs()
  # 执行文本生成推理
  llm_rag('让人变厉害的底层思维')
```