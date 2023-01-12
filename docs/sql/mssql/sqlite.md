# Sqlite3介绍

## 安装

```bash
apt install sqlite3
```

## 常见操作

```bash
# 打开数据库(没有新建，有则进入数据库)
sqlite3 test.db

# 查看数据库
.databases
# 查看表
.tables
# 创建server表
create table server (
  id integer primary key autoincrement not null,
  ip varchar(15) not null,
  port int not null,
  username varchar(50) not null,
  pwd varchar(100) not null
);
# 插入数据
insert into server(ip,port,username,pwd) values ('111.111.111.111','2017','root','mypassword');
# 更新数据
update server set username='root2' where id=1;
# 删除数据
delete from server where id=1;
# 查询数据
select * from server;

# 查看表结构
 select * from sqlite_master where name = 'tablename';

# 退出
.exit
```