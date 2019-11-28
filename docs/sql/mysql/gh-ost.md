# MySQL在线DDL工具 gh-ost

## 问题背景
相信我们大家都会对大表变更（大于10G 以上的）比较头疼，尤其是某些 DDL 会锁表，影响业务可持续性。目前通用的方案使用 Percona 公司开源的 pt-osc 工具解决导致锁表的操作，还有一款 github 基于 go 语言开发的 gh-ost

## gh-ost介绍

github地址：https://github.com/github/gh-ost

gh-ost 作为一个伪装的备库，可以从主库/备库上拉取 binlog，过滤之后重新应用到主库上去，相当于主库上的增量操作通过 binlog 又应用回主库本身，不过是应用在幽灵表上。
![1](./img/gh-ost/1.png)

**gh-ost 首先连接到主库上，根据 alter 语句创建幽灵表，然后作为一个”备库“连接到其中一个真正的备库上，一边在主库上拷贝已有的数据到幽灵表，一边从备库上拉取增量数据的 binlog，然后不断的把 binlog 应用回主库。**图中 cut-over 是最后一步，锁住主库的源表，等待 binlog 应用完毕，然后替换 gh-ost 表为源表。gh-ost 在执行中，会在原本的 binlog event 里面增加以下 hint 和心跳包，用来控制整个流程的进度，检测状态等。这种架构带来诸多好处，例如：

* **整个流程异步执行**：对于源表的增量数据操作没有额外的开销，高峰期变更业务对性能影响小。
* **降低写压力**：触发器操作都在一个事务内，gh-ost 应用 binlog 是另外一个连接在做。
* **可停止**：binlog 有位点记录，如果变更过程发现主库性能受影响，可以立刻停止拉binlog，停止应用 binlog，稳定之后继续应用。
* **可测试**：gh-ost 提供了测试功能，可以连接到一个备库上直接做 Online DDL，在备库上观察变更结果是否正确，再对主库操作，心里更有底

![2](./img/gh-ost/2.png)

### a.连接到从库，在主库做迁移
这是 gh-ost 默认的工作方式。gh-ost 将会检查从库状态，找到集群结构中的主库并连接，接下来进行迁移操作：

1. 行数据在主库上读写
1. 读取从库的二进制日志，将变更应用到主库
1. 在从库收集表格式，字段&索引，行数等信息
1. 在从库上读取内部的变更事件（如心跳事件）
1. 在主库切换表
1. 如果你的主库的日志格式是 SBR，工具也可以正常工作。但从库必须启用二级制日志( log_bin,log_slave_updates) 并且设置 binlog_format=ROW 。

### b.连接到主库
直接连接到主库构造 slave，在主库上进行 copy 数据和应用 binlog，通过指定 --allow-on-master 参数即可。当然主库的 binlog 模式必须是 row 模式。

### c.在从库迁移/测试
该模式会在从库执行迁移操作。gh-ost 会简单的连接到主库，此后所有的操作都在从库执行，不会对主库进行任何的改动。整个操作过程中，gh-ost 将控制速度保证从库可以及时的进行数据同步

## gh-ost 的特性

gh-ost 拥有众多特性，比如：轻量级、可暂停、可动态控制、可审计、可测试等等，我们可以通过操作特定的文件对正在执行的 gh-ost 命令进行动态调整。

### 暂停/恢复
我们可以通过创建/删除 `throttle-additional-flag-file` 指定的文件 `/tmp/gh-ost.throttle` 控制 gh-ost 对 binlog 应用。

### 限流

gh-ost 可以通过 unix socket 文件或者 TCP 端口（可配置）的方式来监听请求，DBA 可以在命令运行后更改相应的参数，参考下面的例子（gh-ost.db.table.sock会自动生成）:

```bash
# 打开限流
echo throttle | socat - /tmp/gh-ost.xb.sign.sock
# _b_ghc 中会多一条记录
331 | 2019-08-31 23:23:00 | throttle at 1567264980930907070 | done throttling

# 改变执行参数：chunk-size= 1024, max-lag-millis=100, max-load=Thread_running=23 这些参数都可以在运行时动态调整。
echo chunk-size=1024 | socat - /tmp/gh-ost.xb.sign.sock
echo max-lag-millis=100 | socat - /tmp/gh-ost.xb.sign.sock
echo max-load=Thread_running=23 | socat - /tmp/gh-ost.xb.sign.sock

# 关闭限流
no-throttle | socat - /tmp/gh-ost.xb.sign.sock
# _b_ghc 中会多一条记录
347 | 2019-08-31 23:24:09 | throttle at 1567265049830789079 | commanded by user
```

### 终止运行

通过来过创建 panic-flag-file 指定的文件，立即终止正在执行的 gh-ostmin

* 临时文件需要自行清理

```bash
touch /tmp/ghost.panic.flag
# gh-ost log提示
2019-08-31 22:50:52.701 FATAL Found panic-file /tmp/ghost.panic.flag. Aborting without cleanup
```

* 注意：停止 gh-ost 操作会有遗留表 xxx_ghc，xxx_gho还有 socket 文件，管理 cut-over 的文件，如果你需要执行两次请务必检查指定目录是否存在这些文件，并且清理掉文件和表

### 结束不自动

创建文件延迟cut-over进行，即推迟切换操作。例子中创建/tmp/ghost.postpone.flag文件，gh-ost 会完成行复制，但并不会切换表，它会持续的将原表的数据更新操作同步到临时表中


## gh-ost参数含义

```bash
--aliyun-rds:是否在阿里云数据库上执行。true
--allow-master-master:是否允许gh-ost运行在双主复制架构中，一般与-assume-master-host参数一起使用
--allow-nullable-unique-key:允许gh-ost在数据迁移依赖的唯一键可以为NULL，默认为不允许为NULL的唯一键。如果数据迁移(migrate)依赖的唯一键允许NULL值，则可能造成数据不正确，请谨慎使用。
--allow-on-master:允许gh-ost直接运行在主库上。默认gh-ost连接的从库。
--alter string:DDL语句
--approve-renamed-columns ALTER:如果你修改一个列的名字，gh-ost将会识别到并且需要提供重命名列名的原因，默认情况下gh-ost是不继续执行的，除非提供-approve-renamed-columns ALTER。
--ask-pass:MySQL密码
--assume-master-host string:为gh-ost指定一个主库，格式为”ip:port”或者”hostname:port”。在这主主架构里比较有用，或则在gh-ost发现不到主的时候有用。
--assume-rbr:确认gh-ost连接的数据库实例的binlog_format=ROW的情况下，可以指定-assume-rbr，这样可以禁止从库上运行stop slave,start slave,执行gh-ost用户也不需要SUPER权限。
--check-flag
--chunk-size int:在每次迭代中处理的行数量(允许范围：100-100000)，默认值为1000。
--concurrent-rowcount:该参数如果为True(默认值)，则进行row-copy之后，估算统计行数(使用explain select count(*)方式)，并调整ETA时间，否则，gh-ost首先预估统计行数，然后开始row-copy。
--conf string:gh-ost的配置文件路径。
--critical-load string:一系列逗号分隔的status-name=values组成，当MySQL中status超过对应的values，gh-ost将会退出。-critical-load Threads_connected=20,Connections=1500，指的是当MySQL中的状态值Threads_connected>20,Connections>1500的时候，gh-ost将会由于该数据库严重负载而停止并退出。
    Comma delimited status-name=threshold, same format as --max-load. When status exceeds threshold, app panics and quits
--critical-load-hibernate-seconds int :负载达到critical-load时，gh-ost在指定的时间内进入休眠状态。 它不会读/写任何来自任何服务器的任何内容。
--critical-load-interval-millis int:当值为0时，当达到-critical-load，gh-ost立即退出。当值不为0时，当达到-critical-load，gh-ost会在-critical-load-interval-millis秒数后，再次进行检查，再次检查依旧达到-critical-load，gh-ost将会退出。
--cut-over string:选择cut-over类型:atomic/two-step，atomic(默认)类型的cut-over是github的算法，two-step采用的是facebook-OSC的算法。
--cut-over-exponential-backoff
--cut-over-lock-timeout-seconds int:gh-ost在cut-over阶段最大的锁等待时间，当锁超时时，gh-ost的cut-over将重试。(默认值：3)
--database string:数据库名称。
--debug:debug模式。
--default-retries int:各种操作在panick前重试次数。(默认为60)
--discard-foreign-keys:该参数针对一个有外键的表，在gh-ost创建ghost表时，并不会为ghost表创建外键。该参数很适合用于删除外键，除此之外，请谨慎使用。
--dml-batch-size int:在单个事务中应用DML事件的批量大小（范围1-100）（默认值为10）
--exact-rowcount:准确统计表行数(使用select count(*)的方式)，得到更准确的预估时间。
--execute:实际执行alter&migrate表，默认为noop，不执行，仅仅做测试并退出，如果想要ALTER TABLE语句真正落实到数据库中去，需要明确指定-execute
--exponential-backoff-max-interval int
--force-named-cut-over:如果为true，则'unpostpone | cut-over'交互式命令必须命名迁移的表
--force-table-names string:在临时表上使用的表名前缀
--heartbeat-interval-millis int:gh-ost心跳频率值，默认为500
--help
--hooks-hint string:任意消息通过GH_OST_HOOKS_HINT注入到钩子
--hooks-path string:hook文件存放目录(默认为empty，即禁用hook)。hook会在这个目录下寻找符合约定命名的hook文件来执行。
--host string :MySQL IP/hostname
--initially-drop-ghost-table:gh-ost操作之前，检查并删除已经存在的ghost表。该参数不建议使用，请手动处理原来存在的ghost表。默认不启用该参数，gh-ost直接退出操作。
--initially-drop-old-table:gh-ost操作之前，检查并删除已经存在的旧表。该参数不建议使用，请手动处理原来存在的ghost表。默认不启用该参数，gh-ost直接退出操作。
--initially-drop-socket-file:gh-ost强制删除已经存在的socket文件。该参数不建议使用，可能会删除一个正在运行的gh-ost程序，导致DDL失败。
--master-password string :MySQL 主密码
--master-user string:MysQL主账号
--max-lag-millis int:主从复制最大延迟时间，当主从复制延迟时间超过该值后，gh-ost将采取节流(throttle)措施，默认值：1500s。
--max-load string:逗号分隔状态名称=阈值，如：'Threads_running=100,Threads_connected=500'. When status exceeds threshold, app throttles writes
--migrate-on-replica:gh-ost的数据迁移(migrate)运行在从库上，而不是主库上。 
--nice-ratio float:每次chunk时间段的休眠时间，范围[0.0…100.0]。0：每个chunk时间段不休眠，即一个chunk接着一个chunk执行；1：每row-copy 1毫秒，则另外休眠1毫秒；0.7：每row-copy 10毫秒，则另外休眠7毫秒。
--ok-to-drop-table:gh-ost操作结束后，删除旧表，默认状态是不删除旧表，会存在_tablename_del表。
--panic-flag-file string:当这个文件被创建，gh-ost将会立即退出。
--password string :MySQL密码
--port int ：MySQL端口，最好用从库
--postpone-cut-over-flag-file string：当这个文件存在的时候，gh-ost的cut-over阶段将会被推迟，数据仍然在复制，直到该文件被删除。
--quiet：静默模式。
--replica-server-id uint : gh-ost的server_id
--replication-lag-query string:弃用
--serve-socket-file string：gh-ost的socket文件绝对路径。
--serve-tcp-port int:gh-ost使用端口，默认为关闭端口。
--skip-foreign-key-checks:确定你的表上没有外键时，设置为'true'，并且希望跳过gh-ost验证的时间-skip-renamed-columns ALTER
--skip-renamed-columns ALTER：如果你修改一个列的名字(如change column)，gh-ost将会识别到并且需要提供重命名列名的原因，默认情况下gh-ost是不继续执行的。该参数告诉gh-ost跳该列的数据迁移，让gh-ost把重命名列作为无关紧要的列。该操作很危险，你会损失该列的所有值。
--stack:添加错误堆栈追踪。
--switch-to-rbr:让gh-ost自动将从库的binlog_format转换为ROW格式。
--table string:表名
--test-on-replica：在从库上测试gh-ost，包括在从库上数据迁移(migration)，数据迁移完成后stop slave，原表和ghost表立刻交换而后立刻交换回来。继续保持stop slave，使你可以对比两张表。
--test-on-replica-skip-replica-stop:当-test-on-replica执行时，该参数表示该过程中不用stop slave。
--throttle-additional-flag-file string:当该文件被创建后，gh-ost操作立即停止。该参数可以用在多个gh-ost同时操作的时候，创建一个文件，让所有的gh-ost操作停止，或者删除这个文件，让所有的gh-ost操作恢复。
--throttle-control-replicas string:列出所有需要被检查主从复制延迟的从库。
--throttle-flag-file string:当该文件被创建后，gh-ost操作立即停止。该参数适合控制单个gh-ost操作。-throttle-additional-flag-file string适合控制多个gh-ost操作。
--throttle-http string
--throttle-query string:节流查询。每秒钟执行一次。当返回值=0时不需要节流，当返回值>0时，需要执行节流操作。该查询会在数据迁移(migrated)服务器上操作，所以请确保该查询是轻量级的。
--timestamp-old-table:在旧表名中使用时间戳。 这会使旧表名称具有唯一且无冲突的交叉迁移
--tungsten：告诉gh-ost你正在运行的是一个tungsten-replication拓扑结构。
--user string :MYSQL用户
--verbose
--version
```

## 准备

1. 下载gh-ost,直接在github上下载
1. 安装socat
    ```bash
    # mac
    brew install socat

    # centos
    yum install socat
    ```
1. 安装mysql
    ```
    docker pull mysql:5.6

    docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -v $PWD/mysql/conf:/etc/mysql/conf.d -v $PWD/mysql/data:/var/lib/mysql -v $PWD/mysql/logs:/logs --name test_mysql mysql:5.6
    ```
1. 检查binlog、binlog_format状态

    ```sql
    show variables like 'log_bin';

    show global variables like "%binlog_format%"; 
    ```
1. 开启binlog,并设置binlog_format为ROW模式，在 my.cnf文件中添加如下内容(设置完成后重启mysql)：

    ```cnf
    [mysqld]
    # binlog 配置
    log-bin = /logs/mysql-bin.log
    expire-logs-days = 14
    max-binlog-size = 500M
    server-id = 1
    binlog_format = "ROW"
    ```
1. 造数据：

    ```sql
    CREATE TABLE `log` (
    `Id` int(11) NOT NULL AUTO_INCREMENT,
    `OrgId` int(11) NOT NULL DEFAULT 1,
    PRIMARY KEY (`Id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

    -- 插入数据
    CREATE PROCEDURE insertlog()
    begin
    declare i int;
    set i=1;
    while i<1000001 do
        insert INTO `log`(`OrgId`) values(i);
        set i=i+1;
    end while;
    end

    call insertlog();
    ```

## 阿里云rds问题
原因是在校验阶段隐藏了两个参数，@@port 和 @@hostname，导致 gh-ost 获得了非法的字符。隐藏的原因是系统架构和安全的考虑，避免用户的端口和主机被恶意攻击。返回非法字符也是出于用户体验，例如 port 本应该是整型，如果返回 0，那么可能会有用户认为自己的数据库端口是 0，但是返回 ‘NULL’，用户就可以接收到明确的隐藏信号。

需要使用参数 `–aliyun-rds` 搞定，单主库不需要加`assume-master-host`

## 例子

```bash
# 本地数据库
~/Downloads/gh-ost \
--max-load=Threads_running=20 \
--critical-load=Threads_running=50 \
--critical-load-interval-millis=5000 \
--chunk-size=100 \
--user="root" \
--password="123456" \
--host='127.0.0.1' \
--port=3306 \
--database="testdb" \
--table="log" \
--verbose \
--alter="MODIFY COLUMN Id BIGINT(20) NOT NULL AUTO_INCREMENT,ADD COLUMN SourceType tinyint(4)  Not Null Default 3 COMMENT '学员来源：1.插班，2.补课，3.在读，4.约课' AFTER StufeeDocId;" \
--assume-rbr \
--cut-over=default \
--cut-over-lock-timeout-seconds=1 \
--dml-batch-size=10 \
--allow-on-master \
--concurrent-rowcount \
--default-retries=10 \
--heartbeat-interval-millis=2000 \
--panic-flag-file=/tmp/ghost.panic.flag \
--postpone-cut-over-flag-file=/tmp/ghost.postpone.flag \
--timestamp-old-table \
--execute 2>&1 | tee  /tmp/rebuild_t1.log
```

```bash
# 阿里云
~/Downloads/gh-ost \
--max-load=Threads_running=20 \
--critical-load=Threads_running=50 \
--critical-load-interval-millis=5000 \
--chunk-size=100 \
--user="xb" \
--password="g1nti23" \
--host='dop1b9bkz12rom0x43s7.mysql.rds.aliyuncs.com' \
--port=3363 \
--database="xb" \
--table="sign" \
--verbose \
--alter="MODIFY COLUMN Id BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Id'" \
--assume-rbr \
--cut-over=default \
--cut-over-lock-timeout-seconds=1 \
--dml-batch-size=10 \
--allow-on-master \
--aliyun-rds \
--assume-rbr \
--concurrent-rowcount \
--default-retries=10 \
--heartbeat-interval-millis=2000 \
--panic-flag-file=/tmp/ghost.panic.flag \
--postpone-cut-over-flag-file=/tmp/ghost.postpone.flag \
--timestamp-old-table \
--execute 2>&1 | tee  /tmp/rebuild_t1.log
```