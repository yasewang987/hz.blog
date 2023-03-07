# Redis数据同步

## RedisShake介绍

* `RedisShake`是基于`redis-port`基础上进行改进的是一款开源的Redis迁移工具，支持Cluster集群的在线迁移与离线迁移（备份文件导入）。数据可平滑迁移，当部署在其他云厂商Redis服务上的Cluster集群数据，由于SYNC、PSYNC命令被云厂商禁用，无法在线迁移时，可以选择离线迁移。

* 如果源端是集群版，可以启动一个`RedisShake`，从不同的db结点进行拉取，同时源端不能开启`move slot`功能；对于目的端，如果是集群版，写入可以是1个或者多个db结点。

### 功能说明
`RedisShake`主要是支持Redis的`RDB`文件的解析、恢复、备份、同步四个功能：

* 恢复（`restore`）：将 RDB 文件恢复到目标Redis数据库。
* 备份（`dump`）：将源 Redis 的全量数据通过RDB文件备份起来。
* 解析（`decode`）：读取 RDB 文件，并以 JSON 格式解析存储。
* 同步（`sync`）：支持源redis和目的redis的数据同步，支持全量和增量数据的迁移，支持从云下到阿里云云上的同步，也支持云下到云下不同环境的同步，支持单节点、主从版、集群版之间的互相同步。
* 同步（`rump`）：支持源 Redis 和目的 Redis 的数据同步，仅支持全量迁移。采用scan和restore命令进行迁移，支持不同云厂商不同redis版本的迁移。

### 特性
* 高性能：全量同步阶段并发执行，增量同步阶段异步执行，能够达到毫秒级别延迟（取决于网络延迟）。同时，我们还对大key同步进行分批拉取，优化同步性能。
* 在 Redis 5.0、Redis 6.0 和 Redis 7.0 上测试
* 支持使用lua自定义过滤规则
* 支持大实例迁移
* 支持restore模式和sync模式
* 支持阿里云 Redis 和 ElastiCache
* 监控体系：用户可以通过我们提供的restful拉取metric来对redis-shake进行实时监控：curl 127.0.0.1:9320/metric。
* 数据校验：如何校验同步的正确性？可以采用我们开源的redis-full-check。
* 支持版本：支持2.8-5.0版本的同步，此外还支持codis，支持云下到云上，云上到云上，云上到云下（阿里云目前支持主从版），其他云到阿里云等链路，帮助用户灵活构建混合云场景。
* 断点续传。支持断开后按offset恢复，降低因主备切换、网络抖动造成链路断开重新同步拉取全量的性能影响。

## 执行过程
1. 启动`Redis-shake`进程，这个进程模拟了一个 Redis 实例，`Redis-shake`的基本原理就是模拟一个`Slave`从节点加入`源Redis`集群，然后进行增量的拉取（通过`psync`命令）。
1. `Redis-shake`进程和数据迁出的源实例进行数据的全量拉取同步，并回放，这个过程和 `Redis` 主从实例的全量同步是类似的。如下图所示。

![sync1](http://cdn.go99.top/docs/devops/redis/sync1.webp)

详细分析上述同步原理
1. 源Redis服务实例相当于主库，Redis-shake相当于从库，它会发送psync指令给源Redis服务实例。
1. 源Redis实例先把RDB文件传输给 Redis-shake ，Redis-shake 会把RDB文件发送给目的实例。
1. 源实例会再把增量命令发送给 Redis-shake ，Redis-shake负责把这些增量命令再同步给目的实例。

如果源端是集群模式，只需要启动一个redis-shake进行拉取，同时不能开启源端的move slot操作。如果目的端是集群模式，可以写入到一个结点，然后再进行slot的迁移，当然也可以多对多写入。

目前，redis-shake到目的端采用单链路实现，对于正常情况下，这不会成为瓶颈，但对于极端情况，qps比较大的时候，此部分性能可能成为瓶颈，后续我们可能会计划对此进行优化。另外，redis-shake到目的端的数据同步采用异步的方式，读写分离在2个线程操作，降低因为网络时延带来的同步性能下降。

## RedisShake安装
主要有两种方式：下载Release版本的可执行二进制包、下载源码文件进行编译操作这两种方式。

下载地址：https://github.com/alibaba/RedisShake/releases

可以直接下载对应的包直接使用，也可以下载源码编译

```bash
# 源码编译
git clone https://github.com/alibaba/RedisShake
cd RedisShake
sh build.sh
```

首先如果需要进行同步和重放，则需要进行编辑`sync.toml`文件以及编辑`restore.toml`.

* redis-shake 支持三种数据迁移模式：`sync、restore 和 scan`
* 快速开始：数据迁移（使用 `sync` 模式）
* 快速开始：从`dump.rdb`恢复数据（使用 `restore` 模式）
* 快速开始：数据迁移（使用 `scan` 模式）
* 使用 `filters` 做数据清洗
* 运行日志
* 运行监控

## RedisShake在线同步

编辑`sync.toml`,可以进行配置我们实际情况下的`source`源`redis`实例以及`target`目标`redis`实例。之后可以配置对应的cpu和相关性能的配置。下面针对于配置进行相关的配置介绍

```ini
type = "sync" # 同步机制实现

[source] # 源Redis服务实例
version = 5.0 # 填写Redis源服务版本, 例如：2.8, 4.0, 5.0, 6.0, 6.2, 7.0, ...。
address = "127.0.0.1:6379" # 源Redis服务实例 地址+端口
username = "" # 如果Redis没有配置ACL，则可以不填写，否则需要填写用户名 
password = "" # 如果Redis没有配置ACL，则可以不填写，否则需要填写密码
tls = false # 是否开启tls安全机制
elasticache_psync = "" # 是否支持AWS的elasticache

[target]
type = "standalone" # 选择Redis的类型："standalone：单机模式" or "cluster：集群模式"
version = 5.0  # 填写Redis源服务版本, 例如：2.8, 4.0, 5.0, 6.0, 6.2, 7.0, ...。
# 如果目标Redis服务实例属于cluster集群模式, 那么可以写入其中一个节点的地址和端口.
# redis-shake 会通过`cluster nodes` 命令获取其他的节点地址和端口
address = "127.0.0.1:6380" # 填写的对应的ip加端口
username = "" # 如果Redis没有配置ACL，则可以不填写，否则需要填写用户名 
password = "" # 如果Redis没有配置ACL，则可以不填写，否则需要填写密码
tls = false # 是否开启tls安全机制

[advanced]
dir = "data" # 数据同步的存储目录

# 设置使用的最大CPU核心数, 如果设置了0 代表着 使用 runtime.NumCPU() 实际的cpu cores数量
ncpu = 4

# 开启pprof性能检测的port, 0代表着禁用
pprof_port = 0 

# 开启metric port端口, 0代表着禁用
metrics_port = 0

# log的相关设置
log_file = "redis-shake.log" # 设置对应的日志文件名称
log_level = "info" # debug, info or warn # 设置对应的日志级别
log_interval = 5 # in seconds # 日志打印频次

# redis-shake gets key and value from rdb file, and uses RESTORE command to
# create the key in target redis. Redis RESTORE will return a "Target key name
# is busy" error when key already exists. You can use this configuration item
# to change the default behavior of restore:
# panic:   redis-shake will stop when meet "Target key name is busy" error.
# rewrite: redis-shake will replace the key with new value.
# ignore:  redis-shake will skip restore the key when meet "Target key name is busy" error.
rdb_restore_command_behavior = "rewrite"  # restore的操作类型：panic, rewrite or skip

# pipeline的大小数量阈值
pipeline_count_limit = 1024

# Client query buffers accumulate new commands. They are limited to a fixed
# amount by default. This amount is normally 1gb.
target_redis_client_max_querybuf_len = 1024_000_000

# In the Redis protocol, bulk requests, that are, elements representing single
# strings, are normally limited to 512 mb.
target_redis_proto_max_bulk_len = 512_000_000
```

### Redis单机实例同步到Redis单机实例

配置`sync.toml`

```ini
[source]
address = "ip:6379"
password = ""

[target]
type = "standalone"
address = "ip:6379"
password = "r-bbbbb:xxxxx"
```

* 启动 redis-shake

```bash
./redis-shake sync.toml
```

### Redis单机实例同步到Redis集群实例

```ini
[source]
address = "r-aaaaa.redis.zhangbei.rds.aliyuncs.com:6379"
password = "r-aaaaa:xxxxx"

[target]
type = "cluster"
address = "192.168.0.1:6379" # 这里写集群中的任意一个节点的地址即可
password = "r-ccccc:xxxxx"
```

* 启动

```bash
./redis-shake sync.toml
```

### Redis集群实例同步到Redis集群实例

方法1：手动起多个 redis-shake

集群C有四个节点：

  * 192.168.0.1:6379
  * 192.168.0.2:6379
  * 192.168.0.3:6379
  * 192.168.0.4:6379

把4个节点当成4个单机实例，参照单机到集群 部署 4 个 redis-shake 进行数据同步。不要在同一个目录启动多个 redis-shake，因为 redis-shake 会在本地存储临时文件，多个 redis-shake 之间的临时文件会干扰，正确做法是建立多个目录。

方法2：借助 `cluster_helper.py` 启动

脚本[cluster_helper.py](https://github.com/alibaba/RedisShake/blob/v3/scripts/cluster_helper/cluster_helper.py)可以方便启动多个redis-shake从集群迁移数据，效果等同于方法1。

注意事项：
> 源端有多少个分片，cluster_helper.py 就会起多少个 redis-shake 进程，所以如果源端分片数较多的时候，需要评估当前机器是否可以承担这么多进程。

> cluster_helper.py 异常退出的时候，可能没有正常退出 redis-shake 进程，需要 ps aux | grep redis-shake 检查。

> 每个 redis-shake 进程的执行日志记录在 RedisShake/cluster_helper/data/xxxxx 中，反馈问题请提供相关日志。

Python 需要 python3.6 及以上版本，安装 Python依赖：

```bash
cd RedisShake/cluster_helper
pip3 install -r requirements.txt
```
* 修改 sync.toml:
```ini
type = "sync"

[source]
address = "192.168.0.1:6379" # 集群 C 中任意一个节点地址
password = "r-ccccc:xxxxx"

[target]
type = "cluster"
address = "192.168.1.1:6380" # 集群 D 中任意一个节点地址
password = "r-ddddd:xxxxx"
```
* 启动
```go
cd RedisShake/cluster_helper
// 参数 1 是 redis-shake 可执行程序的路径
// 参数 2 是配置文件路径
python3 cluster_helper.py ../redis-shake ../sync.toml
```
* 查看redis-shake的日志信息
```bash
[root@redis ~]# redis-shake ./redis-shake.toml
2022-08-26 11:20:28 INF GOOS: linux, GOARCH: amd64
2022-08-26 11:20:28 INF Ncpu: 3, GOMAXPROCS: 3
2022-08-26 11:20:28 INF pid: 21504
2022-08-26 11:20:28 INF pprof_port: 0
2022-08-26 11:20:28 INF No lua file specified, will not filter any cmd.
2022-08-26 11:20:28 INF no password. address=[127.0.0.1:6380]
2022-08-26 11:20:28 INF redisWriter connected to redis successful. address=[127.0.0.1:6380]
2022-08-26 11:20:28 INF no password. address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF psyncReader connected to redis successful. address=[127.0.0.1:6379]
2022-08-26 11:20:28 WRN remove file. filename=[4200.aof]
2022-08-26 11:20:28 WRN remove file. filename=[dump.rdb]
2022-08-26 11:20:28 INF start save RDB. address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF send [replconf listening-port 10007]
2022-08-26 11:20:28 INF send [PSYNC ? -1]
2022-08-26 11:20:28 INF receive [FULLRESYNC 1db7c7618b6d0af25ffafb1645d4fba573624d02 0]
2022-08-26 11:20:28 INF source db is doing bgsave. address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF source db bgsave finished. timeUsed=[0.09]s, address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF received rdb length. length=[194]
2022-08-26 11:20:28 INF create dump.rdb file. filename_path=[dump.rdb]
2022-08-26 11:20:28 INF save RDB finished. address=[127.0.0.1:6379], total_bytes=[194]
2022-08-26 11:20:28 INF start send RDB. address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF RDB version: 8
2022-08-26 11:20:28 INF RDB AUX fields. key=[redis-ver], value=[4.0.14]
2022-08-26 11:20:28 INF RDB AUX fields. key=[redis-bits], value=[64]
2022-08-26 11:20:28 INF RDB AUX fields. key=[ctime], value=[1661484028]
2022-08-26 11:20:28 INF RDB AUX fields. key=[used-mem], value=[1897096]
2022-08-26 11:20:28 INF RDB repl-stream-db: 0
2022-08-26 11:20:28 INF RDB AUX fields. key=[repl-id], value=[1db7c7618b6d0af25ffafb1645d4fba573624d02]
2022-08-26 11:20:28 INF RDB AUX fields. key=[repl-offset], value=[0]
2022-08-26 11:20:28 INF RDB AUX fields. key=[aof-preamble], value=[0]
2022-08-26 11:20:28 INF RDB resize db. db_size=[1], expire_size=[0]
2022-08-26 11:20:28 INF send RDB finished. address=[127.0.0.1:6379], repl-stream-db=[0]
2022-08-26 11:20:28 INF start save AOF. address=[127.0.0.1:6379]
2022-08-26 11:20:28 INF AOFWriter open file. filename=[0.aof]
2022-08-26 11:20:29 INF AOFReader open file. aof_filename=[0.aof]
2022-08-26 11:20:33 INF syncing aof. allowOps=[0.20], disallowOps=[0.00], entryId=[0], unansweredBytesCount=[0]bytes, diff=[0], aofReceivedOffset=[0], aofAppliedOffset=[0]
2022-08-26 11:20:38 INF syncing aof. allowOps=[0.20], disallowOps=[0.00], entryId=[1], unansweredBytesCount=[0]bytes, diff=[0], aofReceivedOffset=[14], aofAppliedOffset=[14]
2022-08-26 11:20:43 INF syncing aof. allowOps=[0.00], disallowOps=[0.00], entryId=[1], unansweredBytesCount=[0]bytes, diff=[0], aofReceivedOffset=[14], aofAppliedOffset=[14]
2022-08-26 11:20:48 INF syncing aof. allowOps=[0.20], disallowOps=[0.00], entryId=[2], unansweredBytesCount=[0]bytes, diff=[0], aofReceivedOffset=[28], aofAppliedOffset=[28]
```

## RedisShake离线同步

### save/bgsave导出RDB+Redis-Shake进行迁移

1. 基于redis自身的`RDB/AOF` 备份机制，执行`save\bgsave`触发数据持久化 RDB文件，拷贝redis备份文件（`dump.rdb`）到目标机器，重启目标实例重新`load RDB` 文件。
1. 将上一步导出`dump.rdb`文件放到目标Redis服务所在的服务器的路径为：`/root/dump.rdb`

* 迁移到目标实例为单节点服务

需要使用`restore.toml`文件，进行编辑，从而进行执行执行文件进行迁移重放数据

```ini
type = "restore"

[source]
rdb_file_path = "/root/dump.rdb"

[target]
type = "standalone"
address = "127.0.0.1:6379"
password = "r-aaaaa:xxxxx"
```

启动

```bash
redis-shake restore.toml
```

* 迁移到目标实例为集群实例服务

修改 restore.toml 为：

```ini
type = "restore"
[source]
rdb_file_path = "/root/dump.rdb"

[target]
type = "cluster"
address = "192.168.0.1:6379" # 这里写集群中的任意一个节点的地址即可
password = "r-ccccc:xxxxx"
```

启动

```bash
redis-shake restore.toml
```

### 基于redis-dump导入导出 json备份

`redis-dump`基于`JSON` 备份还原Redis的数据：https://github.com/delano/redis-dump

```bash
# 下载和运行redis-dump
git clone https://github.com/delano/redis-dump.git
$ cd redis-dump
$ gem install redis
$ gem install uri-redis
$ gem install yajl-ruby
$ gem install drydock
$ ruby -r rubygems bin/redis-dump

# 导出
redis-dump –u 127.0.0.1:6379 > dump.json
# 导出指定数据库数据
redis-dump -u 127.0.0.1:6379 -d 15 > dump.json
# 有密码导出
redis-dump –u :password@127.0.0.1:6379 > dump.json

# 导入
dump.json redis-load
# 有密码导入
dump.json redis-load -u :password@127.0.0.1:6379
```






