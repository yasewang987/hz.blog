# minio安装

参考资料：https://hub.docker.com/r/minio/minio

默认账号 `minioadmin:minioadmin`

## Docker安装

运行容器命令(minio文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 9000:9000 \
-v $PWD/data:/data \
-v $PWD/config::/root/.minio \
-e MINIO_ROOT_USER=minio \
-e MINIO_ROOT_PASSWORD=minio@123 \
--name minio \
minio/minio server /data

# 读取配置文件
-v /etc/default/minio:/etc/config.env
-e "MINIO_CONFIG_ENV_FILE=/etc/config.env"
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

## minio配置项

完整配置参考：https://min.io/docs/minio/linux/reference/minio-server/settings/core.html

```bash
# 数据磁盘位置（只支持环境变量，不能在配置文件中）
MINIO_VOLUMES="/mnt/data"
# 配置文件位置（只支持环境变量，不能在配置文件中）
MINIO_CONFIG_ENV_FILE=/etc/config.env
# root用户名（minioadmin）
MINIO_ROOT_USER=myminioadmin
# root用户密码（minioadmin）
MINIO_ROOT_PASSWORD=minio-secret-key-change-me

### cors设置
MINIO_API_CORS_ALLOW_ORIGIN="http://aaaa.com,http://bbbb.com"
### cors设置2
# 创建配置文件
vim ./cors.json
[
  {
    "AllowedOrigins": ["http://example1.com", "http://example2.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAge": 3000
  }
]
# 应用
export MINIO_CORS=/etc/minio/cors.json
minio server /data
```

## nginx 反向代理配置

```conf
server{
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