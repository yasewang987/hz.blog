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
    -e DB_HOST=192.168.1.171 \
    -e DB_PORT=28003 \
    -e DB_USER='jumpserver' \
    -e DB_PASSWORD="weakPassword" \
    -e DB_NAME=jumpserver \
    -e REDIS_HOST=192.168.1.6 \
    -e REDIS_PORT=7379 \
    -e REDIS_PASSWORD=ifuncun888 \
    jumpserver/jms_all:latest
```

## 终端连接jumpserver

```bash
# 使用ssh连接jumpserver所在服务器，端口为堡垒机的终端端口，默认2222
ssh -p 2222 account@1.1.1.1

# 如果报错：No matching host key type found. Their offer: ssh-rsa
vim ~/.ssh/config
# 增加如下内容，然后重新连接即可
# 第一行说明对所有主机生效, 第二行是将ssh-rsa加会允许使用的范围, 第三行是指定所有主机使用的都是ssh-rsa算法的key
Host *
PubkeyAcceptedKeyTypes +ssh-rsa
HostKeyAlgorithms +ssh-rsa
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

## 系统用户配置

菜单：`资产管理/系统用户`

* 特权用户：是资产已存在的, 并且拥有 高级权限 的系统用户， 如 root 或 拥有 `NOPASSWD: ALL` sudo 权限的用户。 JumpServer 使用该用户来 `推送系统用户`、`获取资产硬件信息` 等，记住特权用户一般`不要开给用户使用`。
* 普通用户：可以在资产上预先存在，也可以由 特权用户 来自动创建。这种类型的账号才是给用户使用的，一般创建好之后在资产上添加之后再推送到服务器。一般可以将 `开发、运维、测试` 等按照角色来区分。

设置完上面的用户和资产之后，还需要设置`权限管理/资产授权`，在 `系统用户` 表单中选择刚才创建的 `普通用户`。


## 常见问题处理

* 重建docker容器的时候，web管理打开linux连接页面的时候出现 `nginx 502` 错误：

    这个是因为 `koko` 选中了离线的，只需要打开 jumpserver 的管理员面的 `会话管理 - 终端管理` 将里面 `组件状态` 是 `异常` 或者 `离线` 的都删掉即可。




