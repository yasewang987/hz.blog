# AI-向量检索

构建检索系统推荐：倒排+向量（语义）

## 基础概念

* **向量：**在数学中，向量是有大小和方向的量，可以使用带箭头的线段表示，箭头指向即为向量的方向，线段的长度表示向量的大小。两个向量的距离或者相似性可以通过欧式距离、余弦距离等得到。
* **向量数据：**简而言之，向量表示是一种将非结构化的数据转换为嵌入向量的技术，通过多维度向量数值表述某个对象或事物的属性或者特征。

    在提及向量数据之前，我们先思考一个问题，为什么我们可以在生活中区分不同的物品和事物？比如看到一个动物，我们可以分辨出是猫还是狗，看到一个人可以分辨其是女性还是男性。如果从理论角度出发，这是因为我们会通过识别不同事物之间不同的特征来识别种类，例如分别不同种类的小狗，就可以通过体型大小、毛发长度、鼻子长短等特征来区分。这些不同的特征就可以转换成向量的维度。例如三维向量（0.1，0.4，0.35）。实际上，只要维度够多，我们就能够将所有的事物区分开来，世间万物都可以用一个多维坐标系来表示，它们都在一个高维的特征空间中对应着一个坐标点。

    通过向量这样的表达方式，甚至让我们有了一定的推理能力，比如警察减去小偷的向量和猫减去老鼠的向量相似，那么这也意味二者的关系也类似 (猫抓老鼠、警察抓小偷)。贴近我们生活的案例比如平安城市，公安会把类似的作案手法的案发现场的周边的人脸做对比，看看有哪些人在多个案发现场同时出现过，作为重点嫌疑人进行排查。

    我们都知道向量是具有大小和方向的数学结构，所以可以将这些特征用向量来表示，这样就能够通过计算向量之间的距离来判断它们的相似度，这就是相似性搜索。
* **向量检索：**向量检索是将向量与数据库进行比较以查找与查询向量最相似的向量的过程。相似的向量通常具有相近的原始数据，通过向量检索可以挖掘出原始非结构化数据之间的联系。例如在图像向量数据库中，用户输入一张图片进行搜索时，先将这张图片转换为一个向量，通过向量之间的近似检索，找到与输入图片最相似的图片，这便是我们经常用到的搜图功能。

    * 最简单暴力的方式是平坦搜索 Flat search (类似传统关系型数据库的顺序扫描) ，即不采用任何算法进行索引，遍历数据库中所有的数据， 依次比较所有向量和查询向量的相似度，之后按照相似度倒序返回 topN 条。这种方式一般也称着暴力检索，召回率和准确率都是最高的，但是在数据量大的情况下遍历计算相似度是非常耗时的，需要一些策略算法进行优化，在召回率，内存占用和响应时间之间权衡。
    * 点积 (dot product)：向量的点积相似度是指两个向量之间的点积值，它适用于许多实际场景，例如图像识别、语义搜索和文档分类等。但点积相似度算法对向量的长度敏感，因此在计算高维向量的相似性时可能会出现问题。
    * 内积 (inner product)：全称为 Inner Product，是一种计算向量之间相似度的度量算法，它计算两个向量之间的点积（内积），所得值越大越与搜索值相似。
    * 欧式距离 (L2)：直接比较两个向量的欧式距离，距离越近越相似。欧几里得距离算法的优点是可以反映向量的绝对距离，适用于需要考虑向量长度的相似性计算。例如推荐系统中，需要根据用户的历史行为来推荐相似的商品，这时就需要考虑用户的历史行为的数量，而不仅仅是用户的历史行为的相似度。
    * 余弦相似度 (Cosine)：两个向量的夹角越小越相似，比较两个向量的余弦值进行比较，夹角越小，余弦值越大。余弦相似度对向量的长度不敏感，只关注向量的方向，因此适用于高维向量的相似性计算。例如语义搜索和文档分类。
* **向量聚类：**向量聚类指根据给定的相似度度量，将数据库中的向量分类。聚类的思想就是先进行特征提取，进行归类划分，比如这个人胸前带有红领巾，判断他来自小学，于是将搜索范围先缩小到这个城市的所有小学，这便是聚类。

* 除了暴力的平坦式搜索，所有的搜索算法只能得到一个近似的搜索结果， 所以这些算法被称作为——**ANN (Approximate Nearest Neighbor)**，近似最近邻搜索。
  * LSH 位置敏感哈希
  * Product Quantization (PQ) 乘积量化
  * Navigable Small Worlds (NSW) 导航小世界
  * Hierarchical Navigable Small Worlds (HNSW) 多层导航世界，内存开销大
  * KD-tree K 维空间进行多次划分，类似二叉树搜索，不适合高纬度向量



## 数据库推荐

**ANN** 是向量数据库的核心

* postgres + pgvector 【推荐】
* milvus
* redis-stack(redissearch+redisjson)
* elasticsearch 【推荐】
* mongo

## 向量化模型推荐

及时关注huaggingface的`embedding`模型榜单

需要关注几个列选项:

* modelsize：选择适合大小的模型，如果没有值，则只是开放了api，没有模型可以下载
* max token：模型输入的token限制
* embedding dimensions：模型的输出的vector的长度
* model :选择相应的模型，点击即可跳转到相应页面下载调用。

MTEB 排行榜：https://huggingface.co/spaces/mteb/leaderboard

MTEB 包含以下任务类别，每个类别对应不同的评估指标和数据集：

1. 文本分类（Classification）：如情感分析、意图分类等。
2. 聚类（Clustering）：如将相似文本分为同一类。
3. 成对分类（Pair Classification）：判断两个文本是否重复或具有相似含义。
4. 重排序（Reranking）：根据查询重新排序相关和不相关的参考文本。
5. 检索（Retrieval）：从大量文档中找到与查询相关的文档。
6. 语义文本相似性（STS）：评估句子对之间的相似性。
7. 摘要（Summarization）：评估机器生成摘要的质量。

```bash
# 8k长度，1024维度【推荐】
BAAI/bge-m3
# 512长度，1024维度
BAAI/bge-large-zh-v1.5
# 8k长度，768维度
jina-embeddings-v2-base-zh
```

## finetune向量模型

以 BAAI/bge-large-zh-v1.5 为例

```bash
#### 安装依赖库
pip install -U FlagEmbedding

#### 数据准备
# query 是问题，pos 是正样本列表，neg 是负样本列表，如果没有现成的负样本，可以考虑从整个语料库中随机抽取一些文本作为 neg
# finetune_data.jsonl
{"query": "如何提高机器学习模型的准确性？", "pos": ["通过交叉验证和调参可以提高模型准确性。"], "neg": ["机器学习是人工智能的一个分支。"]}
{"query": "什么是深度学习？", "pos": ["深度学习是机器学习的一个子领域，涉及多层神经网络。"], "neg": ["数据科学是一门交叉学科。"]}

#### Hard Negatives 挖掘（可选）
# 在向量空间中与查询较为接近但实际上并不相关的样本。挖掘这些样本可以提高模型的辨别能力，提供 Embedding 质量。
# range_for_sampling 表示从哪些文档采样，例如 2-200 表示从 top2-top200 文档中采样 negative_number 个负样本
python -m FlagEmbedding.baai_general_embedding.finetune.hn_mine \
--model_name_or_path BAAI/bge-large-zh-v1.5 \
--input_file finetune_data.jsonl \
--output_file finetune_data_minedHN.jsonl \
--range_for_sampling 2-200 \
--negative_number 15

#### 训练
# 训练参数，包括学习率、批次大小、训练轮次等，需要根据实际情况进行调整
torchrun --nproc_per_node {number of gpus} \
-m FlagEmbedding.baai_general_embedding.finetune.run \
--output_dir {path to save model} \
--model_name_or_path BAAI/bge-large-zh-v1.5 \
--train_data ./finetune_data.jsonl \
--learning_rate 1e-5 \
--fp16 \
--num_train_epochs 5 \
--per_device_train_batch_size {large batch size; set 1 for toy data} \
--dataloader_drop_last True \
--normlized True \
--temperature 0.02 \
--query_max_len 64 \
--passage_max_len 256 \
--train_group_size 2 \
--negatives_cross_device \
--logging_steps 10 \
--save_steps 1000 \
--query_instruction_for_retrieval "" 

#### 模型合并（可选）
# 对通用模型进行微调可以提高其在目标任务上的性能，但可能会导致模型在目标域之外的一般能力退化。通过合并微调模型和通用模型，不仅可以提高下游任务的性能，同时保持其他不相关任务的性能。
pip install -U LM_Cocktail
## 合并代码参考如下：
from LM_Cocktail import mix_models, mix_models_with_data
# Mix fine-tuned model and base model; then save it to output_path: ./mixed_model_1
model = mix_models(
    model_names_or_paths=["BAAI/bge-large-zh-v1.5", "your_fine-tuned_model"], 
    model_type='encoder', 
    weights=[0.5, 0.5],  # you can change the weights to get a better trade-off.
    output_path='./mixed_embedding_model')
```

## redis-stack示例

[参考资料](https://redis.io/docs/get-started/vector-database/)
[bikes数据下载](https://raw.githubusercontent.com/bsbodden/redis_vss_getting_started/main/data/bikes.json)

需要先部署 `redis-stack`，依赖里面的 `RedisJSON`和`RedisSearch`实现

主要步骤：

1. 原始文件内容以json格式存入RedisJson
1. 使用模型将需要向量化的数据处理之后，将处理的内容存入附加字段
1. 通过RedisSearch的向量化搜索查询出最符合的结果

```py
import json
import time

import numpy as np
import pandas as pd
import redis
import requests
# from redis.commands.search.field import {
#   NumericField,
#   TagField,
#   TextField,
#   VectorField,
# }
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from sentence_transformers import SentenceTransformer

client=redis.Redis(host="1.1.1.1", port=6379, password="mypassword", decode_responses=True)

# 获取初始数据
def get_data(): 
  f = open('bikes.json', 'r')
  content = f.read()
  bikes = json.loads(content)
  return bikes

# 将数据存储到数据库
def inert_data(bikes):
  pipeline = client.pipeline()
  for i, bike in enumerate(bikes, start=1):
    redis_key = f"bikes:{i:03}"
    pipeline.json().set(redis_key,"$",bike)
  pipeline.execute()

from sentence_transformers import SentenceTransformer
# 加载msmarco-distilbert-base-v4本地模型
embedder = SentenceTransformer('./msmarco-distilbert-base-v4')

# 向量化所有description数据
def embedder_data():
  keys = sorted(client.keys("bikes:*"))
  descriptions = client.json().mget(keys, "$.description")
  descriptions = [item for sublist in descriptions for item in sublist]
  embeddings = embedder.encode(descriptions).astype(np.float32).tolist()
  return keys, embeddings

# 将生成的向量更新到redis对应对象的description_embeddings字段
def insert_embedding_data():
  keys, embeddings = embedder_data()
  pipeline = client.pipeline()
  for key, embeding in zip(keys, embeddings):
    pipeline.json().set(key, "$.description_embeddings", embeding)
  pipeline.execute()

def query_demo():
  # 查询提示列表
  queries = [
      "Bike for small kids",
      "Best Mountain bikes for kids",
      "Cheap Mountain bike for kids",
      "Female specific mountain bike",
      "Road bike for beginners",
      "Commuter bike for people over 60",
      "Comfortable commuter bike",
      "Good bike for college students",
      "Mountain bike for beginners",
      "Vintage bike",
      "Comfortable city bike",
  ]
  # 向量化提示列表
  encoded_queries = embedder.encode(queries)
  # KNN 部分搜索三个最近的邻居，并返回对应字段
  query = (
    Query('(*)=>[KNN 3 @vector $query_vector AS vector_score]')
    .sort_by('vector_score')
    # .return_fields('vector_score', 'id', 'brand', 'model', 'description')
    .return_fields('vector_score', 'id' ,'description')
    # 使用 FT 的向量查询。SEARCH 命令，则必须指定 DIALECT 2 或更高版本
    .dialect(2)
  )

  create_query_table(query, queries, encoded_queries)

# 循环访问匹配的文档并创建一个结果列表，该列表可以转换为 Pandas 表以可视化结果
def create_query_table(query, queries, encoded_queries, extra_params={}):
  results_list = []
  for i, encoded_query in enumerate(encoded_queries):
    result_docs = (
      client.ft('idx:bikes_vss')
      .search(
        query,
        {
          "query_vector": np.array(
            encoded_query, dtype=np.float32
          ).tobytes()
        }
        | extra_params,
      )
      .docs
    )
    print(result_docs)
    for doc in result_docs:
      vector_score = round(1 - float(doc.vector_score), 2)
      results_list.append(
        {
          "query": queries[i],
          "score": vector_score,
          "id": doc.id,
          "description": doc.description,
        }
      )
  # convert the table to Markdown using Pandas
  queries_table = pd.DataFrame(results_list)
  queries_table.sort_values(
    by=["query", "score"], ascending=[True, False], inplace=True
  )
  queries_table["query"] = queries_table.groupby("query")["query"].transform(
    lambda x: [x.iloc[0]] + [""] * (len(x) - 1)
  )
  queries_table["description"] = queries_table["description"].apply(
    lambda x: (x[:497] + "...") if len(x) > 500 else x
  )
  queries_table.to_markdown(index=False)
  print(queries_table)

def main(): 
  # 先执行数据插入（需要执行创建索引操作）
  #bikes = get_data()
  #inert_data(bikes)
  #insert_embedding_data()

  # 再执行查询
  query_demo()

if __name__ == '__main__':
  main()
```

创建索引：

```bash
FT.CREATE idx:bikes_vss ON JSON PREFIX 1 bikes: SCORE 1.0 SCHEMA $.model TEXT WEIGHT 1.0 NOSTEM $.brand TEXT WEIGHT 1.0 NOSTEM  $.price NUMERIC $.type TAG SEPARATOR "," $.description AS description TEXT WEIGHT 1.0 $.description_embeddings AS vector VECTOR FLAT 6 TYPE FLOAT32 DIM 768 DISTANCE_METRIC COSINE
```