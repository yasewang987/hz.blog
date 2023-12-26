# frp内网穿透部署

github下载地址：https://github.com/fatedier/frp/releases , 客户端和服务端都下载一份

## 服务端frps

编辑 `frps.ini` 文件，配置如下

```ini
[common]
bind_port = 7000 # 服务端frps端口，和客户端通讯用
auto_token =  xxxxx #这里放的是token，客户端连接这个的时候需要填写一致，可以看做是服务器密码
vhost_http_port = 8888 # http端口

dashboard_port = 7500 # 管理网页端口
dashboard_user = admin
dashboard_pwd = admin@123456 # 管理密码
```

启动服务

```bash
nohup ./frps -c ./frps.ini
```

## 客户端frpc

编辑 `frpc.ini`文件，配置如下

```ini
[common]
server_addr = 172.16.3.202 #填写你刚刚部署的frps的地址
server_port = 7000  #填写frps的bind_port
auto_token = xxxxxx  #填写token

[ssh] # 对外暴露的服务名称
type = tcp
local_ip = 192.168.1.93 #填写客户端机器要被代理的网络内的IP 填写127.0.0.1就代表本机
local_port = 9999 # 要访问的端口号
remote_port = 29999  # 远程代理端口号（需要在服务端开启端口防火墙、服务端配置文件不需要添加任何内容）

[web1] # 对外暴露的服务名称
type = tcp
local_ip = 127.0.0.1#填写客户端机器要被代理的网络内的IP 填写127.0.0.1就代表本机
local_port = 11111 # 要访问的端口号
remote_port = 29998  # 远程代理端口号 
```