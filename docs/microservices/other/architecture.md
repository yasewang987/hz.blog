# 架构知识

## 多维度查询

### es

客户端实时读写、事务操作 -> mysql -> canal -> 自定义处理程序 -> es -> 客户端多维度查询

**ES最佳实践**:

* 只把需要搜索的数据导入ES，避免索引过大
* 数据扁平化，不用嵌套结构，提高性能
* 合理设置字段类型，预先定义`mapping`配置，而不依赖`ES`自动生成`mapping`
* 精确值的类型指定为`keyword`（`mapping`配置），并且使用`term`查询
  * 精确值是指无需进行`range`范围查询的字段，既可以是字符串，比如书的作者名字，也可以是数值，比如商品id、订单id、图书ISBN编号、枚举值。在使用中，大部分场景是以id类作为精确值
* 避免无路由查询：无路由查询会并发在多个索引上查询、归并排序结果，会使得集群cpu飙升，影响稳定性
* 避免深度分页查询：如有大量数据查询，推荐用`scroll`滚动查询
* 设置合理的文件系统缓存（`filesytem cache`）大小，提高性能：因为ES查询的热数据在文件系统缓存中
* ES分片数在创建后不能随意改动，但是副本数可以随时增加，来提高最大QPS。如果单个分片压力过大，需要扩容。

**原理**：

ES能胜任多维度查询、全文检索，是因为底层数据结构不同，ES倒排索引：

* 如果是全文检索字段：会先分词，然后生成 `term -> document` 的倒排索引，查询时也会把`query`分词，然后检索出相关的文档。相关度算法如`TF-IDF（term frequency–inverse document frequency）`，取决于：词在该文档中出现的频率`（TF，term frequency）`，越高代表越相关；以及词在所有文档中出现的频率`（IDF，inverse document frequency）`，越高代表越不相关，相当于是一个通用的词，对相关性影响较小。
* 如果是精确值字段：则无需分词，直接把`query`作为一个整体的`term`，查询对应文档。
* 因为文档中的所有字段，都生成了倒排索引，所以能处理多维度组合查询

**优点**:

* 支持各字段的多维度组合查询，无惧未来新增字段（主要成本在于新增字段后、重建索引）
* 与现有系统完全解耦，适合架构演进
* 在数据量级上远胜Mysql，最大支持PB级数据的存储和查询

**缺点**:

* 读写不一致时间在秒级：因为有2个耗时阶段，一是同步阶段将数据从`MySQL`数据库写入`ES`，二是ES索引refresh阶段，数据从`buffer`写入索引后才可查到
  * 因此一个`trick`就是，在写入操作后，前端延迟调用后端的列表查询接口，比如延迟1秒后再展示
* 超高并发下存在瓶颈，存在稳定性问题：目前原生版本支持大约 3-5 万分片，性能已经到达极限，创建索引基本到达 30 秒+ 甚至分钟级。节点数只能到 500 左右基本是极限了。但依然能满足绝大部分场景。




