# Jumpserver 教程

## jumpserver部署

默认账号密码：admin/admin

前置依赖：

* mysql:[部署参考](./mysql.md)
* redis:[部署参考](./redis.md)

初始化数据库：

```bash
create database jumpserver default charset 'utf8' collate 'utf8_bin';
grant all on jumpserver.* to 'jumpserver'@'%' identified by 'weakPassword';
```

生成随机加密密钥：

```bash
if [ "$SECRET_KEY" = "" ]; then SECRET_KEY=`cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 50`; echo "SECRET_KEY=$SECRET_KEY" >> ~/.bashrc; echo $SECRET_KEY; else echo $SECRET_KEY; fi

if [ "$BOOTSTRAP_TOKEN" = "" ]; then BOOTSTRAP_TOKEN=`cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 16`; echo "BOOTSTRAP_TOKEN=$BOOTSTRAP_TOKEN" >> ~/.bashrc; echo $BOOTSTRAP_TOKEN; else echo $BOOTSTRAP_TOKEN; fi
```

拉取镜像：

```bash
docker pull jumpserver/jms_all
```

部署服务：

```bash
docker run -d --name fc-jms --restart=always \
    -v /data/jumpserver:/data/jumpserver/data/media \
    -p 19000:80 \
    -p 19001:2222 \
    -e SECRET_KEY=GmmIghD61fQqPUlsoUBooLoe1DXuyYvytTQ6049IuHAbyUQBGn \
    -e BOOTSTRAP_TOKEN=RztM39jzhJVnrdb5 \
    -e DB_HOST=192.168.1.6 \
    -e DB_PORT=3306 \
    -e DB_USER='jumpserver' \
    -e DB_PASSWORD="weakPassword" \
    -e DB_NAME=jumpserver \
    -e REDIS_HOST=192.168.1.6 \
    -e REDIS_PORT=6379 \
    -e REDIS_PASSWORD=ifuncun888 \
    jumpserver/jms_all:latest
```

