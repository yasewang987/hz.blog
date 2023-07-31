# VPN部署

## OpenVPN服务端部署

```bash
# 拉取OpenVPN镜像
docker pull kylemanna/openvpn
mkdir -p /home/docker/openvpn
cd /home/docker/openvpn

# 生成配置文件（公网ip也可以使用域名代替，如果需要udp替换一下协议即可）
docker run -v $PWD:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u tcp://{公网IP/局域网IP/域名}

# 生成私钥文件
docker run -v $PWD:/etc/openvpn  --rm -it kylemanna/openvpn ovpn_initpki
# 按命令提示输入密码进行下一步操作

# 生成客户端证书
# Nopass 客户端是否需要输入密码，加上客户端不用输入密码，去掉需设置密码，客户端访问时输入密码
docker run -v $PWD:/etc/openvpn --log-driver=none --rm -it kylemanna/openvpn easyrsa build-client-full {客户端名称} nopass
# 生成完成后，输入上面设置的CA密码

# 导出客户端配置（客户端名称随意即可）
docker run -v $PWD:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient {客户端名称} > $PWD/{客户端名称}.ovpn

# 安装OpenVPN服务（如果选择的udp协议，注意改一下端口映射协议）
docker run -d --name openvpn -v $PWD:/etc/openvpn -d -p 1194:1194/tcp --cap-add=NET_ADMIN  --restart=always -it -d  kylemanna/openvpn

# 需要开启防火墙 1194端口的udp/tcp

# 重新启动Docker服务器（一般不需要执行）
systemctl restart docker

# 客户端配置文件下载到本地，然后通过openvpn-client导入连接vpn
home/docker/openvpn/conf/{客户端名称}.ovpn
```

客户端连接服务器的时候，提示`TLS key negotiation failed to occur within 60 seconds (check your network connectivity)`，则查看客户端是否开启1194端口的出入站防火墙，如果还是有问题，可以将upd协议替换成tcp试试