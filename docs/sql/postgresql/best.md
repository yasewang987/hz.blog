# Postgresql优化建议

* 硬件优化：使用SSD存储、增加内存和高性能CPU以提升I/O和计算能力。
* 配置优化：调整Postgresql配置文件`Postgresql.conf`中的参数，如`shared_buffers、work_mem、maintenance_work_mem、effective_cache_size、checkpoint_segments`等。
* 索引优化：创建合适的索引以加快查询速度，避免过多的索引影响写性能。
* 查询优化：使用EXPLAIN分析查询计划，优化SQL查询以减少不必要的开销。
* 连接池：使用连接池（如`PgBouncer`）来减少连接创建和销毁的开销，提高并发处理能力。
* 分区：对于大表，可以使用表分区来提高查询性能和管理效率。
* `VACUUM`和`ANALYZE`：定期运行VACUUM和ANALYZE命令以维护数据库统计信息和清理垃圾数据，提高查询性能。

## 永远不要添加带默认值的列

添加列会对表加上锁，从而阻塞读写。如果添加的列有默认值，PostgreSQL 会重写整个表，为每一行填写默认值，这对大型表来说可能需要数小时。在此期间，所有查询都会阻塞，数据库将不可用。

```sql
-- bad
-- 阻塞读写一直到完全重写（以小时计）
ALTER TABLE items ADD COLUMN last_update timestamptz DEFAULT now();

-- good
-- 阻塞查询，更新，插入，删除直到 catalog 被更新 (毫秒计)
ALTER TABLE items ADD COLUMN last_update timestamptz;
-- 查询，插入可以执行，一些更新和删除在重写表时，会被阻塞
UPDATE items SET last_update = now();
```

## 当心锁队列

在 PostgreSQL 中，每个锁都有一个队列。如果事务 B 试图获取一个已经被事务 A 持有的有冲突的锁，那么事务 B 将会在锁队列中等待。现在有趣的是：如果另一个事务 C 加入，它不仅需要检查与事务 A 的冲突，还需要检查与事务 B 以及锁队列中其他所有事务的冲突。

这意味着即使你的 DDL 命令可以非常快速地运行，它也可能在队列中等待很长时间，因为需要等待其他查询完成，并且在它之后启动的查询将会被它阻塞。

```sql
-- bad
ALTER TABLE items ADD COLUMN last_update timestamptz;

-- good
-- 通过设置 lock_timeout 参数，如果 DDL 命令因为等待锁而阻塞查询超过 2 秒，该命令将会失败。这样做的缺点是 ALTER TABLE 可能不会成功，但可以稍后再试。在开始 DDL 命令之前，建议先查询 pg_stat_activity，查看是否有长时间运行的查询。
SET lock_timeout TO '2s'
ALTER TABLE items ADD COLUMN last_update timestamptz;
```

## 并行地创建索引

PostgreSQL 的另一条黄金法则是：始终并行地创建索引。
在大型数据集上创建索引可能需要数小时甚至数天，而常规的 CREATE INDEX 命令会在命令执行期间阻止所有写入操作。虽然不会阻塞 SELECT，但这仍然很糟糕，而且还有更好的方法：`CREATE INDEX CONCURRENTLY`。

```sql
-- bad
-- 阻塞所有写
CREATE INDEX items_value_idx ON items USING GIN (value jsonb_path_ops);

-- good
-- 并发地创建索引有一个缺点。如果出了问题，它不会回滚，而是留下一个未完成（invalid）的索引。如果出现这种情况，不用担心，只需运行 DROP INDEX CONCURRENTLY items_value_idx，然后再尝试创建一次即可。
-- 只阻塞其他 DDL 操作
CREATE INDEX CONCURRENTLY items_value_idx ON items USING GIN (value jsonb_path_ops);
```

## 尽可能晚地获取高级别的锁

当需要运行命令获取表上高级别的锁时，应尽量在事务的较晚阶段执行，以允许查询尽可能长时间地进行。

```sql
-- bad
BEGIN;
-- 阻塞读写:
TRUNCATE items;
-- 长时间操作:
\COPY items FROM 'newdata.csv' WITH CSV 
COMMIT;

-- good
BEGIN;
-- 有一个问题，我们没有从一开始就阻止写入，因此当我们删除旧的 items 表时，它可能已经发生了变化。为了防止出现这种情况，我们可以显式锁表，阻止写入，但不阻止读取：
LOCK items IN EXCLUSIVE MODE;
CREATE TABLE items_new (LIKE items INCLUDING ALL);
-- 长时间操作:
\COPY items_new FROM 'newdata.csv' WITH CSV
-- 阻塞读写:
DROP TABLE items;
ALTER TABLE items_new RENAME TO items;
COMMIT;
```

## 添加主键并尽量减少加锁

```sql
-- bad
ALTER TABLE items ADD PRIMARY KEY (id); -- 长时间阻塞查询

-- good
-- 通过将创建主键分解为两个步骤，几乎不会对用户造成影响。
CREATE UNIQUE INDEX CONCURRENTLY items_pk ON items (id); -- 会很长，但不会阻塞查询
ALTER TABLE items ADD CONSTRAINT items_pk PRIMARY KEY USING INDEX items_pk;  -- 会阻塞查询，但很快
```

## 永远不要使用 VACUUM FULL

VACUUM FULL 会将整个表重写到磁盘上，这可能需要数小时或数天的时间，并且在重写过程中会阻止所有查询。虽然 VACUUM FULL 有一些有效的使用情况，例如表以前很大，但现在变小了，仍占用大量空间，但这极可能不是你面临的情况。

虽然你应该调整 `AUTO VACUUM` 设置并使用索引来加快查询速度，但你可能有时需要运行 `VACUUM`，而不是 `VACUUM FULL`。

VACUUM FULL 听起来像是清除数据库灰尘的命令，但更合适的命令应该是：请冻结我的数据库数小时。

```sql
-- good
PLEASE FREEZE MY DATABASE FOR HOURS;
```

## 通过重排指令避免死锁

如果这些事务同时运行，它们很可能会互相卡住，永远无法完成。Postgres 会在一秒钟左右后识别出这种情况，并取消其中一个事务，让另一个事务完成。出现这种情况时，你应该检查一下自己的应用程序，看看能否让事务始终按照相同的顺序进行。如果两个事务都先修改 hello，再修改 world，那么第一个事务就会在抢到其他锁之前阻塞第二个事务的 hello 锁。

```sql
-- 事务1
BEGIN;
UPDATE items SET counter = counter + 1 WHERE key = 'hello'; -- 在 hello 上加锁
UPDATE items SET counter = counter + 1 WHERE key = 'world'; -- 一边阻塞 hello，一边等着 world
END;

-- 事务2
BEGIN
UPDATE items SET counter = counter + 1 WHERE key = 'world'; -- 在 world 上加锁
UPDATE items SET counter = counter + 1 WHERE key = 'hello';  -- 一边阻塞 world，一边等着 hello
END;

-- 同时执行时发生错误
ERROR:  deadlock detected
DETAIL:  Process 13661 waits for ShareLock on transaction 45942; blocked by process 13483.
Process 13483 waits for ShareLock on transaction 45937; blocked by process 13661.
```