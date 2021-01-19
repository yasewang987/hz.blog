# 分布式Id生成器

对于id来说，一般都保存到关系型数据库中，那么对于使用的类型来说，`long`类型比`string`类型的效率高很多，所以一般使用`string`类型。

一般有3中生成方式

1. 数据库自增id
1. 集中式id生成器，可以是redis，zookeeper,也可以是数据库专门生成id的表
1. 类似Twitter的Snowflake算法，它给每台机器分配一个唯一标识，然后通过时间戳+标识+自增实现全局唯一ID。这种方式好处在于ID生成算法完全是一个无状态机，无网络调用，高效可靠。缺点是如果唯一标识有重复，会造成ID冲突。

Snowflake算法采用`41bit`毫秒时间戳，加上`10bit`机器ID，加上`12bit`序列号，理论上最多支持`1024`台机器每秒生成`4096000`个序列号，对于Twitter的规模来说够用了。

支持最大时间：2的41次方 = 最大时间戳，最大时间戳/1000/3600/24/365 = N年，可以算出最大支持N年（可以通过使用秒来延长最大支持年数）

最大支持机器数量：2的10次方 = 1024台

每秒最大支持生成序列号：2的12次方 = 4096 * 1000 = 4096000 个 （1s = 1000ms）

## 53位id生成器设计

由于一般系统都是与前端交互，js最大支持53位的 Number，所以一般设计53位的id生成器即可，不然会增加系统的复杂度（如果确实不够用，可以特殊处理）。

53bitID由32bit秒级时间戳+13bit自增+8bit机器标识组成，累积256台机器，每台每秒可以生成8192个序列号，最高可支持到2106年。

如果每秒8192个序列号不够怎么办？没关系，可以继续递增时间戳，向前“借”下一秒的8192个序列号

核心代码：

```java
private synchronized long nextId(long epochSecond) {
    // 处理时钟回拨问题
    if (epochSecond < lastEpoch) {
        // clock is turn back
        logger.warn("clock is back: " + epochSecond + " from previous:" + lastEpoch);
        epochSecond = lastEpoch;
    }
    // 如果当前时间（秒）不等于最后获取id时间
    if (lastEpoch != epochSecond) {
        // 更新最后时间为当前时间
        lastEpoch = epochSecond;
        // 自增从0开始
        reset();
    }

    offset++;
    
    // 防止自增的值超过最大自增值
    long next = offset & MAX_NEXT;

    if(next == 0) {
        logger.warn("当前时间的自增id已经到达最大值：" + epochSecond);
        // 向下一秒借id
        return nextId(epochSecond + 1);
    }

    return generateId(epochSecond, next);
}

private void reset() {
    this.offset = 0;
}

/**
    * 生成id
    * @param epochSecond 时间戳
    * @param next 自增id
    * @return id
    */
private long generateId(long epochSecond, long next)
{
    try {
        String address = InetAddress.getLocalHost().getHostAddress();
        String[] addresses = address.split("\\.");
        String lastAddress = addresses[addresses.length - 1];
        long machineId = Long.valueOf(lastAddress);

        // 当前时间戳减一个固定时间戳的好处是可以使可用时间变长
        return ((epochSecond - OFFSET) << 21) | next << 8 | machineId ;

    } catch (UnknownHostException e) {
        logger.warn("unable to get host name. set server id = 0.");
    }

    return 0;
}
```

完整代码参考: [Client53BitIdGeneraterImp](https://github.com/hz-microservices/hz.util/blob/main/lib/src/main/java/hz/util/idgenerater/Client53BitIdGeneraterImp.java)