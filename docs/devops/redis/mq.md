# Redis实现消息队列

## Streams

Streams 是 Redis 专门为消息队列设计的数据类型。

* 是可持久化的，可以保证数据不丢失。
* 支持消息的多播、分组消费。
* 支持消息的有序性。

```bash
# XADD：插入消息，保证有序，可以自动生成全局唯一ID,如果指定的队列不存在，则创建一个队列
XADD key ID field value [field value ...]
# key：队列名称
# ID：消息 id，我们使用 * 表示由 redis 生成，可以自定义，但是要自己保证递增性
# field value：记录
XADD teststream * name1 value1 name2 value2
"1646650328883-0"

# XREAD：用于读取消息，可以按ID读取数据，以阻塞或非阻塞方式获取消息列表
XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id [id ...]
# count：数量，不赋值读取全部
# milliseconds：可选，阻塞毫秒数，没有设置就是非阻塞模式
# key：队列名
# id：消息 ID
XREAD BLOCK 100 STREAMS  teststream 0
1) 1) "teststream"
   2) 1) 1) "1646650328883-0"
         2) 1) "name1"
            2) "value1"
            3) "name2"
            4) "value"

# XGROUP CREATE： 创建消费者组
XGROUP [CREATE key groupname id-or-$] [SETID key groupname id-or-$] [DESTROY key groupname] [DELCONSUMER key groupname consumername]
# key：队列名称，如果不存在就创建
# groupname：组名
# $：表示从尾部开始消费，只接受新消息，当前 Stream 消息会全部忽略
# 从头开始消费
XGROUP CREATE teststream test-consumer-group-name 0-0
# 从尾部开始消费
XGROUP CREATE teststream test-consumer-group-name $

# XREADGROUP GROUP 读取消费组中的消息
XREADGROUP GROUP group consumer [COUNT count] [BLOCK milliseconds] [NOACK] STREAMS key [key ...] ID [ID ...]
# group：消费组名
# consumer：消费者名
# count：读取数量
# milliseconds：阻塞毫秒数
# key：队列名
# ID：消息 ID
XADD teststream * name xiaohong surname xiaobai
"1646653392799-0"
XREADGROUP GROUP test-consumer-group-name test-consumer-name COUNT 1 STREAMS teststream >
1) 1) "teststream"
   2) 1) 1) "1646653392799-0"
         2) 1) "name"
            2) "xiaohong"
            3) "surname"
            4) "xiaobai"
# 消息队列中的消息一旦被消费组里的一个消费者读取了，就不能再被该消费组内的其他消费者读取了。
# 如果没有通过 XACK 命令告知消息已经成功消费了，该消息会一直存在，可以通过 XPENDING 命令查看已读取、但尚未确认处理完成的消息。
# XPENDING: 用来查询每个消费组内所有消费者已读取但尚未确认的消息
XPENDING teststream test-consumer-group-name
1) (integer) 3
2) "1646653325535-0"
3) "1646653392799-0"
4) 1) 1) "test-consumer-name"
      2) "3"

# XACK: 用于向消息队列确认消息处理已完成
```

## 发布订阅（pub/sub）

消息无法持久化，如果出现网络断开、Redis 宕机等，消息就会被丢弃，分发消息，无法记住历史消息

Redis 发布订阅(`pub/sub`)是一种消息通信模式：发送者(`pub`)发送消息，订阅者(`sub`)接收消息。

```bash
PSUBSCRIBE pattern [pattern ...]
订阅一个或多个符合给定模式的频道。
psubscribe p-test*

PUBSUB subcommand [argument [argument ...]]
查看订阅与发布系统状态。

PUBLISH channel message
将信息发送到指定的频道。
PUBLISH test 1
PUBLISH p-testa ceshi-1

PUNSUBSCRIBE [pattern [pattern ...]]
退订所有给定模式的频道。

SUBSCRIBE channel [channel ...]
订阅给定的一个或多个频道的信息。
SUBSCRIBE test

UNSUBSCRIBE [channel [channel ...]]
指退订给定的频道。
```

