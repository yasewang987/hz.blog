# 网站SSL证书配置

* 注意，如果前端站点需要同时支持http和https，则需要配置访问后端的接口的地址不带协议，例如 `//api.test.top`

## 自签名ssl

创建自签名证书需要安装openssl，创建证书的域名和申请的域名最好一致，使用以下步骤：

1. 创建Key；
1. 创建签名请求；
1. 将Key的口令移除；
1. 用Key签名证书。

```sh
#!/bin/sh

# create self-signed server certificate:

read -p "Enter your domain [www.example.com]: " DOMAIN

echo "Create server key..."

openssl genrsa -des3 -out $DOMAIN.key 2048

echo "Create server certificate signing request..."

SUBJECT="/C=US/ST=Mars/L=iTranswarp/O=iTranswarp/OU=iTranswarp/CN=$DOMAIN"

openssl req -new -subj $SUBJECT -key $DOMAIN.key -out $DOMAIN.csr

echo "Remove password..."

mv $DOMAIN.key $DOMAIN.origin.key
openssl rsa -in $DOMAIN.origin.key -out $DOMAIN.key

echo "Sign SSL certificate..."

openssl x509 -req -days 3650 -in $DOMAIN.csr -signkey $DOMAIN.key -out $DOMAIN.crt

echo "TODO:"
echo "Copy $DOMAIN.crt to /etc/nginx/ssl/$DOMAIN.crt"
echo "Copy $DOMAIN.key to /etc/nginx/ssl/$DOMAIN.key"
echo "Add configuration in nginx:"
echo "server {"
echo "    ..."
echo "    listen 443 ssl;"
echo "    ssl_certificate     /etc/nginx/ssl/$DOMAIN.crt;"
echo "    ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key;"
echo "}"
```

## acme.sh方式

github地址：https://github.com/acmesh-official/acme.sh

### 常用命令

```bash
# 查看已运行证书
acme.sh --list
```

### 安装
```bash
#### 安装
# 在线安装acme.sh
curl https://get.acme.sh | sh
# 注册（这一步一定要做）
acme.sh --register-account -m 123455@qq.com

# 下载安装（网络问题无法在线安装），到release页面下载对应版本安装包，解压安装
unzip acme.sh-master.zip
cd acme.sh-master
./acme.sh --install -m i@test.top

# 会创建一个定时任务
crontab -l

### 生效配置
source ~/.bashrc
# 检验（执行命令后显示提示信息）
acme.sh --test

### dns方式生成证书（阿里云）【一定要先执行】
# 登陆阿里云选择access key，【创建子账户】并获取对应的key和secret。记录下来。并点击用户名，给这个子账户添加DNS相关权限。
# 前面两个export执行一次之后就会自动记住，不用放bashrc
export Ali_Key="key值"
export Ali_Secret="key Secret"
# 指定域名
export yuming=zs.test.cn
# 如果证书中只包含泛域名，那么签发出来的证书是没有根域的。所以需要额外添加一个根域。
# --force可以不用
acme.sh --issue --dns dns_ali -d test.top -d *.test.top --force
acme.sh --issue --dns dns_ali -d ${yuming} --force
# 成功了，会提示信息
[Wed Feb  7 10:15:36 CST 2024] Your cert is in: /root/.acme.sh/*.test.top_ecc/*.test.top.cer
[Wed Feb  7 10:15:36 CST 2024] Your cert key is in: /root/.acme.sh/*.test.top_ecc/*.test.top.key
[Wed Feb  7 10:15:36 CST 2024] The intermediate CA cert is in: /root/.acme.sh/*.test.top_ecc/ca.cer
[Wed Feb  7 10:15:36 CST 2024] And the full chain certs is there: /root/.acme.sh/*.test.top_ecc/fullchain.cer

#### nginx配置修改
server {
    listen                     443 ssl;
    server_name                test.top;

    ssl_certificate            /data/ssl/test.top.pem;
    ssl_certificate_key        /data/ssl/test.top.key;
    ssl_buffer_size            16k;
    ssl_protocols              TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ecdh_curve             X25519:P-256:P-384:P-224:P-521;
    ssl_ciphers                TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256;
    ssl_prefer_server_ciphers  on;
    ssl_session_timeout        3h;
    ssl_stapling               on;
    ssl_session_tickets        on;

    gzip on;
    gzip_comp_level     6;
    gzip_min_length     1000;
    gzip_buffers        32 4k;
    gzip_proxied        any;
    gzip_types text/plain application/xml application/javascript application/x-javascript text/css application/json;
    gzip_vary on;
    location / {
      root   /data/web/;
      index index.html;
      try_files $uri $uri/ /index.html;
    }
}

### 安装证书(nginx)
# 安装证书到指定位置
acme.sh --install-cert -d test.top --key-file /data/ssl/test.top.key --fullchain-file /data/ssl/test.top.pem --reloadcmd "nginx -s reload"
acme.sh --install-cert -d ${yuming} --key-file /opt/funcun/nginx/ssl/${yuming}.key --fullchain-file /opt/funcun/nginx/ssl/${yuming}.pem --reloadcmd "docker exec fc-nginx nginx -s reload"
# 重启一下nginx
docker exec -it nginx nginx -s reload

### 查看列表
acme.sh --list

#### 删除自动签发证书
acme.sh --remove -d example.com [--ecc]
# 手动清理证书文件
rm -rf ~/.acme.sh/example.com

#### 升级acme.sh
acme.sh --upgrade
```

## ohttps.com

申请链接：https://ohttps.com

ohttps.com提供了类似于acme.sh的功能，不过提供了友好的管理界面，可申请Let's Encrypt免费通配符类型证书，还提供了证书吊销、到期前提醒、自动更新、自动部署功能。另外比acme.sh增加了一些非常实用的功能，主要包括可自动部署至阿里云、腾讯云、七牛云的负载均衡、内容分发CDN、SSL证书列表等，并可自动部署至多个nginx容器中。如果你有在证书更新后自动部署至多个不同节点的需求，使用ohttps.com就对了，在这里强烈推荐大家使用ohttps.com申请和管理Let's Encrypt颁发的免费HTTPS证书。

## 问题处理

* 如果碰到了“HSTS”问题，一般报错`Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request`

```bash
# 修改nginx配置，在nginx.conf的http下添加
# 这个add_header指令告诉Nginx添加一个HSTS头到HTTP响应中。"max-age=0"指定了一个零秒的时间，这意味着浏览器将不会再缓存HSTS设置，而"includeSubDomains"指示浏览器应该将这个HSTS设置应用于所有子域名。
add_header Strict-Transport-Security "max-age=0; includeSubDomains" always;

# 重新加载nginx
nginx -s reload

# 如果浏览器已经缓存了HSTS，需要先清除缓存，再访问
# 不能直接输入根域名，要输入详细的二级域名
chrome://net-internals/#hsts
```