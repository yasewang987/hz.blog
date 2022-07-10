# 使用docker部署nginx

```bash
# 新建配置文件夹
mkdir -p /home/nginx/conf

# 自定义配置
docker run -d -p 80:80 -p 443:443 -v $PWD/nginx.conf:/etc/nginx/nginx.conf -v $PWD/conf:/etc/nginx/conf.d -v $PWD/html:/data/html -v $PWD/logs:/data/logs -v /etc/localtime:/etc/localtime --name my-nginx nginx:latest

# 前端项目
docker run -d -p 8080:80 --name some-nginx -v /some/content:/usr/share/nginx/html:ro nginx:latest
```