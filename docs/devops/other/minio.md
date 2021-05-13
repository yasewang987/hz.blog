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