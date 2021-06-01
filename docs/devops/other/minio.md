# minio安装

参考资料：https://hub.docker.com/r/minio/minio

默认账号 `minioadmin:minioadmin`

## Docker安装

运行容器命令(minio文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 9000:9000 \
-v $PWD/data:/data \
--name minio \
minio/minio server /data
```

## 直接安装运行

下载地址：https://dl.minio.io/server/minio/release/  ，下载对应版本的 `minio` 可执行文件，

添加可执行权限

```bash
chmod +x minio
```

后台启动：

```bash
nohup /opt/minio/minio server /opt/minio > /opt/minio/minio.log 2>&1 &
```

前台启动:

```bash
/opt/minio/minio server /opt/minio
```

## 访问minio

http://IP:9000

默认账号 `minioadmin:minioadmin`