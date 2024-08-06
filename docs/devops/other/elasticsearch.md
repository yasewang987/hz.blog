# elasticsearch

开源的Elastic Search是目前全文检索引擎的首选。它可以快速的存储、搜索和分析海量数据。ElasticSearch是一个分布式搜索框架，提供RestfulAPI，底层基于Lucene，采用多shard（分片）的方式保证数据安全，并且提供自动resharding的功能。

`config/elasticsearch.yml` 内容：

```yml
http.host: 0.0.0.0

# 设置启动默认端口号
http.port: 19200
```

## docker启动es

运行容器命令（elasticsearch文件夹下运行）：

```bash
## 拉取镜像
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.5.2

## 启动容器
sudo docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \
-v $PWD/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v $PWD/data:/usr/share/elasticsearch/data \
-v $PWD/plugins:/usr/share/elasticsearch/plugins \
-d --restart=always elasticsearch:7.1.0
```

## 直接启动es

```bash
# 解压
tar zxvf elasticsearch-7.14.0-linux-aarch64.tar.gz -C /opt/mytest/

# (涉密服务器直接用root帐号)es不允许root账户运行必须创建账号
useradd mytest
chown mytest:mytest /opt/mytest -R

# 使用自带的jdk（修改 bin/elasticsearch-env 文件）
# 注释掉下面几行即可
elif [ ! -z "$JAVA_HOME" ]; then
  # fallback to JAVA_HOME
  echo "warning: usage of JAVA_HOME is deprecated, use ES_JAVA_HOME" >&2
  JAVA="$JAVA_HOME/bin/java"
  JAVA_TYPE="JAVA_HOME"

# 启动 -d 后台运行
/opt/mytest/elasticsearch/bin/elasticsearch -d
```

## 查看信息

```bash
# 查看到es对应的版本和基本信息
curl http://localhost:9200
# 查看索引信息
curl http://localhost:9200/_cat/indices?v 
```

## 开启用户名密码认证

* 在 `elasticsearch.yml` 中添加如下配置

```yml
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: Authorization
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

* 重启 `elasticsearch` 服务

```bash
systemctl restart elasticsearch
```

* 设置密码，根据提示多次输入一样的账号密码即可

```bash
./usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive
```

## nginx反向代理

```conf
upstream elasticsearch {
  server 127.0.0.1:9200;
  keepalive 15;
}
server {
  listen 8881;

  location / {
    # auth_basic "Restricted Access";
    # auth_basic_user_file /etc/nginx/htpasswd.users;
    proxy_pass http://elasticsearch;
    proxy_redirect off;
    proxy_buffering off;

    proxy_http_version 1.1;
    proxy_set_header Connection "Keep-Alive";
    proxy_set_header Proxy-Connection "Keep-Alive";
  }
}
```

## Docker搭建es集群

```bash
# 拉取镜像
docker pull elasticsearch
# 准备目录
cd /home && mkdir -p es/config && cd es
mkdir -p {data1,data2,data3} && cd config
# 创建配置文件
vim es1.yml

cluster.name: elasticsearch-cluster
node.name: es-node1
network.bind_host: 0.0.0.0
network.publish_host: 192.168.9.219
http.port: 9200
transport.tcp.port: 9300
http.cors.enabled: true
http.cors.allow-origin: "*"
node.master: true 
node.data: true  
discovery.zen.ping.unicast.hosts: ["192.168.9.219:9300","192.168.9.219:9301","192.168.9.219:9302"]
discovery.zen.minimum_master_nodes: 2

vim es2.yml

cluster.name: elasticsearch-cluster
node.name: es-node2
network.bind_host: 0.0.0.0
network.publish_host: 192.168.9.219
http.port: 9201
transport.tcp.port: 9301
http.cors.enabled: true
http.cors.allow-origin: "*"
node.master: true 
node.data: true  
discovery.zen.ping.unicast.hosts: ["192.168.9.219:9300","192.168.9.219:9301","192.168.9.219:9302"]
discovery.zen.minimum_master_nodes: 2

vim es3.yml

cluster.name: elasticsearch-cluster
node.name: es-node3
network.bind_host: 0.0.0.0
network.publish_host: 192.168.9.219
http.port: 9202
transport.tcp.port: 9302
http.cors.enabled: true
http.cors.allow-origin: "*"
node.master: true 
node.data: true  
discovery.zen.ping.unicast.hosts: ["192.168.9.219:9300","192.168.9.219:9301","192.168.9.219:9302"]
discovery.zen.minimum_master_nodes: 2

# 调高JVM线程数限制数量，防止报错：bootstrap checks failed max virtual memory areas vm.max_map_count [65530] likely too low, increase to at least [262144]
vim /etc/sysctl.conf
# 加入如下内容
vm.max_map_count=262144 
# 生效配置
sysctl -p

# 启动容器,设置-e ES_JAVA_OPTS="-Xms256m -Xmx256m" 是因为/etc/elasticsearch/jvm.options 默认jvm最大最小内存是2G,如果内存猪狗可以不用设置
docker run -e ES_JAVA_OPTS="-Xms256m -Xmx256m" -d -p 9200:9200 -p 9300:9300 -v /home/es/config/es1.yml:/usr/share/elasticsearch/config/elasticsearch.yml -v /home/es/data1:/usr/share/elasticsearch/data --name ES01 elasticsearch

docker run -e ES_JAVA_OPTS="-Xms256m -Xmx256m" -d -p 9201:9200 -p 9301:9300 -v /home/es/config/es2.yml:/usr/share/elasticsearch/config/elasticsearch.yml -v /home/es/data2:/usr/share/elasticsearch/data --name ES02 elasticsearch

docker run -e ES_JAVA_OPTS="-Xms256m -Xmx256m" -d -p 9202:9200 -p 9302:9300 -v /home/es/config/es3.yml:/usr/share/elasticsearch/config/elasticsearch.yml -v /home/es/data3:/usr/share/elasticsearch/data --name ES03 elasticsearch

# 验证是否成功，在浏览器输入如下地址，* 号标记的是主节点
http://192.168.9.219:9200/_cat/nodes?pretty

# 索引分片设置以及副本，官方推荐设置，根据自身需要进行修改：
curl -X PUT http://localhost:9200/_all/_settings?preserve_existing=true -d '{
"index.number_of_replicas":"1",
"index.number_of_shards":"10"
}'
```

* cluster.name：用于唯一标识一个集群，不同的集群，其 cluster.name 不同，集群名字相同的所有节点自动组成一个集群。如果不配置改属性，默认值是：elasticsearch。
* node.name：节点名，默认随机指定一个name列表中名字。集群中node名字不能重复
* index.number_of_shards: 默认的配置是把索引分为5个分片
* index.number_of_replicas:设置每个index的默认的冗余备份的分片数，默认是1

    通过 index.number_of_shards，index.number_of_replicas默认设置索引将分为5个分片，每个分片1个副本，共10个结点。

    禁用索引的分布式特性，使索引只创建在本地主机上,但随着版本的升级 将不在配置文件中配置而是启动ES后，再进行配置：

    * index.number_of_shards: 1
    * index.number_of_replicas: 0
* bootstrap.memory_lock: true 当JVM做分页切换（swapping）时，ElasticSearch执行的效率会降低，推荐把ES_MIN_MEM和ES_MAX_MEM两个环境变量设置成同一个值，并且保证机器有足够的物理内存分配给ES，同时允许ElasticSearch进程锁住内存
* network.bind_host: 设置可以访问的ip,可以是ipv4或ipv6的，默认为0.0.0.0，这里全部设置通过
* network.publish_host:设置其它结点和该结点交互的ip地址，如果不设置它会自动判断，值必须是个真实的ip地址

    同时设置bind_host和publish_host两个参数可以替换成network.host

    ```bash
    network.bind_host: 192.168.9.219
    network.publish_host: 192.168.9.219
    =>network.host: 192.168.9.219
    ```
* http.port:设置对外服务的http端口，默认为9200
* transport.tcp.port: 设置节点之间交互的tcp端口，默认是9300
* http.cors.enabled: 是否允许跨域REST请求
* http.cors.allow-origin: 允许 REST 请求来自何处
* node.master: true 配置该结点有资格被选举为主结点（候选主结点），用于处理请求和管理集群。如果结点没有资格成为主结点，那么该结点永远不可能成为主结点；如果结点有资格成为主结点，只有在被其他候选主结点认可和被选举为主结点之后，才真正成为主结点。
* node.data: true 配置该结点是数据结点，用于保存数据，执行数据相关的操作（CRUD，Aggregation）；
* discovery.zen.minimum_master_nodes: //自动发现master节点的最小数，如果这个集群中配置进来的master节点少于这个数目，es的日志会一直报master节点数目不足。（默认为1）为了避免脑裂，个数请遵从该公式 => (totalnumber of master-eligible nodes / 2 + 1)。* 脑裂是指在主备切换时，由于切换不彻底或其他原因，导致客户端和Slave误以为出现两个active master，最终使得整个集群处于混乱状态*
* discovery.zen.ping.unicast.hosts：集群个节点IP地址，也可以使用es-node等名称，需要各节点能够解析

## 问题

* es启动自动被杀掉【killed】

```bash
# 修改config目录的jvm.options
-Xms1g
-Xmx2g
```

* 报错：`received plaintext http traffic on an https channel`

需要关闭 `elasticsearch.yml` 配置文件里的 `https`，全部设置成`false`
