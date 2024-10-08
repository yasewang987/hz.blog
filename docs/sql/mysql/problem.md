# Mysql问题处理

## 忘记账号密码

```bash
# 关闭原来的服务
kill -9 mysqld-pid

# 在my.cnf文件的[mysqld]下加入如下配置
--skip-grant-tables
# 或者用启动命令
/opt/mytest/mariadb/bin/mysqld_safe --defaults-file=/opt/mytest/mariadb/my.cnf --skip-grant-tables &

# 进入mysql,不需要密码直接回车进入
bin/mysql -P 1234 -uroot -p

# 修改密码
use mysql;
alter user 'root'@'XX.XX.XX.XX' identified by ‘PASSWORD’;
# ERROR 1290 (HY000): The MariaDB server is running with the --skip-grant-tables option so it cannot execute this statement
flush privileges;
alter user 'root'@'XX.XX.XX.XX' identified by ‘PASSWORD’;
flush privileges;
```

## mariadb升级导致的问题

`Column count of mysql.proc is wrong. Expected 21, found 20`:

解决：

```bash
mysql_upgrade -u root -p
```

## mysql容器停止启动失败

`[ERROR] Can't init tc log`

```bash
# 到对应的data目录，删除文件
rm -f tc.log
```

## 配置文件无效

一般都是配置文件映射错了目录

```bash
# 查看初始conf地址
mysql --help

# 查看读取的是哪个配置文件，配置文件中include了哪个目录。需要映射到对应的目录中
cat /etc/mysql/mysql.cnf
```