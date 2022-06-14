# Mysql使用注意事项

## 排序+分页导致结果错乱

* 问题：
  > 如果order by的字段有多个行都有相同的值，mysql是会随机的顺序返回查询结果的，具体依赖对应的执行计划。也就是说如果排序的列是无序的，那么排序的结果行的顺序也是不确定的。

  > mysql在使用文件排序（using filesort）会出现这个问题，如果使用排序字段有索引默认就不会使用文件索引，就没有这个问题

* 解决方案
  > 如果想在Limit存在或不存在的情况下，都保证排序结果相同，可以额外加一个排序条件。例如`id`字段是唯一的，可以考虑在排序字段中额外加个id排序去确保顺序稳定。

## 常用sql语句

```sql
-----------表结构操作-------------
-- 添加普通索引
alter table t add index idx1(colname)
-- 多列索引
alter table t add index idx1(colname1,colname2)
-- 添加唯一索引
alter table t add unique index idx1(colname)
-- 添加全文索引
alter table t add fulltext idx1(colname) 


-----------数据操作------------
-- 如果记录存在了就忽略本次ignore本次插入。如果记录不存在就写入(`唯一键` 不能重复)。
insert ignore into 

-- 如果数据已经存在了就更新（全量替换）。如果数据不存在就更写入(`唯一键` 不能重复)。
replace into

-- 如果记录存在就更新，如果记录不存在就插入。如果你每次使用on duplicate key update进行更新时（注意是更新而不是插入），MySQL也会让last_insert_id变大。这就会出现id不连续增长的现象。
on duplicate key update


-----------锁表查询------------
-- 查询是否锁表
show OPEN TABLES where In_use > 0;
-- 查看所有进程
-- MySQL:
show processlist;
-- mariadb:
show full processlist;
-- 查询到相对应的进程===然后 kill id
-- 杀掉指定mysql连接的进程号
kill $pid
-- 查看正在锁的事务
SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCKS; 
-- 查看等待锁的事务
SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCK_WAITS; 
-- 查看innodb引擎的运行时信息
show engine innodb status\G;
-- 查看造成死锁的sql语句，分析索引情况，然后优化sql语句；
 
-- 查看服务器状态
show status like '%lock%';
-- 查看超时时间：
show variables like '%timeout%';

--------慢sql查询-------------
show variables like '%query';
-- slow_query_log : 是否开启慢查询日志,需要临时开启，执行如下命令
set global slow_query_log=on
set global slow_query_log=off
-- slow_query_log_file : 慢查询日志存储位置
-- long_query_time : 超多多长时间的查询被定义为慢查询，默认10s，可以通过如下命令设置
set long_query_time=5
```