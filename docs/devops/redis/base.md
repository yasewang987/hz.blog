# Redis基本原理

## Redis常识

* Redis是单线程的吗？

    Redis在读写操作的时候是单线程的，但是其它功能，例如持久化、异步删除、集群数据同步等是有额外的线程执行的。

* Redis执行命令为什么选择单线程？

    并发线程安全问题 - 需要保证操作的先后顺序，需要保证同一时刻只能有1个线程对某个对象进行写操作 —— 需要构建完备的同步保护机制，会对整体性能造成影响。

    多线程维护的系统额外开销 - CPU需要不停的在多个线程之间进行切换，由此会带来一系列的额外开销。

* Redis单线程如何处理并发客户端连接？

    Redis利用`epoll`来实现`IO多路复用`，将连接信息和事件放到队列中，依次放到`文件事件分派器`中，事件分派器将事件分发给`事件处理器`。

* 使用注意事项：

    * 不能执行耗时操作，会阻塞其余请求命令的执行。
    * redis是单线程执行，如果服务器是多核CPU并且其他资源足够，可以部署多个redis组成集群对外提供服务，充分利用多核。

* Redis如何查询所有key？

    ```bash
    # 查询所有key
    keys *
    # 查询name开头的所有key（生成环境不建议，数据量大这个操作比较耗时）
    keys name*
    # 因为Redis读写是单线程的，我们可以使用scan命令渐进式读取数据,如果在scan的过程中有新的数据变化，例如插入数据，删除数据等，那么新增的键可能没有遍历到，因为scan遍历过的地方就不在遍历了，你插入到遍历过的地方就不会再遍历到。
    # scan [游标] match [通配符] count [每一次查询的数量] （初始查询的时候游标为0，然后第二次查询游标为第一次查询时返回的数据，依次类推,最后游标返回0时表示查询完毕）
    # Redis中一共有9条数据，我每次查询3条，分三次查询完毕。
    scan 0 match * count 3
    1) "1"
    2) 1) "key1"
       2) "key2"
       3) "key3"
       4) "key4"
    scan 1 match * count 3
    1) "3"
    2) 1) "key5"
       2) "key6"
       3) "key7"
    scan 3 match * count 3
    1) "0"
    2) 1) "key8"
       2) "key9"
    ```

## Redis基本数据类型及使用场景

redis一共有五种基础数据类型：`String,Hash,List,Set,ZSet`

3 种特殊数据结构 ：`HyperLogLogs`（基数统计）、`Bitmap`（位存储）、`Geospatial`(地理位置)。

### String

```bash
# 单值存储
set key1 value1
# 设置值+过期时间
setex key1 5 value1
# 单值获取
get key1
# 多值存储
mset key1 value1 key2 value2
# 多值获取
mget key1 key2

#### 分布式锁
# 上锁，返回1表示成功，0表示失败
setnx lock true
# 释放锁
del lock
# 设置超时时间
expire lock 10
# 如果上完锁在给锁设置超时时间之间出现异常，还是会导致锁无法删除，那么将上锁命令和设置超时时间命令合为一个命令
# 实现原子性分布式锁加锁并设置超时时间
set lock true ex 10 nx

#### 登录验证码存储
# 将验证码信息存储在redis中并设定5分钟后自动过期。这样的话就可以实现超时失效的功能，而无需业务层面去维护过期信息。
set code 112233
expire code 300

### incrby
# 将其用作全局唯一ID的生成，以保证各个节点之间生成的唯一ID不会冲突
# incrby可以实现全局请求量的统计计数，结合expire一起可以实现定时重置计数器，进而实现限流能力
incr index
1
incr index
2
incr index
3
# 取值
get index
# 批量计数
incrby index 100
103
incrby index -1
102
```

### Hash

购物车例子

```bash
# 购物车添加一个苹果
hset goods app 1
# 添加一本书
hset goods book 1
# 添加一个香蕉
hset goods banana 1
# 再添加一个苹果
hincrby goods app 1
2
# 获取商品种类数量
hlen goods
3
# 获取所有商品
hgetall goods
"app"
"2"
"book"
"1"
"banana"
"1"
# 删除商品
hdel goods app 
```

### List

```bash
# 将一个值放入列表的头部（最左边）：lpush [key] [value]
lpush list value1
lpush list value2
lpush list value3
# 移除并返回列表的头元素：lpop [key]
lpop list
value1

# 将一个值放入列表的尾部（最右边）：rpush [key] [value]
rpush list value4
# 移除并返回列表的尾元素：rpop [key]
rpop list
value4

# 返回列表中指定区间内的元素：lrange [key] [开始位置] [结束位置]
lrange list 0 1
"value2"
"value3"

# 可以使用这个来实现消息队列，但是缺陷是不支持消费者组。
# 从列表表头弹出一个元素，若列表中没有元素，阻塞等待time秒，如果time=0，一直阻塞等待
blpop list 10
nil
10.01s
# 从列表表尾弹出一个元素，若列表中没有元素，阻塞等待time秒，如果time=0，一直阻塞等待
brpop list 10
nil
10.03s
```

### Set

```bash
# 往集合key中存入元素，元素存在则忽略，若key不存在则新建：`sadd [key] [元素]`
# 模仿一个抽奖的业务场景，先往集合中放入要抽奖的人
sadd prize name1
sadd prize name2
sadd prize name3
sadd prize name4
sadd prize name5

# 从集合key中随机选取几个元素，元素不从集合中删除：srandmember [key] [元素个数] （这里我们抽两个奖项）
srandmember prize 2
"name2"
"name4"

# 获取集合key中所有元素：smembers [key]
smembers prize
"name1"
"name2"
"name3"
"name4"
"name5"

# 获取集合key中元素的个数：scard [key]
scard prize
5

# 判断一元素是否存在于集合中：sismember [key] [元素]
sismember prize name2
1

# 从集合中删除元素：srem [key] [元素]
srem prize name1

# 从集合中随机选出几个元素，并且删除：spop [key] [元素个数] （例如我们抽奖的时候先抽了三等奖，那么抽二等奖的时候三等奖的人就没有资格了，就要将三等奖的人删除）
spop prize 2
"name3"
"name5"

# 交集运算：sinter [key] [元素]
sinter prize name7
empty list or set
# 将交集结果存入新集合key2中：sinterstore [key2] [key] [元素]
sinterstore key2 prize name7
0

# 并集运算：sunion [key] [元素]
sunion prize name1
"name1"
# 将并集结果存入新集合key2中：sunionstore [key2] key [元素]
sunionstore key2 prize name1
1

# 差集运算：sdiff [key] [运算]
sdiff prize name1
"name1"
# 将差集结果存入新集合key2中：sdiffstore [key2] [key] [元素]
sdiffstore key2 prize name1
1
```

### ZSet

可以理解为一种比较特殊的hash结构，含有member和score两个概念，对应到hash类型上分别是key与value的关系，其区别点在在于score是固定的double类型的value

```bash
# 往有序集合key中加入带分值的元素：zadd [key] [分值] [元素] （利用分值，业务中我们可以用来实现例如微博热搜排行的功能）
zadd ranking 100 name1
zadd ranking 80 name2
zadd ranking 59 name3

# 返回有序集合key中元素的分值：zscore [key] [元素]
zscore ranking name3
"59"

# 返回有序集合key中元素的个数：zcard [key]
zcard ranking
3

# 为有序集合key中元素的分值加上一个分值：zincrby [key] [分值] [元素]
zincrby ranking 20 name3
"79"

# 正序获取有序集合key从开始下标到结束下标的元素：zrange [key] [开始] [结束]
zrange ranking 0 2
"name3"
"name2"
"name1"

# 倒叙获取有序集合key从开始下标到结束下标的元素：zrevrange [key] [开始下标] [结束下标] （这里就是例如微博热搜榜中根据热度倒叙排序获取前十个）
zrevrange ranking 0 2
"name1"
"name2"
"neme3"

# 从有序集合key中删除元素：zrem [key] [元素]
zrem ranking name3
1
```
## Redis数据淘汰策略

数据淘汰策略|具体含义说明
---|---
noeviction|淘汰新进入的数据，即拒绝新内容写入缓存，直到缓存有新的空间。
allkeys-lru|将内存中已有的key内容按照LRU策略将最久没有使用的记录淘汰掉，然后腾出空间用来存放新的记录。
volatile-lru|从设置了过期时间的key里面按照LRU策略，淘汰掉最久没有使用的记录。与allkeys-lru相比，这种方式仅会在设定了过期时间的key里面进行淘汰。
allkeys-random|从已有的所有key里面随机剔除部分，腾出空间容纳新数据。
volatile-random|从已有的设定了过期时间的key里面随机剔除部分，腾出空间容纳新的数据
volatile-ttl|从已有的设定了过期时间的key里面，将最近将要过期的数据提前剔除掉，与volatile-lru的区别在于排序逻辑不一样，一个基于ttl规则排序，一个基于lru策略排序。
volatile-lfu|从已设置过期时间的数据集（server.db[i].expires）中挑选最不经常使用的数据淘汰
allkeys-lfu|当内存不足以容纳新写入数据时，在键空间中，移除最不经常使用的 key

## Redis持久化

Redis主要有两种持久化方式，一种是`RDB`（快照）方式，另一种是`AOF`格式。

* `RDB`（快照）: 可以理解我想知道目前一个人的姿势是什么样子的，那么我就给他拍一张照片，那么照片上就是他这个人的姿势。

* `AOF`: 理解为动作的描述，我通过对这个人每一个动作的描述来知道这个人的姿势是什么样子的，比如这个人左手六、右手七、左脚画圆、右脚踢，那么我通过这些动作就知道这个人目前的姿势。

### RDB

`RDB`快照就相当于将`Redis`中的数据保存了下来，恢复的时候只需要将照片拿出来，人根据姿势恢复就行了。

`RDB`在`redis.conf`目录中进行配置，命令格式为 `save [时间] [次数]`

```conf
save 900 1
save 300 10
# 如果在60秒内有至少10000条改动，那么就自动保存一次，也就是拍一张照片，那么中间如果改动到500条的时候Redis挂了，那么这500条改动就找不到了
save 60 10000
```

如果执行`save`命令会造成`Redis`正常读写受到影响，我们可以用`bgsave`（写时复制）命令来生成`RDB`快照，`bgsave`是用一个子线程来实现快照功能，主线程继续他的读写任务。

### AOF

`AOF`相当于将`Redis`中的每一条执行命令记录了下来，恢复的时候需要根据命令一条一条的来，先左手六、再右手七、再左脚画圆、再右脚踢...

使用`AOF`来保存数据就不会有`RDB`快照中`Redis`宕机所产生的风险了，因为`AOF`保存的是每一条命令，但是`AOF`也并不是只能每一条命令就保存一次，这样会耗费性能，我们可以设置为`每1秒`执行一次保存，这样就算丢失也只会丢失1秒的数据

通过配置文件中的`appendonly`设置为`yes`来开启AOF功能:

```conf
appendonly yes

# AOF有三个保存策略
## 每次有新命令就保存下来，性能最慢，但是最安全
appendfsync always
## （推荐）每秒保存一次命令，足够快，故障时只会丢失1秒钟的数据
appendsync everysec
## 从不保存，将数据交给操作系统来处理。更快，也更不安全
appendfsync no
```

* AOF重写

`AOF`文件中有太多没用的指令，所以`AOF`会定期根据内存的最新数据生成`AOF`文件, 例如我们记录一个人的动作，发现他先抬手，再放下手、然后再抬手，那我我们可以将动作合并为一个动作就是抬手，因为执行抬手，放手，抬手三个动作和只执行一个抬手的动作是一样的。

配置`AOF`重写的频率，有两个配置项

```conf
# aof文件自上一次重写后文件大小增长了100%则再次触发重写
auto-aof-rewrite-percentage 100 
# aof文件至少要达到64M才会自动重写，文件太小恢复速度本来就很快，重写的意义不大
auto-aof-rewrite-min-size 64mb 
```

手动重写，命令为：`bgrewriteaof`，此时也会使用一个子进程来重写，不会对`redis`的正常命令有影响

### RDB和AOF混合使用

在redis启动的时候如果即配置`RDB`又配置`AOF`，则优先使用`AOF`，因为`AOF`更加安全，但是性能不太好，但是我们可以混合使用，达到更好的效果

将`RDB`和`AOF`混合使用，例如恢复的时候先根据照片恢复最后一次拍照记录的样子，然后再恢复拍照后记录的动作，配置开启混合使用：`aof‐use‐rdb‐preamble yes`

## Redis集群

### 主从

redis的主从架构模式其实是用一个redis节点来做写操作（主节点），多个redis节点来做读操作（从节点），主节点会将写入的数据同步给从节点，以保证从从节点读取的数据是最新的数据

搭建方式：主节点不用修改任何配置，从节点修改`redis.conf`配置文件

```conf
replicaof 192.168.1.10 6379
```

配置好从节点后启动从节点，这个时候启动从节点，从节点会从主节点去初次获取数据

![1](http://cdn.go99.top/docs/devops/redis/1.png)

### 哨兵

哨兵架构是在主从架构上衍生出来的，因为主从架构中如果主节点挂了，那么我们就不能够写入数据了，只能从从节点中读取数据，这样是很不方便的。那么我们弄一个`哨兵集群`来监视这些节点，当主节点挂了以后我们哨兵`选举一个从节点`成为主节点，并让写数据的命令得以继续执行

![2](http://cdn.go99.top/docs/devops/redis/2.png)

搭建：复制一份`sentinel.conf`文件进行修改，redis中默认有这个文件，修改端口号，以及`sentinel`命令，格式为：`sentinel monitor <主节点名称> <端口> <quorum>`

```conf
# sentinel.conf
sentinel monitor mymaster 192.168.1.10 6379 2
```

* `quorum`: 意思是有多少个`sentinel`认为这个主节点失效时才算真正的失效，比如配置了三个`sentinel`，那么这里`2`的含义就是有两个`sentinel`认为当前主节点失效就算失效了。