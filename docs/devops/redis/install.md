# Redis安装

## docker安装教程

### 主服务器

在redis目录下创建文件夹 data，conf

下载redis.conf文件：http://download.redis.io/redis-stable/redis.conf 放到 conf 文件夹下

修改启动默认配置(从上至下依次)：

`bind 127.0.0.1` #注释掉这部分，这是限制redis只能本地访问

`protected-mode no` #默认yes，开启保护模式，限制为本地访问

`daemonize no` #默认no，改为yes意为以守护进程方式启动，可后台运行，除非kill进程，改为yes会使配置文件方式启动redis失败

`databases 16` #数据库个数（可选），我修改了这个只是查看是否生效。。

`dir  ./` #输入本地redis数据库存放文件夹（可选）

`appendonly yes` #redis持久化（可选）

`requirepass  密码` #配置redis访问密码

运行容器命令(redis文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 6379:6379 \
-v $PWD/conf:/usr/local/etc/redis \
-v $PWD/data:/data \
--name redis redis redis-server /usr/local/etc/redis/redis.conf
```

### 从服务器

从服务器只需要修改如下配置文件，其他与主服务器一样即可：

```conf
replicaof 主redis-ip 主reids端口
masterauth 主redis密码
```

## nginx反向代理

监听具备公网ip服务器的3307端口，实现跳转到172.31.88.27的3306端口。

特别注意：stream要与http在同级目录  

```conf
stream {    # stream 模块配置和 http 模块在相同级别
    upstream redis {
        server 127.0.0.1:6379 max_fails=3 fail_timeout=30s;
    }
    server {
        listen 16379;
        proxy_connect_timeout 1s;
        proxy_timeout 3s;
        proxy_pass redis;
    }
}
```

## Redis常用客户端工具

* `another redis desktop manager`
* `RedisInsight`：https://redis.com/redis-enterprise/redis-insight/

## RedisMod安装

首先介绍下RedisMod这个东西，它是一系列Redis的增强模块。有了RedisMod的支持，Redis的功能将变得非常强大。目前RedisMod中包含了如下增强模块：

* RediSearch：一个功能齐全的搜索引擎；
* RedisJSON：对JSON类型的原生支持；
* RedisTimeSeries：时序数据库支持；
* RedisGraph：图数据库支持；
* RedisBloom：概率性数据的原生支持；
* RedisGears：可编程的数据处理；
* RedisAI：机器学习的实时模型管理和部署。

```bash
# docker方式安装
docker run -d -p 6666:6379 \
-v /home/user/redis/data:/data \
-v /home/user/redis/redis.conf:/usr/local/etc/redis/redis.conf \
--name redismod redislabs/redismod \
/usr/local/etc/redis/redis.conf
```

## Redis Cluster集群

### 集群配置启动

1. 编译redis
1. 在redis根目录下，创建一个`conf`文件夹，并在`conf`文件夹下，创建6个文件夹，用于存集群每个节点的`配置文件`、`数据文件`等

    ```bash
    mkdir -p conf/{7001,7002,7003,7004,7005,7006}
    ```
1. 在 7001 文件夹内，创建一个redis 的配置文件，内容如下：

    ```conf
    # 将bind这一行注释掉，或者修改为0:0:0:0，这表示任意地址都可以连接此Redis服务 
    # bind 127.0.0.1 

    # 关闭保护模式，如果开启的话，外部客户端就连不上Redis 
    protected-mode no 

    # 配置redis的端口号(不同节点使用不同的端口号)
    port 7001 

    # 以守护进程运行（后台运行redis） 
    daemonize yes 

    # 服务启动后记录线程号的文件
    pidfile "redis.pid" 

    # 日志
    logfile "/opt/app/redis/cluster/redis-6.2.3/conf/7001/log.log" 

    # 数据库的个数 
    databases 16 

    # 设置数据保存到数据文件中的save规则,3600秒内修改1次key,进行一次磁盘保存操作 
    save 3600 1 
    save 300 100
    save 60 10000 

    # 指定存储至本地数据库时是否压缩数据，默认是yes，redis采用LZF压缩，需要消耗CPU资源 
    rdbcompression yes 

    # 保存rdb文件时，是否对rdb文件进行校验
    rdbchecksum yes 

    # 保存数据的文件名字 
    dbfilename "dump.rdb"

    # 保存数据的目录，这个目录需要提前创建出来
    dir "/opt/app/redis/cluster/redis-6.2.3/conf/7001" 

    # 是否开启aof持久化
    appendonly yes 

    # aof文件名字 
    appendfilename "appendonly.aof" 

    # 集群配置文件,自动生成,不能人为维护 
    cluster-config-file "nodes.conf"

    #开启cluster集群
    cluster-enabled yes

    #Redis集群节点超时时限
    cluster-node-timeout 15000
    ```
1. 将这个配置文件，复制5份到 7002 7003 7004 7005 7006 目录下
1. 启动redis服务：

    ```bash
    redis-server 7001/redis.conf
    redis-server 7002/redis.conf
    redis-server 7003/redis.conf
    redis-server 7004/redis.conf
    redis-server 7005/redis.conf
    redis-server 7006/redis.conf
    ```
1. 使用 `redis-cli --cluster` 搭建集群，注意下面的IP，建议使用具体的IP，不要使用`127.0.0.1`，防止有坑

    ```bash
    # 确认启动集群信息，交互输入yes
    redis-cli  --cluster create 192.168.3.100:7001  192.168.3.100:7002  192.168.3.100:7003  192.168.3.100:7004  192.168.3.100:7005  192.168.3.100:7006  --cluster-replicas  1
    ```
1. 集群就搭建好了，可以测试一下，连接集群，注意下面的命令，一定要带上 `-c` ，表示以集群的模式访问

    ```bash
    redis-cli -c -p 7001
    # 之后正常使用redis get set等命令
    ```
1. 如果集群中，其中一个节点挂掉，从节点会自动变为主节点，若原主节点重连，会自动变为从节点
1. 关闭集群
    
    ```bash
    redis-cli -c -p 7001 shutdown
    redis-cli -c -p 7002 shutdown
    redis-cli -c -p 7003 shutdown
    redis-cli -c -p 7004 shutdown
    redis-cli -c -p 7005 shutdown
    redis-cli -c -p 7006 shutdown
    # 删除集群数据，到对应6个目录下执行
    rm -rf appendonly.aof dump.rdb log.log nodes.conf
    ```

### 集群扩容

增加两个节点，7007和7008，7007作为新增的主节点，7008作为7007的从节点

* 把7001的配置文件，复制给7007和7008，并把配置文件里面的7001，全部替换成7007和7008。
* 扩容时，先增加主节点，再增加从节点

```bash
##### 增加主节点 ######
# 启动主节点
redis-server conf/7007/redis.conf
# 向集群中增加主节点
redis-cli --cluster add-node 192.168.3.100:7007 192.168.3.100:7001
# 新增的节点，已成为集群中的主节点，但还没有给新主节点分配槽，0~16383（共16384个）这个范围的槽，全部被分配在了原来的三个主节点上，即使现在向集群中set数据，数据仍会被分配到原来的三个主节点上。
# 为新增的主节点分配槽，执行以下命令
redis-cli --cluster reshard 192.168.3.100:7001
# 此时会询问给新增master节点分配多少个槽，总共16384个，平均分配给4个主节点，每个节点分配4096，就输入4096
# 然后询问接收节点的ID，输入新增的master节点的ID
# 然后输入从哪几个节点来分，输入前三个主节点的ID，最后输入done表示结束。
# 输入yes开始数据迁移，等待结束

# 检查分配的槽情况
redis-cli --cluster check 192.168.3.100:7001

###### 增加从节点 #######
# 启动从节点
redis-server  conf/7008/redis.conf
# 将新增的节点7008，加入到集群中，暂时作为主节点
redis-cli --cluster add-node 192.168.3.100:7008 192.168.3.100:7001
# 将新节点7008，挂接到集群的7007主节点上，作为其从节点。在7008的客户端里面执行以下命令，最后面的ID是主节点7007的ID：
127.0.0.1:7008> cluster replicate 1d708c5042d53b6bc1e855ea41755782b6692e1a
# 查看状态、测试
127.0.0.1:7008> cluster nodes
```

### 集群缩容

缩容的步骤，正好与扩容相反，先删除从节点，再将主节点的槽，分配给其他三个主节点的其中一个，然后删除主节点

以删除7008从节点为例，使用`redis-cli --cluster del-node`命令删除从节点，`192.168.3.100:7001` 表示要从哪个集群删除（注意这并不是要删除的节点IP和端口），后面的`cd26feeb271c1260ec134d85dcdeaf4c72bfc3ad`才表示要删除的节点ID，也就是7008的ID

```bash
redis-cli --cluster del-node 192.168.3.100:7001 cd26feeb271c1260ec134d85dcdeaf4c72bfc3ad
# 再查看集群状态，集群中已经没有7008节点了，但是7008的服务还启动着，现在就可以关掉了
127.0.0.1:7001 > cluster nodes
# 关掉7008服务
redis-cli -p 7008 shutdown
# 将要删除的主节点的槽分配给其他主节点
redis-cli reshard 192.168.3.100:7001
# 交互输入，移动的槽的个数，即7007的4096个槽
# 输入接收的节点id，即7001的id
# 槽从哪个主节点移走，即7007的节点id
# 输入done表示结束
# 输入yes开始迁移数据

# 查看集群状态
redis-cli --cluster check 192.168.3.100:7001
# 看到7007节点已经没有槽了说明已经移除成功

# 删除主节点
redis-cli --cluster del-node 192.168.3.100:7001 1d708c5042d53b6bc1e855ea41755782b6692e1a
# 关闭7007服务
reids-cli -p 7007 shutdown
```