# 使用docker部署nginx

```bash
# 新建配置文件夹
mkdir -p /home/nginx/conf

# 启动nginx
docker run -d -p 80:80 -v /home/nginx/conf:/etc/nginx/conf.d --name nginxservers nginx:latest
```