# Nginx

Nginx 是一个采用主从架构的 Web 服务器，可用于反向代理、负载均衡器、邮件代理和 HTTP 缓存。

* worker_processes： 进程数，一般配置和服务器核心数一致
* worker_connections：尽量大一点，推荐 65535

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

--with-http_gunzip_module  # 压缩模块
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

## Nginx全局配置

全局配置一般在 `/etc/nginx/nginx.conf` 文件中，内容如下：

```conf
1、全局/核心块。配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，元许生成workerprocess数等。

user  nginx;  # 指定Nginx的启动用户
worker_processes  auto;  # 开启nginx的数量，可以自定义，建议和CPu一样多，2核就写2个···

error_log  /var/log/nginx/error.log notice; # 错误日志
pid        /var/run/nginx.pid;    # 进程号存放路径


2、events块，配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。

events {   
    worker_connections  1024;  # 进程最大连接数
}


3、http模块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件,连接超时时间,单连接请求数等。

http {
    include       /etc/nginx/mime.types;  # 加载外部的配置项，降低了文件的复杂度
    default_type  application/octet-stream;  # 字节流处理方式

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';    # 日志格式，可以修改为json

    access_log  /var/log/nginx/access.log  main; # 访问日志

    sendfile        on;  # 加速访问、高效读取文件
    #tcp_nopush     on;  # 优化

    keepalive_timeout  65;  # 长连接，timeout不能太低，不然和短链接一样 

    #gzip  on;  # 压缩
    include /etc/nginx/conf.d/*.conf;  # 配置文件
}
4、server块：配置虚拟主机的相关参数，一个http中可以有多个server 
5、location块：配置请求的路由，以及各种页面的处理情况
```
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

```conf
location / {
    proxy_pass http://127.0.0.1:8088/;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
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


## Nginx常用命令

```bash
# 首次启动 Nginx Web 服务器
sudo nginx

# 检查配置文件
/usr/local/nginx/sbin/nginx -t -c /usr/local/nginx/conf/nginx.conf

# 重新加载正在运行的 Nginx Web 服务器
sudo nginx -s reload
sudo /usr/local/nginx/sbin/nginx -s reload

# 停止正在运行中的 Nginx Web 服务器
sudo nginx -s stop

# 查看系统上运行的 Nginx 进程
ps -ef | grep Nginx
sudo kill -9 <PID>

# 查看nginx安装了哪些模块
sudo nginx -V
```

## Nginx后端服务健康检查

nginx_upstream_check_module

```conf
upstream tomcat_pools {
    ip_hash;
    server 172.16.1.91:8080 weight=1 max_fails=3 fail_timeout=3s;
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
## Nginx根据请求头转发到不同版本服务

转发规则配置，使用`$http_xxx`，来获取header指定的值，`$http_`为固定格式,`xxx`为自定义header字段名。

```conf
http {
    map_hash_bucket_size 64;
    map $http_apiversion $apiupstream {
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
        }
    }
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

http {
    server_tokens off;
}

## Nginx一个server配置多个location

```conf
# 前端示例
location / {
        root   /data/html/;
        index  index.html index.html;
}
location /train {
     alias  /data/trainning/;
     index  index.html index.html;
}
```

如果配置两个 `root`，http://xxxx/train 会提示404。

`root`的处理结果是：root路径＋location路径 `alias`的处理结果是：使用alias路径替换location路径 `alias`是一个目录别名的定义，root则是最上层目录的定义。 还有一个重要的区别是alias后面必须要用 `/` 结束，否则会找不到文件的。。。而root则可有可无~~

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

## Nginx Cookie设置

遇到这个情况的是代理 `tomcat` 的服务时出现的。

server {
    listen       80;
    server_name www.aa.cn;

    location / {
        proxy_pass http://IP:8080/projectName/;
        # 这条是关键
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