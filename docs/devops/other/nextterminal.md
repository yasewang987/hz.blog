# Next-Terminal

Next Terminal是使用Golang和React开发的一款HTML5的远程桌面网关，具有小巧、易安装、易使用、资源占用小的特点，支持RDP、SSH、VNC和Telnet协议的连接和管理。

Next Terminal基于 Apache Guacamole 开发，使用到了guacd服务。

项目地址：https://github.com/dushixiang/next-terminal

next-terminal 使用了supervisord来管理服务，因此相关日志在 `/var/log/supervisor/next-terminal-*.log`

程序安装目录地址为：`/usr/local/next-terminal`

录屏文件存放地址为：`/usr/local/next-terminal/recording`

远程桌面挂载地址为：`/usr/local/next-terminal/drive`

## docker部署

```bash
mkdir -p "/opt/next-terminal/drive"
mkdir -p "/opt/next-terminal/recording"
touch /opt/next-terminal/next-terminal.db

docker run -d \
  -p 8088:8088 \
  -v /opt/next-terminal/drive:/usr/local/next-terminal/drive \
  -v /opt/next-terminal/recording:/usr/local/next-terminal/recording \
  -v /opt/next-terminal/next-terminal.db:/usr/local/next-terminal/next-terminal.db \
  --name next-terminal \
  --restart always dushixiang/next-terminal:latest

```

## 反向代理配置

主要是反向代理websocket，示例如下

```conf
location / {
    proxy_pass http://127.0.0.1:8088/;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
}
```