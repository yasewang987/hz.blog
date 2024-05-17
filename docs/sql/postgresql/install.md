# Postgresql安装及命令

## 常用命令

```bash

```

## docker安装

```bash
# POSTGRES_PASSWORD：密码
# POSTGRES_PASSWORD_FILE：密码文件
# POSTGRES_USER：用户
# POSTGRES_DB：默认数据库
# POSTGRES_INITDB_ARGS：初始化数据参数 -e POSTGRES_INITDB_ARGS="--data-checksums"
# PGDATA：指定容器内数据库存放路径
docker pull postgres

# 获取默认配置文件
# 一定要设置listen_addresses = '*'，不然外部无法连接
docker run -i --rm postgres cat /usr/share/postgresql/postgresql.conf.sample > my-postgres.conf

docker run -d \
--name some-postgres \
-e POSTGRES_PASSWORD=mysecretpassword \
-e PGDATA=/var/lib/postgresql/data/pgdata \
-v /data/postgresql/data:/var/lib/postgresql/data \
-v /data/postgresql/my-postgres.conf:/etc/postgresql/postgresql.conf
-c 'config_file=/etc/postgresql/postgresql.conf'
postgres

### 启动运行初始化脚本sh/sql，推荐用sh，如下例子
# /docker-entrypoint-initdb.d目录下的所有脚本都执行
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER docker;
	CREATE DATABASE docker;
	GRANT ALL PRIVILEGES ON DATABASE docker TO docker;
EOSQL
```

## 离线安装-todo