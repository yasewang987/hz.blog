# elasticsearch安装

`elasticsearch.yml` 内容：

```yml
http.host: 0.0.0.0
```

运行容器命令（elasticsearch文件夹下运行）：

```bash
sudo docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \
-v $PWD/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v $PWD/data:/usr/share/elasticsearch/data \
-v $PWD/plugins:/usr/share/elasticsearch/plugins \
-d --restart=always elasticsearch:7.1.0
```

## 查看信息

```bash
# 查看到es对应的版本和基本信息
curl http://localhost:9200
# 查看索引信息
curl http://localhost:9200/_cat/indices?v 
```