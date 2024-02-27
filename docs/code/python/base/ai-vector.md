# AI-向量检索

## redis-stack示例

需要先部署 `redis-stack`，依赖里面的 `RedisJSON`和`RedisSearch`实现

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
  # 先执行数据插入
  #bikes = get_data()
  #inert_data(bikes)
  #insert_embedding_data()
  # 再执行查询
  query_demo()

if __name__ == '__main__':
  main()
```