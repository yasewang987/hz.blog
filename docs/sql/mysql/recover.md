# mysql数据备份恢复

## mysqldump备份恢复

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

### 日常备份恢复操作建议

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

### mysql脚本自动备份

```sh
#!/bin/bash
#导出sql脚本
echo $(date "+%Y-%m-%d") backup start
echo mysql backup start
mysqldump -u数据库用户名 -p数据库密码 pm_prod2.0 > /mnt/data/mysql_backup/pm_shandong_$(date "+%Y-%m-%d").sql
echo mysql backup finish
#scp跨机器备份
echo sql scp start
/usr/bin/expect <<-EOF
set timeout -1;
spawn scp -P ssh端口号 /mnt/data/mysql_backup/pm_shandong_$(date "+%Y-%m-%d").sql 另一台机器用户名@另一台机器IP:/mnt/data/mysql_backup/
expect {
    "*password:" {send "另一台机器密码\r";exp_continue;}
    "yes/no" {send "yes\r";}
}
EOF
#删除过期sql
echo remove file /mnt/data/mysql_backup/pm_shandong_$(date -d "7 day ago" +%Y-%m-%d).sql
rm -rf /mnt/data/mysql_backup/pm_shandong_$(date -d "7 day ago" +%Y-%m-%d).sql
echo finish! The file is pm_shandong_$(date "+%Y-%m-%d").sql
```

## DataX备份恢复

### 介绍及安装

DataX 是阿里云 DataWorks 数据集成 的开源版本，主要就是用于实现数据间的离线同步。 DataX 致力于实现包括关系型数据库（MySQL、Oracle 等）、HDFS、Hive、ODPS、HBase、FTP 等 各种异构数据源（即不同的数据库） 间稳定高效的数据同步功能。

![recover1](http://cdn.go99.top/docs/sql/mysql/recover1.png)

为了 解决异构数据源同步问题，DataX 将复杂的网状同步链路变成了星型数据链路 ，DataX 作为中间传输载体负责连接各种数据源；

当需要接入一个新的数据源时，只需要将此数据源对接到 DataX，便能跟已有的数据源作为无缝数据同步。

DataX 采用 Framework + Plugin 架构，将数据源读取和写入抽象称为 Reader/Writer 插件，纳入到整个同步框架中。

![recover2](http://cdn.go99.top/docs/sql/mysql/recover2.png)

准备工作：

* JDK（1.8 以上，推荐 1.8）
* Python（2，3 版本都可以）
* Apache Maven 3.x（Compile DataX）（手动打包使用，使用 tar 包方式不需要安装）

主机名|操作系统|ip地址|软件包
---|---|---|---
MySQL-1|CentOS 7.4|192.168.1.1|jdk-8u181-linux-x64.tar.gz datax.tar.gz
MySQL-2|CentOS 7.4|192.168.1.2|

安装 JDK：

下载地址：https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html （需要创建 Oracle 账号）

```bash
[root@MySQL-1 ~]# ls
anaconda-ks.cfg  jdk-8u181-linux-x64.tar.gz
[root@MySQL-1 ~]# tar zxf jdk-8u181-linux-x64.tar.gz 
[root@DataX ~]# ls
anaconda-ks.cfg  jdk1.8.0_181  jdk-8u181-linux-x64.tar.gz
[root@MySQL-1 ~]# mv jdk1.8.0_181 /usr/local/java
[root@MySQL-1 ~]# cat <<END >> /etc/profile
export JAVA_HOME=/usr/local/java
export PATH=$PATH:"$JAVA_HOME/bin"
END
[root@MySQL-1 ~]# source /etc/profile
[root@MySQL-1 ~]# java -version
```

Linux 上安装 DataX 软件

```bash
[root@MySQL-1 ~]# wget http://datax-opensource.oss-cn-hangzhou.aliyuncs.com/datax.tar.gz
[root@MySQL-1 ~]# tar zxf datax.tar.gz -C /usr/local/
[root@MySQL-1 ~]# rm -rf /usr/local/datax/plugin/*/._*      #需要删除隐藏文件 (重要)
```
当未删除时，可能会输出：`/usr/local/datax/plugin/reader/._drdsreader/plugin.json` 不存在. 请检查您的配置文件.

验证DataX

```bash
[root@MySQL-1 ~]# cd /usr/local/datax/bin
[root@MySQL-1 ~]# python datax.py ../job/job.json       # 用来验证是否安装成功

### 输出如下信息
2021-12-13 19:26:28.828 [job-0] INFO  JobContainer - PerfTrace not enable!
2021-12-13 19:26:28.829 [job-0] INFO  StandAloneJobContainerCommunicator - Total 100000 records, 2600000 bytes | Speed 253.91KB/s, 10000 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.060s |  All Task WaitReaderTime 0.068s | Percentage 100.00%
2021-12-13 19:26:28.829 [job-0] INFO  JobContainer - 
任务启动时刻                    : 2021-12-13 19:26:18
任务结束时刻                    : 2021-12-13 19:26:28
任务总计耗时                    :                 10s
任务平均流量                    :          253.91KB/s
记录写入速度                    :          10000rec/s
读出记录总数                    :              100000
读写失败总数                    :                   0
```

安装 MySQL 数据库

```bash
[root@MySQL-1 ~]# yum -y install mariadb mariadb-server mariadb-libs mariadb-devel   
[root@MySQL-1 ~]# systemctl start mariadb            # 安装 MariaDB 数据库
[root@MySQL-1 ~]# mysql_secure_installation            # 初始化 
NOTE: RUNNING ALL PARTS OF THIS SCRIPT IS RECOMMENDED FOR ALL MariaDB
      SERVERS IN PRODUCTION USE!  PLEASE READ EACH STEP CAREFULLY!

Enter current password for root (enter for none):       # 直接回车
OK, successfully used password, moving on...
Set root password? [Y/n] y                            # 配置 root 密码
New password: 
Re-enter new password: 
Password updated successfully!
Reloading privilege tables..
 ... Success!
Remove anonymous users? [Y/n] y                     # 移除匿名用户
 ... skipping.
Disallow root login remotely? [Y/n] n                # 允许 root 远程登录
 ... skipping.
Remove test database and access to it? [Y/n] y         # 移除测试数据库
 ... skipping.
Reload privilege tables now? [Y/n] y                    # 重新加载表
 ... Success!
```

### DataX 基本使用

查看 `streamreader --> streamwriter` 的模板：

```bash
[root@MySQL-1 ~]# python /usr/local/datax/bin/datax.py -r streamreader -w streamwriter

### 输出
DataX (DATAX-OPENSOURCE-3.0), From Alibaba !
Copyright (C) 2010-2017, Alibaba Group. All Rights Reserved.


Please refer to the streamreader document:
     https://github.com/alibaba/DataX/blob/master/streamreader/doc/streamreader.md 

Please refer to the streamwriter document:
     https://github.com/alibaba/DataX/blob/master/streamwriter/doc/streamwriter.md 
 
Please save the following configuration as a json file and  use
     python {DATAX_HOME}/bin/datax.py {JSON_FILE_NAME}.json 
to run the job.

{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "streamreader", 
                    "parameter": {
                        "column": [], 
                        "sliceRecordCount": ""
                    }
                }, 
                "writer": {
                    "name": "streamwriter", 
                    "parameter": {
                        "encoding": "", 
                        "print": true
                    }
                }
            }
        ], 
        "setting": {
            "speed": {
                "channel": ""
            }
        }
    }
}
```

根据模板编写 json 文件

```yml
cat <<END > test.json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "streamreader", 
                    "parameter": {
                        "column": [        # 同步的列名 (* 表示所有)
       {
           "type":"string",
    "value":"Hello."
       },
       {
           "type":"string",
    "value":"河北彭于晏"
       },
   ], 
                        "sliceRecordCount": "3"     # 打印数量
                    }
                }, 
                "writer": {
                    "name": "streamwriter", 
                    "parameter": {
                        "encoding": "utf-8",     # 编码
                        "print": true
                    }
                }
            }
        ], 
        "setting": {
            "speed": {
                "channel": "2"         # 并发 (即 sliceRecordCount * channel = 结果)
            }
        }
    }
}
```

同步mysql数据库

1）准备同步数据（要同步的两台主机都要有这个表）

```bash
MariaDB [(none)]> create database `course-study`;
Query OK, 1 row affected (0.00 sec)

MariaDB [(none)]> create table `course-study`.t_member(ID int,Name varchar(20),Email varchar(30));
Query OK, 0 rows affected (0.00 sec)
```

因为是使用 DataX 程序进行同步的，所以需要在双方的数据库上开放权限：

```bash
grant all privileges on *.* to root@'%' identified by '123123';
flush privileges;
```

2）创建存储过程，输入模拟数据：

```bash
DELIMITER $$
CREATE PROCEDURE test()
BEGIN
declare A int default 1;
while (A < 3000000)do
insert into `course-study`.t_member values(A,concat("LiSa",A),concat("LiSa",A,"@163.com"));
set A = A + 1;
END while;
END $$
DELIMITER ;
```

3）调用存储过程（在数据源配置，验证同步使用)：

```bash
call test();
```

通过 DataX 实 MySQL 数据同步

1）生成 MySQL 到 MySQL 同步的模板

```bash
[root@MySQL-1 ~]# python /usr/local/datax/bin/datax.py -r mysqlreader -w mysqlwriter
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",       # 读取端
                    "parameter": {
                        "column": [],         # 需要同步的列 (* 表示所有的列)
                        "connection": [
                            {
                                "jdbcUrl": [],       # 连接信息
                                "table": []       # 连接表
                            }
                        ], 
                        "password": "",        # 连接用户
                        "username": "",        # 连接密码
                        "where": ""         # 描述筛选条件
                    }
                }, 
                "writer": {
                    "name": "mysqlwriter",       # 写入端
                    "parameter": {
                        "column": [],         # 需要同步的列
                        "connection": [
                            {
                                "jdbcUrl": "",       # 连接信息
                                "table": []       # 连接表
                            }
                        ], 
                        "password": "",        # 连接密码
                        "preSql": [],         # 同步前. 要做的事
                        "session": [], 
                        "username": "",        # 连接用户 
                        "writeMode": ""        # 操作类型
                    }
                }
            }
        ], 
        "setting": {
            "speed": {
                "channel": ""          # 指定并发数
            }
        }
    }
}
```

2）编写 json 文件：

```json
[root@MySQL-1 ~]# vim install.json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader", 
                    "parameter": {
                        "username": "root",
                        "password": "123123",
                        "column": ["*"],
                        "splitPk": "ID",
                        "connection": [
                            {
                                "jdbcUrl": [
                                    "jdbc:mysql://192.168.1.1:3306/course-study?useUnicode=true&characterEncoding=utf8"
                                ], 
                                "table": ["t_member"]
                            }
                        ]
                    }
                }, 
                "writer": {
                    "name": "mysqlwriter", 
                    "parameter": {
                        "column": ["*"], 
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://192.168.1.2:3306/course-study?useUnicode=true&characterEncoding=utf8",
                                "table": ["t_member"]
                            }
                        ], 
                        "password": "123123",
                        "preSql": [
                            "truncate t_member"
                        ], 
                        "session": [
                            "set session sql_mode='ANSI'"
                        ], 
                        "username": "root", 
                        "writeMode": "insert"
                    }
                }
            }
        ], 
        "setting": {
            "speed": {
                "channel": "5"
            }
        }
    }
}
```

3）验证

```bash
[root@MySQL-1 ~]# python /usr/local/datax/bin/datax.py install.json

### 输出
2021-12-15 16:45:15.120 [job-0] INFO  JobContainer - PerfTrace not enable!
2021-12-15 16:45:15.120 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2999999 records, 107666651 bytes | Speed 2.57MB/s, 74999 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 82.173s |  All Task WaitReaderTime 75.722s | Percentage 100.00%
2021-12-15 16:45:15.124 [job-0] INFO  JobContainer - 
任务启动时刻                    : 2021-12-15 16:44:32
任务结束时刻                    : 2021-12-15 16:45:15
任务总计耗时                    :                 42s
任务平均流量                    :            2.57MB/s
记录写入速度                    :          74999rec/s
读出记录总数                    :             2999999
读写失败总数                    :                   0
```

* 上面的方式相当于是完全同步，但是当数据量较大时，同步的时候被中断，是件很痛苦的事情；
* 所以在有些情况下，增量同步还是蛮重要的。

### 使用 DataX 进行增量同步

使用 DataX 进行全量同步和增量同步的唯一区别就是：增量同步需要使用 `where` 进行条件筛选。（即，同步筛选后的 SQL）

1）编写 json 文件：

```json
[root@MySQL-1 ~]# vim where.json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader", 
                    "parameter": {
                        "username": "root",
                        "password": "123123",
                        "column": ["*"],
                        "splitPk": "ID",
                        "where": "ID <= 1888",
                        "connection": [
                            {
                                "jdbcUrl": [
                                    "jdbc:mysql://192.168.1.1:3306/course-study?useUnicode=true&characterEncoding=utf8"
                                ], 
                                "table": ["t_member"]
                            }
                        ]
                    }
                }, 
                "writer": {
                    "name": "mysqlwriter", 
                    "parameter": {
                        "column": ["*"], 
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://192.168.1.2:3306/course-study?useUnicode=true&characterEncoding=utf8",
                                "table": ["t_member"]
                            }
                        ], 
                        "password": "123123",
                        "preSql": [
                            "truncate t_member"
                        ], 
                        "session": [
                            "set session sql_mode='ANSI'"
                        ], 
                        "username": "root", 
                        "writeMode": "insert"
                    }
                }
            }
        ], 
        "setting": {
            "speed": {
                "channel": "5"
            }
        }
    }
}
```

需要注意的部分就是：`where`（条件筛选） 和 `preSql`（同步前，要做的事） 参数。

2）验证：

```bash
[root@MySQL-1 ~]# python /usr/local/data/bin/data.py where.json

### 输出
2021-12-16 17:34:38.534 [job-0] INFO  JobContainer - PerfTrace not enable!
2021-12-16 17:34:38.534 [job-0] INFO  StandAloneJobContainerCommunicator - Total 1888 records, 49543 bytes | Speed 1.61KB/s, 62 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.002s |  All Task WaitReaderTime 100.570s | Percentage 100.00%
2021-12-16 17:34:38.537 [job-0] INFO  JobContainer - 
任务启动时刻                    : 2021-12-16 17:34:06
任务结束时刻                    : 2021-12-16 17:34:38
任务总计耗时                    :                 32s
任务平均流量                    :            1.61KB/s
记录写入速度                    :             62rec/s
读出记录总数                    :                1888
读写失败总数                    :                   0
```

3)基于上面数据，再次进行增量同步：

```bash
主要是 where 配置："where": "ID > 1888 AND ID <= 2888"      # 通过条件筛选来进行增量同步
同时需要将我上面的 preSql 删除(因为我上面做的操作时 truncate 表)
```


