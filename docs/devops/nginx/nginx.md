# Nginx

Nginx 是一个采用主从架构的 Web 服务器，可用于反向代理、负载均衡器、邮件代理和 HTTP 缓存。

* worker_processes： 进程数，一般配置和服务器核心数一致
* worker_connections：尽量大一点，推荐 65535

## Nginx常用命令

```bash
# 首次启动 Nginx Web 服务器
sudo nginx

# 检查配置文件
/usr/local/nginx/sbin/nginx -t -c /usr/local/nginx/conf/nginx.conf

# 重新加载正在运行的 Nginx Web 服务器
sudo nginx -s reload
sudo /usr/local/nginx/sbin/nginx -s reload

# 直接关闭worker子进程
sudo nginx -s stop

# 等待worker子进程正确处理完请求后关闭
nginx -s quit

# 查看系统上运行的 Nginx 进程
ps -ef | grep Nginx
sudo kill -9 <PID>

# 查看当前版本及编译配置信息
sudo nginx -V
```

## Nginx Web配置

```conf
# 前端示例
location / {
        root   /data/html/;
        index  index.html index.html;
        # vue history
        try_files $uri $uri/ /index.html;
}
location /train {
     alias  /data/trainning/;
     index  index.html index.html;
}
```

如果配置两个 `root`，http://xxxx/train 会提示404。

`root`的处理结果是：root路径＋location路径 `alias`的处理结果是：使用alias路径替换location路径 `alias`是一个目录别名的定义，root则是最上层目录的定义。 还有一个重要的区别是alias后面必须要用 `/` 结束，否则会找不到文件的。。。而root则可有可无~~

## Nginx 反向代理配置

```conf
server {
    listen       80;
    server_name www.aa.cn;

    location / {
        proxy_pass http://IP:8080/projectName/;
        # 这条是设置cookie
        proxy_cookie_path /projectName /;
        proxy_set_header   Host    $host;
        proxy_set_header   X-Real-IP   $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /projectName {
        proxy_pass http://IP:8080/projectName/;
        proxy_cookie_path /projectName /;
        proxy_set_header   Host    $host;
        proxy_set_header   X-Real-IP   $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Nginx后端服务健康检查

nginx_upstream_check_module

```conf
upstream tomcat_pools {
    ip_hash;
    # 3s内出现3次错误，则认为后端服务有问题，等待3s之后再分配请求进来
    server 172.16.1.91:8080 weight=1 max_fails=3 fail_timeout=3s;
    # fail_timeout=0: 无论后端失败了多少次， NGINX 会继续把请求分发到这个后端服务
    # max_fails=0: 认为服务器是一直可用的
    server 172.16.1.91:8081 weight=1 max_fails=0 fail_timeout=0;
    server 172.16.1.91:8081 weight=1 max_fails=3 fail_timeout=3s;
    check interval=2000 rise=3 fall=2 timeout=1000 type=http;
    #对tomcat_pools这个负载均衡池中的所有节点，每个2秒检测一次，
    #请求3次正常则标记realserver状态为up，如果检测2次都失败，则
    #标记realserver的状态为down，后端健康请求的超时时间为1s，健
    #康检查包的类型为http请求。
    check_http_send "HEAD / HTTP/1.0\r\n\r\n";
    #通过http HEAD消息头检测realserver的健康
    check_http_expect_alive http_2xx http_3xx;
    #该指令指定HTTP回复的成功状态，默认为2XX和3XX的状态是健康的
}

server {
    listen        0.0.0.0:80;
    server_name   localhost;
    access_log    logs/tomcat-access.log main;
    error_log     logs/tomcat-error.log warn;

    location / {
        proxy_pass http://tomcat_pools;
        # 用户真实的ip地址转发给后端服务器
        proxy_set_header Host $host;  #$host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /nstatus {
    #状态页配置
        check_status;
        access_log off;
        allow      172.16.1.254;
        #允许可以连接的远端ip地址
        deny       all;
        #限制所有远端ip的连接
    }
}
```

访问http://172.16.1.91/nstatus监控界面

健康检查参数说明：

interval：向后端发送的健康检查包的间隔。

fall(fall_count)：如果连续失败次数达到fall_count，服务器就被认为是down。

rise(rise_count)：如果连续成功次数达到rise_count，服务器就被认为是up。

timeout：后端健康请求的超时时间。

default_down：设定初始时服务器的状态，如果是true，就说明默认是down的，如果是false，就是up的。

默认值是true，也就是一开始服务器认为是不可用，要等健康检查包达到一定成功次数以后才会被认为是健康的。

type：健康检查包的类型，现在支持以下多种类型：

tcp：简单的tcp连接，如果连接成功，就说明后端正常。

ssl_hello：发送一个初始的SSL hello包并接受服务器的SSL hello包。

http：发送HTTP请求，通过后端的回复包的状态来判断后端是否存活。

mysql：向mysql服务器连接，通过接收服务器的greeting包来判断后端是否存活。

ajp：向后端发送AJP协议的Cping包，通过接收Cpong包来判断后端是否存活。

port：指定后端服务器的检查端口。你可以指定不同于真实服务的后端服务器的端口，比如后端提供的是443端

口的应用，你可以去检查80端口的状态来判断后端健康状况。默认是0，表示跟后端server提供真实服务的端口一

样。该选项出现于Tengine-1.4.0。

## Nginx Stream配置

例如：mysql 、 redis 这些需要使用stream配置

特别注意：stream要与http在同级目录  

```conf
stream {
    upstream mysql3306 {
        hash $remote_addr consistent;
        server 172.31.88.27:3306 weight=5 max_fails=3 fail_timeout=30s;
    }
	
	 server {
        listen 3307;
        proxy_connect_timeout 10s;
        proxy_timeout 200s;
        proxy_pass mysql3306;
    }
}
```

## Nginx WebSocket配置

客户端发起请求时是和反响代理服务器建立请求， 此时客户端携带的 Upgrade、Connection头是不会被反向代理服务器直接转发到后端服务的(这就是逐跳标头)， 后端服务获取不到这两个头信息自然也不会主动去切换协议。

因此，需要在反向代理服务器转发上游时带上客户端原来的请求头，才可以完成协议的升级或切换。

 `Upgrade、Connection`，这两个请求头都是逐跳标头(只能传输一次，不能透传)

```conf
location / {
    proxy_pass http://127.0.0.1:8088/;
    # 设置http协议版本1.1
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # 能且只能在http1.1版本中使用， 用来标识协议升级/转换
    # Upgrade: websocket； 表示客户端希望使用websocket协议通信， 那么后端的ws程序取到头信息后会返回101状态码(协议转换),此时浏览器就会使用当前的TCP连接建立websocket通道。
    proxy_set_header Upgrade $http_upgrade;
    # Connection头信息取值upgrade, 表示本次请求是一次协议升级(协议转换)请求, 配合 Upgrade: websocket信息, 完整表达了这个请求要升级到websocket协议。
    proxy_set_header Connection $connection_upgrade;
}
```
## proxy_pass 相对/绝对 路径

### 绝对路径

```conf
# 注意在proxy_pass地址后面带上 /
location /proxy {
    proxy_pass http://192.168.137.181:8080/;
}

location /proxy {
    proxy_pass http://10.0.0.1:8080/static01/;
}
```

第一个： 当访问 `http://127.0.0.1/proxy/test/test.txt` 时，nginx匹配到 `/proxy` 路径，把请求转发给 `192.168.137.181:8080` 服务，实际请求路径为`http://10.0.0.1:8080/test/test.txt`，nginx会去掉匹配的`/proxy`。

第二个： 当访问 `http://127.0.0.1/proxy/test/test.txt` 时，nginx匹配到`/proxy`路径，把请求转发给`192.168.137.181:8080`服务，实际请求代理服务器的路径为`http://10.0.0.1:8080/static01/test/test.txt`。

### 相对路径

```conf
# 注意在proxy_pass地址后面没有 /
location /proxy {
    proxy_pass http://10.0.0.1:8080;
}
```

当访问 `http://127.0.0.1/proxy/test/test.txt` 时，nginx匹配到`/proxy`路径，把请求转发给 `192.168.137.181:8080` 服务，实际请求代理服务器的路径为`http://192.168.137.181:8080/proxy/test/test.txt`， 此时nginx会把匹配的`/proxy`也代理给代理服务器。

## Nginx日志配置

日志可以放到 `http server location` 模块中。

```conf
http {

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"'
                      '$request_time "$upstream_addr" $upstream_response_time';

    access_log  /var/log/nginx/access.log  main;
    include /etc/nginx/conf.d/*.conf;
}
```

`$remote_addr`  #记录访问网站的客户端地址

`$remote_user`  #远程客户端用户名

`$time_local`  #记录访问时间与时区

`$request`  #请求方式、类型(post,get···)

`$status`  #http状态码，记录请求返回的状态码，例如：200、301、404等

`$body_bytes_sent`  #服务器发送给客户端的响应body字节数

`$http_referer`  #记录此次请求是从哪个连接访问过来的，可以根据该参数进行防盗链设置。

`$http_user_agent`  #记录客户端访问信息，例如：浏览器、手机客户端等

`$http_x_forwarded_for`  #当前端有代理服务器时，设置web节点记录客户端地址的配置，此参数生效的前提是代理服务器也要进行相关的x_forwarded_for设置

`$request_time` 请求总的耗时

`$upstream_addr` 后端服务的地址

`$upstream_response_time` 后端服务的响应时间

## Nginx不记录某些日志的配置

```nginx
server {
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|js|css)$ {
        access_log off;
    }
}
```
## Nginx日志切割备份

```bash
# 创建并编辑shell脚本
vim nginx_logback.sh
# 内容如下

#!/bin/bash
YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
LOGPATH=/usr/local/openresty/nginx/logs/
PID=${LOGPATH}nginx.pid
mv ${LOGPATH}access.log ${LOGPATH}access-${YESTERDAY}.log
mv ${LOGPATH}error.log ${LOGPATH}error-${YESTERDAY}.log

kill -USR1 `cat ${PID}`

# 添加执行权限
chmod +x nginx_logback.sh

# 添加定时任务
crontab -e

0 0 * * * /bin/bash /root/nginx_logback.sh
```
## Nginx 超时时间

* `client_header_timeout` 60s： 客户端向服务端发送一个完整的 `request header` 的超时时间。如果客户端在指定时间内没有发送一个完整的 request header，Nginx 返回 HTTP 408（Request Timed Out）。

* `client_body_timeout` 60s： 指定客户端与服务端建立连接后发送 `request body` 的超时时间。如果客户端在指定时间内没有发送任何内容，Nginx 返回 HTTP 408（Request Timed Out）。

* `send_timeout` 60s: 服务端向客户端传输数据的超时时间。

* `keepalive_timeout` 75s：客户端与代理的超时时间,默认75s，通常keepalive_timeout应该比client_body_timeout大

    HTTP 是一种无状态协议，客户端向服务器发送一个 TCP 请求，服务端响应完毕后断开连接。

    如果客户端向服务器发送多个请求，每个请求都要建立各自独立的连接以传输数据。

    HTTP 有一个 KeepAlive 模式，它告诉 webserver 在处理完一个请求后保持这个 TCP 连接的打开状态。若接收到来自客户端的其它请求，服务端会利用这个未被关闭的连接，而不需要再建立一个连接。

    KeepAlive 在一段时间内保持打开状态，它们会在这段时间内占用资源。占用过多就会影响性能。

    Nginx 使用 keepalive_timeout 来指定 KeepAlive 的超时时间（timeout）。指定每个 TCP 连接最多可以保持多长时间。Nginx 的默认值是 75 秒，有些浏览器最多只保持 60 秒，所以可以设定为 60 秒。若将它设置为 0，就禁止了 keepalive 连接

* `proxy_connect_timeout` 60s：nginx与`upstream server`的连接超时时间

* `proxy_read_timeout` 60s： nginx接收`upstream server`数据超时, 默认60s, 如果连续的60s内没有收到1个字节, 连接关闭

* `proxy_send_timeout` 60s： nginx发送数据至`upstream server`超时, 默认60s, 如果连续的60s内没有发送1个字节, 连接关闭

## 跨域CORS

```conf
server {
    listen 5000;
    server_name 1.1.1.1;
    # 允许跨域请求的域
    add_header 'Access-Control-Allow-Origin' *;
    # 允许带上cookie请求
    add_header 'Access-Control-Allow-Credentials' 'true';
    # 允许请求的方法 如POST/GET/DELETE/PUT
    add_header 'Access-Control-Allow-Methods' *;
    # 允许携带的请求头
    add_header 'Access-Control-Allow-Headers' *;

    # 如果服务端里面没有处理 options 请求，需要加如下配置
    if ( $request_method = 'OPTIONS' ) {
        return 200;
    }

    location / {
        proxy_pass http://127.0.0.1:5001
    }
}
```
## 配置SSL

检查nginx中是否包含http_ssl_module模块：`nginx -V`,如果没有需要下载源码编译。

```conf
server {
    listen 80;
    server_name aa.bb.cn;
    # rewrite ^(.*) https://$server_name$1 permanent;
    return 301 https://$server_name$request_uri;
}
server {
    # https 监听的是443端口
    listen       443 ssl;
    # 指定准备好的域名
    server_name  aa.bb.cn;
    ssl on;
    # 指定证书路径，这里需要把准备好的证书放到此目录
    ssl_certificate      /usr/local/nginx/myssl/aa.bb.cn.pem;
    ssl_certificate_key  /usr/local/nginx/myssl/aa.bb.cn.key;
    ssl_session_cache    shared:SSL:10m;
    # 超时时间
    ssl_session_timeout 30m;
    # 表示使用的TLS协议的类型
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    # 表示使用的加密套件的类型
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    # 设置协商加密算法时，优先使用我们服务端的加密套件，而不是客户端浏览器的加密套件。 
    ssl_prefer_server_ciphers on;
    location /www/ {
        root   static;
        index  index.html index.htm;
    }
}
```
## Nginx中map使用

`ngx_http_map_module` 模块

* Nginx根据请求头转发到不同版本服务

转发规则配置，使用`$http_xxx`，来获取header指定的值，`$http_`为固定格式,`xxx`为自定义header字段名。

```conf
http {
    map_hash_bucket_size 64;
    # 请求头header示例
    map $http_apiversion $apiupstream {
        default apiversion1;
        v2 apiversion2;
    }
    # cookie示例
    map $cookie_apiversion $apiupstream {
        default apiversion1;
        v2 apiversion2;
    }
    upstream apiversion1 {
        server 10.168.173.29:8080 max_fails=0 fail_timeout=0;
    }
    upstream apiversion2 {
        server 10.168.177.171:8080 max_fails=0 fail_timeout=0;
    }
    server {
        listen 8998;
        server_name aa.bb.cc;
        location / {
            proxy_pass http://$apiupstream
            proxy_pass http://$apiupstream;
        }
    }
}
```
客户端调用示例：

```bash
# header
curl -H 'apiversion: v2' a.test.com/api
# cookie
curl --cookie "apiversion=v2" a.test.com/api
```

* 多域名跨域访问：

```conf
map $http_origin $allow_origin {
    default               deny;
    ~http://www.baidu.com http://www.baidu.com;
    ~http://m.baidu.com   http://m.baidu.com;
    ~http://a.baidu.com   http://a.baidu.com;
}
server {
    listen 80;
    server_name www.baidu.com;
    location / {
        ...
        add_header Access-Control-Allow-Origin $allow_origin;
        ...
    }
}
```
## mirror流量复制

`ngx_http_mirror_module` 模块，mirror 指令提供的核心功能就是流量复制

* Nginx会丢弃`mirror`响应，但是如果`mirror`过去的请求一直无响应或响应慢的时候，这时会影响主请求的响应速度的。
* 需要注意，一般不会把`POST/PUT`等会影响数据状态的请求做镜像的， 除非你明确清楚的知道这样产生的影响并且可以接受.

```conf
location / {
    # 开启流量复制
    mirror /mirror;
    proxy_pass http://backend;
}

# 复制的流量转发到这里
location = /mirror {
    # internal 标志该location只为内部的重定向服务， 外面来的返回404
    internal;
    # $request_uri 需要显示指明，因为流量复制过来之后会丢掉request_uri
    proxy_pass http://test_backend$request_uri;
}
```

 基于cookie分流遇到的一个问题是：对于第三方的回调请求支持不友好， 因为第三方不可能携带我们自定义的cookie来回调我们。为了解决第三方回调的问题，我们开启了Nginx的mirror， 把回调接口的请求复制到测试所有环境内，总有一个是目标环境(从业务上说即使回调到其他环境也无所谓，所以直接镜像到所有环境)。

 ```conf
 location /notify/v1.0/ {
    mirror  /test-01;
    mirror  /test-02;
    mirror  /test-03;
    mirror  /test-04;
    mirror  /test-05;
    mirror  /test-06;
    mirror  /test-07;
    mirror  /test-08;
    mirror  /test-09;
    mirror  /test-10;
}

location = /test-01 {
    internal;
    # 头信息视情况添加/删除
    proxy_pass_header Server;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;

    proxy_pass http://upstream_test-01$request_uri;
}

upstream upstream_test-01 {
    server 1.1.1.1:80 weight=100 max_fails=10 fail_timeout=60s;
}
 ```

## 防盗链配置

`ngx_http_referer_module` 模块

```conf
server {
    listen       80;
    server_name 47.113.204.41;
    # 针对html访问的匹配规则
    location /www/ {
        root static;
        index index.html index.htm;
    }
    # 针对图片访问的匹配规则
    location /img/ {
        root static;
        #对源站点的验证，验证IP是否是47.113.204.41
        #可以输入域名，多个空格隔开
        valid_referers 47.113.204.41;
        #非法引入会进入下方判断
        if ($invalid_referer) {
            #这里返回403，也可以rewrite到其他图片
            return 403;
        }
    }
    charset utf-8;
}
```
## 隐藏版本信息

作用域：`http server location`

http {
    server_tokens off;
}

## Nginx静态文件服务器

注意需要将对应的文件夹`/home/data/download`权限改成 `777`.

```conf
server {
    # 监听8001端口
    listen       8001;
    server_name  192.168.0.2;
    # 指定使用utf8的编码
    charset utf-8;
    # 内容根目录
    root /home/data/download;

    location / {
        # 自动创建目录文件列表为首页
        autoindex on;
        # 自动首页的格式为html
        autoindex_format html;
        # 关闭文件大小转换
        autoindex_exact_size off;
        # 按照服务器时间显示文件时间
        autoindex_localtime on;

        default_type application/octet-stream;
        # 开启零复制。默认配置中，文件会先到nginx缓冲区，开启零复制后，文件跳过缓冲区，可以加快文件传输速度。
        sendfile on;
        # 限制零复制过程中每个连接的最大传输量
        sendfile_max_chunk 1m;
        # tcp_nopush与零复制配合使用，当数据包大于最大报文长度时才执行网络发送操作，从而提升网络利用率。
        tcp_nopush on;
        # 启用异步IO，需要配合direcio使用
        aio on;
        # 大于10MB的文件会采用直接IO的当时进行缓冲读取
        directio 10m;
        # 对齐文件系统块大小4096
        directio_alignment 4096;
        # 启用分块传输标识
        chunked_transfer_encoding on;
        # 文件输出的缓冲区大小为128KB
        output_buffers 4 32k;
    }
}
```

## Location配置优先级

使用`Nginx Location`可以控制访问网站的路径, 但一个`server`可以有多个`location`配置

优先级从高到低：

1. `=`: 精确匹配
1. `^~`: 以某个字符串开头
1. `~`: 区分大小写的正则匹配
1. `~*`: 不区分大小写的正则匹配
1. `/`: 通用匹配，任何请求都会匹配到

```conf
server {
    listen 80;
    server_name _;
    # 不区分大小写正则
    location ~* /python {
        default_type text/html;
        return 200 "Location ~*";
    }
    # 区分大小写正则
    location ~ /Python {
        default_type text/html;
        return 200 "Location ~";
    }
    # 以xx开头
    location ^~ /python {
        default_type text/html;
        return 200 "Location ^~";
    }
    # 精准匹配
    location = /python {
        default_type text/html;
        return 200 "Location =";
    }
}
```
## 个性化404页面

```conf
server{
    listen 80;
    server_name www.aa.com;
    location / {
        root /opt/aa;
        index index.html aa.html;
    }
    error_page 404 /404.html;
    location = /404.html {
        root /opt/aa;
    }
}
```
## PV、UV、IP统计

```bash
# 1. 统计一天内访问最多的10个ip
# 日期：日/月/年:时:分:秒 -> 01/Sep/2022
grep '日期' [日志路径] | awk '{arry[$1]++}END{for(i in ips ){print i , arry[i]}}'|sort -k2 -rn

# 2、 统计每个URL访问内容总大小($body_bytes_sent)
grep '日期' [日志路径]| awk '{urls[$7]++;size[$7]+=$10}END{for(i in urls){print "次数" urls[i],"体积" size[i], "内容" i}}'| sort -kl -rn | head -10

# 3、统计IP访问状态码为404和出现的次数($status)
grep '日期' [日志路径] | awk '{if($9="404"){ip_code[$1"   "$9]++}}END{for(i in ip_code){print i,ip_code[i]l}}'

# 4、统计前一分钟的PV量
date=$(date -d '-1 minute'+%Y:9%H:%M); awk -v awkdate=$date '$0 ~ date{it+}END{print i}' /var/log/nginx/access.log
```
## Nginx连接状态统计模块

模块名：`ngx_http_stub_status_module`, `--with-http_stub_status_module`

生效范围：`server,location`

使用时需要确认模块是否安装：

```bash
nginx -V | grep http_stub_status_module
```

使用示例：

```conf
server{
    listen 80;
    server_name www.aa.com;
    location / {
        root /opt/aa;
        index index.html;
    }
    location /status {
        # 主要是这里
        stub_status;
        allow all;
    }
}
```

* `Active connections` ：当前活动的连接数（用户数）
* `server accepts handled requests`：服务器接受处理的请求
    1. 第一个：总连接数
    1. 第二个：成功连接数
    1. 第三个：总共处理的请求数
* `Reading：0` ：读取客户端`Header`的信息数，请求头
* `Writing：1`：返回给客户端的`Header`的信息署，响应头
* `Waiting：1`：等待的请求数，开启了`keepalive`（长连接）

## Nginx访问限制模块(限流)

`ngx_http_limit_req_module` 模块：用于限制每个已定义键的请求处理速率，特别是来自单个 IP 地址的请求的处理速率，使用`leaky bucket`方法完成限制；

```conf
# 语法
Syntax:	limit_req zone=name [burst=number] [nodelay | delay=number];
Default:	—
Context:	http， server，location
```

示例

```conf
#  Example Configuration
http {
    #limit_req_zone ：限制请求
    # $binary_remote_addr ：二进制地址
    # zone=one:10m ：限制策略的名称：占用10M空间
    # rate=1r/s：允许每秒1次请求
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    ...

    server {

        ...

        location /search/ {
            # limit_req zone=one：引用限制策略的名称one
            # burst=5 表示最大延迟请求数量不大于5。如果太过多的请求被限制延迟是不需要的，这时需要使用nodelay参数，服务器会立刻返回503状态码。
            limit_req zone=one burst=5;
        }
    }
}
```

`ngx_http_limit_conn_module` 模块: 用于限制链接（TCP），特别是来自单个IP地址的连接数。不是所有的连接都被计算在内。只有当服务器正在处理一个请求，并且整个请求头已经被读取时，连接才会被计数。

```conf
# 语法
Syntax:	limit_conn zone number;
Default:	—
Context:	http, server, location
```

示例

```conf
# 官网示例
http {
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    ...

    server {

        ...

        location /download/ {
            limit_conn addr 1;
        }
    }
}
```

## 限制下载速度

```conf
location /download { 
    limit_rate_after 10m; 
    limit_rate 128k; 
}
```

## Niginx访问控制模块（黑白名单）

`ngx_http_access_module`: 基于ip操作

```conf
# 允许
Syntax:	allow address | CIDR | unix: | all;
Default:	—
Context:	http, server, location, limit_except

# 拒绝
Syntax:	deny address | CIDR | unix: | all;
Default:	—
Context:	http, server, location, limit_except
```

示例

```conf
# 官网示例
location / {
    deny  192.168.1.1;  # 拒绝
    allow 192.168.1.0/24;  # 允许
    allow 10.1.1.0/16;  
    allow 2001:0db8::/32;
    deny  all;   # 拒绝所有
}
```

`ngx_http_auth_basic_module`: 通过设置用户名密码来限制访问

```conf
# 启用语法
Syntax:	auth_basic string | off;
Default:	auth_basic off;
Context:	http, server, location, limit_except

# 指定密码文件
Syntax:	auth_basic_user_file file;
Default:	—
Context:http,server,location,limit_except
```

示例

```conf
# 官网示例
location / {
    auth_basic           "closed site";
    auth_basic_user_file conf/htpasswd;
}
```

## Nginx压缩配置gzip

* `http_gunzip_module`模块

gzip 属性在 `http、server、location` 三个模块都可以设置。

建议是设置在 `http` 模块，为所有服务提供压缩功能。

```conf
http {
    include mime.types;
    default_type text/html;
    sendfile on;
    keepalive_timeout 65;
    charset utf-8;

    gzip                on;     # 开启gzip
    gzip_comp_level     6;      # 压缩等级：1-9 1:压缩最快/CPU消耗最少/压缩率最低 以次类推
    gzip_min_length     1000;   # 小于此大小的数据不压缩(单位字节/byte)；数据来源"Content-Length"头
    gzip_buffers        32 4k;  # 压缩响应的缓冲区数量和大小(4K 内存页大小取决于平台 getconf PAGESIZE)
    gzip_proxied        any;    # 对代理的请求是否开启压缩
    # 写压缩率大的(css/js/xml/json/ttf)， image图片就不要写了，压缩空间太小，又耗CPU
    gzip_types text/plain application/xml application/javascript application/x-javascript text/css application/json;    # 哪些类型的数据需要被压缩
    gzip_disable     "MSIE [1-5]\.";    # User-Agent 被正则匹配到的不开启压缩
    gzip_vary on;               # 当gzip对请求生效时会被添加一个响应头 "Vary: Accept-Encoding"
}
```

* `ngx_http_gzip_static_module`模块

```conf
gzip_static on|off|always;  # always: 不管客户端是否支持压缩我他妈全部给你压缩之后给你
```

## HTTP 跳转 HTTPS

使用 `HTTP` 访问时会返回 `307` 响应，然后切换为 `HTTPS` 协议访问。

`307`: 临时
`308`: 永久

```conf
server {
    listen 80;
    return 307 https://$host$request_uri;
}
```

## Nginx基本信息及模块信息查看

```bash
# yum安装的模块如下都安装好了，模块是固定的，如果想自定义增加模块使用编译安装才可以
nginx -V
##############
nginx version: nginx/1.20.2
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 
built with OpenSSL 1.0.2k-fips  26 Jan 2017
TLS SNI support enabled

configure arguments: 
--prefix=/etc/nginx  # 指定安装路径
--sbin-path=/usr/sbin/nginx  # 程序文件位置
--modules-path=/usr/lib64/nginx/modules  # 模块路径的位置
--conf-path=/etc/nginx/nginx.conf  # 主配置文件的位置
--error-log-path=/var/log/nginx/error.log # 错误日志位置
--http-log-path=/var/log/nginx/access.log   # 访问日志位置
--pid-path=/var/run/nginx.pid  # 程序PID
--lock-path=/var/run/nginx.lock  # 锁路径，防止重复启动nginx
--http-client-body-temp-path=/var/cache/nginx/client_temp   # 缓存 
--http-proxy-temp-path=/var/cache/nginx/proxy_temp  # 代理缓存
--http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp   # php缓存
--http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp  # python缓存位置
--http-scgi-temp-path=/var/cache/nginx/scgi_temp --user=nginx  # 用户
--group=nginx  # 组
--with-compat # 启动动态模块兼容
--with-file-aio  # 提高性能
--with-threads   # 多线程模块
--with-http_addition_module  #  响应之前或者之后追加文本内容
--with-http_auth_request_module  # 认证模块，比如登录密码
--with-http_dav_module #  增加上传PUT,DELETE,MKCOL:创建集合,COPY和MOVE方法)默认情况下为关闭
--with-http_flv_module # NGINX添加MP4、FLV视频支持模块

--with-http_gzip_module  # 压缩模块
--with-http_gzip_static_module  # 压缩模块
--with-http_mp4_module  # 支持多媒体
--with-http_random_index_module  # 随机主页
--with-http_realip_module  # nginx获取真实ip模块
--with-http_secure_link_module  # nginx安全下载模块
--with-http_slice_module  # nginx中文文档
--with-http_ssl_module  # 网站加密
--with-http_stub_status_module  # 访问状态
--with-http_sub_module  # nginx替换响应内容
--with-http_v2_module  # web2.0技术

# 邮件
--with-mail
--with-mail_ssl_module 

# 负载均衡反向代理模块
--with-stream 
--with-stream_realip_module 
--with-stream_ssl_module 
--with-stream_ssl_preread_module 

# CPU优化参数等
--with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches -m64 -mtune=generic -fPIC' --with-ld-opt='-Wl,-z,relro -Wl,-z,now -pie'
```
## Nginx参数详解

全局配置一般在 `/etc/nginx/nginx.conf` 文件中，内容如下：

```conf
{
    # 指定Nginx的启动用户
    user  nginx; 
    # 开启nginx的数量，可以自定义，建议和CPu一样多，2核就写2个
    worker_processes  auto; 

    # 错误日志
    error_log  /var/log/nginx/error.log notice; 
    # 进程号存放路径
    pid        /var/run/nginx.pid;
    # worker_rlimit_nofile NUMBER
    # 解释：指定worker子进程可以打开的最大文件句柄数
    # 【系统最大打开65535，每个子进程打开数乘子进程数，实际也不会超过65535】
    # 这个值需要调大
    worker_rlimit_nofile 20480;
    # worker_rlimit_core SIZE
    # 指定worker子进程异常终止后的core文件，用于记录分析问题
    worker_rlimit_core 50M;
    #【必须对子进程用户赋写权限】
    working_directory /opt/nginx/tmp;
    # 解释：将每个worker子进程与CPU物理核心绑定
    # 【master负责调度，worker负责处理请求】
    # 【假设CPU有4个核心，某一时刻worker1获取到了CPU1的工作调度时间片，时间片过后worker1从CPU1上面撤下来，CPU1去处理其他事件，下一时刻可能是CPU2、CPU3的时间片调度到了worker1上面，那么worker1就会在其他CPU上面工作，进程与CPU的调度切换是有损耗的，worker1如果绑定了CPU1，worker1将永远等待CPU1的调度，充分利用CPU缓存】
    # 【【主要作用：将每个worker子进程与特定CPU物理核心绑定，优势在于：避免同一个worker子进程在不同的CPU核心上切换，缓存失效，降低性能；其并不能真正避免进程切换（进程切换是CPU工作特性）】】
    # -- worker_cpu_affinity 00000001 00000010 00000100 00001000 00010000 00100000 01000000 10000000;# 8核心，8个worker
    # -- worker_cpu_affinity 01 10 01 10;# 2核心，4个worker
    worker_cpu_affinity 0001 0010 0100 1000;# 4核心，4个worker
    # 解释：指定worker子进程的nice值，以调整运行nginx的优先级，通常设定为“负值”，以优先调用nginx
    # 【Linux默认进程的优先级值是120，值越小越优先；nice设定范围为-20到+19】
    # 【对Linux来说，优先级值则是100到139】
    worker_priority -20;
    # 指定worker子进程优雅退出时的超时时间，不管5秒内是否处理完，都强制退出
    worker_shutdown_timeout 5s;
    # worker子进程内部使用的计时器精度，调整时间间隔越大，系统调用越少，有利于性能提升；反之，系统调用越多，性能下降
    # 比如某些计时的操作，worker需要去获取内核时间，频繁跟内核打交道会降低性能
    timer_resolution 100ms;
    # daemon on | off
    # 设定nginx的运行方式，前台还是后台，前台用户调试，后台用于生产
    daemon on;
    # 负载均衡互斥锁文件存放路径
    lock_file logs/nginx.lock;
    # events块，配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。
    events {   
        # Nginx使用何种事件驱动模型,一般不指定这个参数
        # use epoll;
        # worker子进程能够处理的最大并发连接数，多核情况最大其实达不到65535，
        worker_connections  1024;
        # 是否打开负载均衡互斥锁，默认off（当master接收到请求时，会给每个worker发送消息去唤醒，状态为on时，则会有一个负载均衡锁，master会轮流发给每一个）
        accept_mutex on;
        # 新连接分配给worker子进程的超时时间，默认500ms，超时后会转给下一个worker处理请求
        accept_mutex_delay 100ms;
        # worker子进程可以接收的新连接个数(这个参数对性能影响不太大)
        multi_accept on;
    }

    # http模块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件,连接超时时间,单连接请求数等。
    http {
        # 加载外部的配置项，降低了文件的复杂度
        include       /etc/nginx/mime.types; 
        # 字节流处理方式
        default_type  application/octet-stream; 

        # 日志格式
        log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"'; 

        # 访问日志
        access_log  /var/log/nginx/access.log  main;
        # 加速访问、高效读取文件
        sendfile        on;
        tcp_nopush     on;
        
        # gzip压缩
        gzip  on;
        # 加载其他配置文件，一般下面的内容会放到单独的文件中
        include /etc/nginx/conf.d/*.conf;

        # 请求体大小限制
        client_max_body_size 18m

        # upstream
        upstream aaa{
            # 定义共享内存，用于跨worker子进程共享数据
            zone upstream_backend 64k;
            # 负载均衡算法：哈希
            hash $request_uri;
            # 负载均衡算法：依据ip进行哈希计算
            ip_hash;
            # 负载均衡算法：最少连接数
            least_conn;
            # 负载均衡算法：最短响应时间
            least_time;
            # 负载均衡算法：随机
            random;
            # 服务地址
            # weight：权重
            # max_conns：上游服务器的最大并发连接数
            # fail_timeout：服务器不可用的判定时间 
            # max_fails：服务器不可用的检查次数（10s内不可用次数达3次，则在这10s内不会再转发给后端，超过10后依然还是会转发过去）
            # backup：备份服务器，仅当其他服务器都不可用时 
            # down：标记服务器长期不可用，离线维护
            server http://1.1.1.1:5000 weight=number max_conns=number fail_timeout=time max_fails=number backup down;
        }
        # server块：配置虚拟主机的相关参数，一个http中可以有多个server 
        server {
            listen 1111;
            # 多个 server_name www.test.com *.test.com www.test.* ~^w\.test\..*$;
            server_name aa.bb.com;
            # 对上游服务(upstream)启用长连接，每个worker子进程与上游服务器空闲长连接的最大数量（keepalive 16； 当同时有5000个请求过来，处理完毕后，会保留16个连接，其他全部关闭）
            keepalive 16;
            # 一个长连接可以处理的最多请求个数
            keepalive_requests 500;
            # 空闲情况下，一个长连接的超时时长，超过后会销毁长连接
            keepalive_timeout 65;
            # 打开autoindex功能，以/结尾的请求
            autoindex on;
            # 显示文件的大小，
            # on：以字节显示
            # off：人性化显示，文件过大会显示为mb或gb
            autoindex_exact_size off;
            # 以哪种格式返回：html | xml | json | jsonp
            # 默认值： autoindex_format html
            autoindex_format html;
            # 显示时间格式
            # on: 12-Jul-2019 10:11（当前时区）
            # off: 12-Jul-2019 02:11(0时区，GMT)
            autoindex_localtime on;
            # location块：配置请求的路由，以及各种页面的处理情况
            location / {
                root /data/files/;
                # 如果a.html文件存在，则会返回a.html内容，否则才会返回目录内容
                index a.html;
                # 遇到这些情况下执行失败转发
                #  timeout | invalid_header | http_500 | http_502 | http_503 | http_504 | http_403 | http_404 | http_429 | non_idempotent| off
                proxy_next_upstream error timeout;
                # 超时时间，超过这个时间就不再尝试失败转发
                # 0 (不等待)
                proxy_next_upstream_timeout 10;
                # 转发次数 0 (一直转发)
                proxy_next_upstream_tries 3;
                # rewrite regex replacement [flag]
                # 上下文：server, location, if
                # flag: 
                #     last: 重写后的url发起新请求，再次进入server段，重试location中的匹配
                #     break: 直接使用重写后的url，不再匹配其他location中的语句
                #     redirect: 返回302临时重定向
                #     permanent: 返回301永久重定向
                rewrite /(.*) https://www.baidu.com permanent;
                # 其主要作用就是在一个指定的本地目录来缓存较大的代理请求。一般都设置在临时目录中。
                proxy_temp_path /tmp/proxy_temp;
                # 设置临时文件的大小
                proxy_max_temp_file_size 1G;
                # 这个指令用于开启对被代理服务器的应答缓存
                proxy_buffering on;
                # 设置缓冲区大小,从被代理服务器取得的响应内容,会先读取放置到这里.设置的过小，小的响应header通常位于这部分响应内容里边.设置的过小，可能会产生502错误。
                proxy_buffer_size  4k;
                # 设置从被代理服务器读取应答内容的缓存区的数目和大小。数目可以任意定，但是一个缓存区的大小一般就是4k或者8k。
                proxy_buffers 256 4k;
                # 在系统繁忙的时候可以申请更大的proxy_buffers缓冲区。一般就设置成proxy_buffers的二倍。
                proxy_busy_buffers_size  8k;
                # 设置和被代理服务器链接的超时时间，是代理服务器发起握手等待响应的超时时间。不要设置的太小，否则会报504错误。
                proxy_connect_timeout 1m;
                # 设置从被代理服务器读取应答内容的超时时间。
                proxy_read_timeout 60;
                proxy_send_timeout 60;
                # 用于允许代理其他HTTP方法。
                proxy_method GET;
                ###############
                # remote: 客户端，proxy：被代理的ip，server: 代理

                proxy_http_version 1.1;
                # 日志中的 $http_host = 请求头中的 Host
                # $host：转发服务器,$host:$proxy_port,$host:$server_port,$proxy_host
                # 一般都使用 $host,不设置默认为$proxy_host;
                proxy_set_header Host $host;
                # 一般都是 $remote_addr
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Real-PORT $remote_port;
                # 固定写法，如果通过2个nginx代理，会是"用户的真实ip，第一台nginx的ip"
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Connection "upgrade";
            }
            location /test1 {
                # 继续匹配location，
                rewrite /images/(.*) /test2/$1 last;
                return 200 "return 200 in /test1";
            }

            location /test2 {
                # 不会再匹配，直接找test3下面的文件
                rewrite /pics/(.*) /test3/$1 break;
                return 200 "return 200 in /test2";
            }

            location /test3 {
                # 请求：/test3/index.html,
                # 结果：直接返回"return 200 in /test3"，不会再去找index.html文件
                return 200 "return 200 in /test3";
            }

            location /test4/ {
                if ( $remote_addr = "192.168.1.1" ) {
                    return 200 "test if OK in URL /test4/";
                } 
            }

            location /test5 {
                if ( $uri = "/images/" ) {
                    rewrite (.*) /test2/ break;
                }
                # 执行了上面rewrite后，这里的return还会执行，通常不会联合一起写
                return 200 "test5 if failed\n";
            }
        }
    }
}
```
## Nginx变量分类
```bash
1、TCP连接相关变量
		    
	#客户端地址，例如192.168.1.1
	remote_addr					
	
	#客户端端口，例如58473
	remote_port					
	
	#客户端地址的整型格式
	binary_remote_addr			
	
	#已处理连接，是一个递增的序号
	connection					
	
	#当前连接上执行的请求数，对于keepalive连接有意义
	connection_request			
	
	#如果使用proxy_protocol协议，则返回原始用户的地址，否则为空
	proxy_protocol_addr			
	
	#如果使用proxy_protocol协议，则返回原始用户的端口，否则为空
	proxy_protocol_port			
	
	#服务器地址，例如192.168.184.240
	server_addr					
	
	#服务器端口,例如80
	server_port					
	
	#服务端协议，例如HTTP/1.1
	server_protocol		
	                            
		                                
2、HTTP请求相关变量             
			
	#请求包体头部长度
	conten_length				
	
	#请求包体类型
	content_type				
	
	#URL中某个参数
	arg_参数名					
	
	#所有URL参数
	args						
	
	#URL中有参数，则返回?；否则返回空
	is_args						
	
	#与args完全相同
	query_string				
	
	#请求的URL，不包含参数
	uri							
	
	#请求的URL，包含参数
	request_uri					
	
	#协议名，http或者https
	scheme						
	
	#请求的方法，GET、HEAD、POST等
	request_method				
	
	#所有请求内容的大小，包含请求行，头部，请求体
	request_length				
	
	#由HTTP Basic Authentication协议传入的用户名
	remote_user					
	
	#客户端请求主体信息的临时文件名
	request_body_file			
	
	#包含请求的主要信息，在使用proxy_pass或fastcgi_pass指令的location中比较有意义
	request_body	

	#先看请求行，再看请求头，最后找server_name
	host

	#用户浏览器标识
	http_user_agent

	#从哪些链接过来的请求
	http_referer

	#经过一层代表服务器，添加对应代理服务器的信息
	http_via

	#获取用户真实IP
	http_x_forwarded_for

	#用户cookie
	http_cookie


		                                
3、Nginx处理请求时相关变量      
		                                
	#请求处理到现在所耗费的时间，单位为秒，例如0.03代表30毫秒
	request_time				
	
	#请求处理完成，则返回OK，否则为空
	request_completion			
	
	#16进制显示的请求id，随机生成的
	request_id					
	
	#匹配上请求的server_name值
	server_name					
	
	#若开启https，则值为on,否则为空
	https						
	
	#待访问文件的完整路径
	request_filename			
	
	#由URI和root/alias规则生成的文件夹路径
	document_root				
	
	#将document_root中的软链接换成真实路径
	realpath_root				
	
	#返回响应时的速度上限值
	limit_rate					
		                                
4、Nginx返回响应时相关变量      
			
	#响应体中真实内容的大小	
	body_bytes_sent				
	
	#全部响应体大小
	body_sent					
	
	#HTTP返回状态码
	status						
			
		
5、系统变量

	#nginx系统版本
	nginx_version

	#服务器时间
	time_local
```
## Nginx时间空间单位

时间单位：

* ms：毫秒
* s：秒
* m：分钟
* h：小时
* d：天
* w：周
* M：月
* y：年

空间单位：

* k/K：KB
* m/M：MB
* g/G：GB