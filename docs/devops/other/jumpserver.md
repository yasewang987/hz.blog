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
    -v /home/jms:/data/jumpserver/data/media \
    -p 19000:80 \
    -p 19001:2222 \
    -e SECRET_KEY=GmmIghD61fQqPUlsoUBooLoe1DXuyYvytTQ6049IuHAbyUQBGn \
    -e BOOTSTRAP_TOKEN=RztM39jzhJVnrdb5 \
    -e DB_HOST=192.168.1.6 \
    -e DB_PORT=28003 \
    -e DB_USER='jumpserver' \
    -e DB_PASSWORD="weakPassword" \
    -e DB_NAME=jumpserver \
    -e REDIS_HOST=192.168.1.6 \
    -e REDIS_PORT=7379 \
    -e REDIS_PASSWORD=ifuncun888 \
    jumpserver/jms_all:latest
```

## nginx反向代理配置

```conf
upstream jms {
    server  192.168.1.3:19000;
}

server {
    listen      15010;
    client_max_body_size 20G; //这里特别注意一下，如果配置比较小上传文件大小会受限制

    location / {
        proxy_pass  http://jms;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $http_connection;
    }
}
```

