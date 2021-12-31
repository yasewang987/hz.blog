# 使用docker部署nginx

```bash
# 新建配置文件夹
mkdir -p /home/nginx/conf

# 自定义配置
docker run -d -p 80:80 -p 15000-16000:15000:16000 -v /home/nginx/conf:/etc/nginx/conf.d --name nginxservers nginx:latest

# 前端项目
docker run -d -p 8080:80 --name some-nginx -v /some/content:/usr/share/nginx/html:ro nginx:latest
```