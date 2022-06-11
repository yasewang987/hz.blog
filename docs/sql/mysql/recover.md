# mysql数据恢复

## 基本介绍

binlog的目录一般在 `/var/lib/mysql` 

```bash
# 查看binlog配置
mysql> show variables like '%log_bin%';
# 查看当前正在写入的binlog文件
mysql> show master status;
# 查看当前正在写入的日志文件中的binlog事件
mysql> show binlog events;
# 查看指定的文件
mysql> show binlog events in 'mysql-bin.000001';
# 显示文件列表
mysql> show binary logs;


# 备份所有数据库
mysqldump --single-transaction --master-data=2 --triggers --routines --all-databases -uroot  -p > /backup/full.sql
Enter password:

# 恢复数据库
mysql -uroot -p < /backup/full.sql

# 手动创建新的binlog文件
mysql> flush logs;

# 查看数据库里归档日志的位置
mysql> show master status \G
*************************** 1. row ***************************
             File: mysql-bin.000001
         Position: 740
     Binlog_Do_DB:
 Binlog_Ignore_DB:
Executed_Gtid_Set:
1 row in set (0.00 sec)

# 从740位置开始的所有操作
mysqlbinlog --no-defaults --start-position=740 /import/mysql/mysql-bin.000001 | mysql -uroot -p
Enter password:
# 如果后续还有其他的binlog，则继续执行，这个就不需要指定开始位置了，因为和000001是连续的
# 到2018-06-09 01:11:26之前的操作
mysqlbinlog --no-defaults --stop-datetime="2018-06-09 01:11:26"  /import/mysql/mysql-bin.000002 | mysql -uroot -p
```

## 日常备份恢复操作建议

```bash
#### mysqldump语句中加入--flush-logs会把没有写满的binlog停止，另起一个新的binlog来写,在重做binlog的时候添加--start-position语句
# --flush-privileges,是在恢复的时候能够自动赋予相关用户相关权限
# 只备份dbtest数据库
mysqldump --single-transaction --master-data=2 --triggers --routines --flush-logs --flush-privileges --databases dbtest  -p > /backup/full2.sql
Enter password:
# 在备份完毕之后，产生了一个新的binlog 00003，并从154行开始
mysql> show master status \G
*************************** 1. row ***************************
             File: mysql-bin.000003
         Position: 154
     Binlog_Do_DB:
 Binlog_Ignore_DB:
Executed_Gtid_Set:
1 row in set (0.01 sec)

#### 在源库里添加几行数据
mysql> use dbtest;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> insert into table2 values(2,'hahaha',NOW());
Query OK, 1 row affected (0.14 sec)

mysql> insert into table2 values(3,'enenen',NOW());
Query OK, 1 row affected (0.14 sec)

mysql> select * from table2;
+----+--------+---------------------+
| id | hobby  | starttime           |
+----+--------+---------------------+
|  1 | play   | 2018-06-09 11:06:07 |
|  2 | hahaha | 2018-06-09 04:09:17 |
|  3 | enenen | 2018-06-09 04:09:34 |
+----+--------+---------------------+
3 rows in set (0.00 sec)
# 查看结果如下
mysql> show master status \G
*************************** 1. row ***************************
             File: mysql-bin.000003
         Position: 726
     Binlog_Do_DB:
 Binlog_Ignore_DB:
Executed_Gtid_Set:
1 row in set (0.00 sec)

# 看到00003到了726行了。现在我们假设源库崩溃，然后我们把full2.sql和binlog 00003都拷贝到另一台服务器上。

###### 开始恢复全备
mysql -uroot -p < /import/full2.sql
# 查看结果如下
mysql> select * from table2;
+----+-------+---------------------+
| id | hobby | starttime           |
+----+-------+---------------------+
|  1 | play  | 2018-06-09 11:06:07 |
+----+-------+---------------------+
1 row in set (0.00 sec)

##### 现在我们要重做00003，由于之前--flush-logs的作用，我们虽然从157行开始，但是无需指定--start-positon了，简化了数据库恢复的过程，而且由于重新启用一个binlog，之前的0001，00002就都可以删掉或者转移走保存起来，节省服务器上的宝贵空间，不然的话我们也许还要等00002写满之后才能转移走。
mysqlbinlog --no-defaults /import/mysql/mysql-bin.000003 | mysql -uroot -p
Enter password:
# 查看结果如下
mysql> select * from table2;
+----+--------+---------------------+
| id | hobby  | starttime           |
+----+--------+---------------------+
|  1 | play   | 2018-06-09 11:06:07 |
|  2 | hahaha | 2018-06-09 04:09:17 |
|  3 | enenen | 2018-06-09 04:09:34 |
+----+--------+---------------------+
3 rows in set (0.00 sec)
```