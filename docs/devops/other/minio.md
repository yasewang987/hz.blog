# minio安装

参考资料：https://hub.docker.com/r/minio/minio

默认账号 `minioadmin:minioadmin`

## Docker安装

运行容器命令(minio文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 9000:9000 \
-v $PWD/data:/data \
-v $PWD/config::/root/.minio \
-e MINIO_ACCESS_KEY=minio \
-e MINIO_SECRET_KEY=minio@123 \
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

## nginx 反向代理配置

```conf
 listen 80;
 server_name example.com;

 # To allow special characters in headers
 ignore_invalid_headers off;
 # Allow any size file to be uploaded.
 # Set to a value such as 1000m; to restrict file size to a specific value
 client_max_body_size 0;
 # To disable buffering
 proxy_buffering off;

 location / {
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header Host $http_host;

   proxy_connect_timeout  300;
   # 这个配置很关键
   proxy_http_version 1.1;
   proxy_set_header Connection "";

   proxy_pass http://localhost:9000;
 }
}
```