# Nginx

Nginx 是一个采用主从架构的 Web 服务器，可用于反向代理、负载均衡器、邮件代理和 HTTP 缓存。

* worker_processes： 进程数，一般配置和服务器核心数一致
* worker_connections：尽量大一点，推荐 65535

## Nginx 基本配置 & 示例

首先，在本地创建如下的目录结构:

```
.
├── nginx-demo
│  ├── content
│  │  ├── first.txt
│  │  ├── index.html
│  │  └── index.md
│  └── main
│    └── index.html
└── temp-nginx
  └── outsider
    └── index.html
```

这里，我们有两个单独的文件夹 nginx-demo 和 temp-nginx，每个文件夹都包含静态 HTML 文件。我们将着力在一个公共端口上运行这两个文件夹，并设置我们想要的规则。

1. 添加配置的基本设置。一定要添加 events {}，因为在 Nginx 架构中，它通常用来表示 worker 的数量。在这里我们用 http 告诉 Nginx 我们将在 OSI 模型 的第 7 层作业。

    这里，我们告诉 Nginx 监听 5000 端口，并指向 main 文件夹中的静态文件。
    
    ```
    http {

    server {
      listen 5000;
      root /path/to/nginx-demo/main/; 
      }

    }

    events {}
    ```
1. 接下来我们将为 /content 和 /outsider URL 添加其他的规则，其中 outsider 将指向第一步中提到的根目录之外的目录。

    这里的 location /content  表示无论我在叶（leaf）目录中定义了什么根（root），content 子 URL 都会被添加到定义的根 URL 的末尾。因此，当我指定 root 为 root /path/to/nginx-demo/时，这仅仅意味着我告诉 Nginx 在 http://localhost:5000/path/to/nginx-demo/content/ 文件夹中显示静态文件的内容。

    ```
    http {

      server {
          listen 5000;
          root /path/to/nginx-demo/main/; 

          location /content {
              root /path/to/nginx-demo/;
          }   

          location /outsider {
              root /path/temp-nginx/;
          }
      }
    }

    events {}
    ```
1. 接下来，我们在主服务器上编写一个规则来防止任意 .md 文件被访问。我们可以在 Nginx 中使用正则表达式，因此我们将这样定义规则：

    ```
    location ~ .md {
          return 403;
    }
    ```
1. 最后，让我们学习下 proxy_pass 命令来结束这个章节。我们已经了解了什么是代理和反向代理，在这里我们从定义另一个运行在 8888 端口上的后端服务器开始。现在，我们在 5000 和 8888 端口上运行了 2 个后端服务器。

    我们要做的是，当客户端通过 Nginx 访问 8888 端口时，将这个请求传到 5000 端口，并将响应返回给客户端！

  ```conf
  upstream tomcat_pools {
    server 172.16.1.91:8080 weight=1 max_fails=3 fail_timeout=3s;
    server 172.16.1.91:8081 weight=1 max_fails=3 fail_timeout=3s;
    check interval=2000 rise=3 fall=2 timeout=1000 type=http;
  }

  server {
      listen 8082;
      access_log    logs/tomcat-access.log main;
      error_log     logs/tomcat-error.log warn;
      location / {
        proxy_pass http://tomcat_pools;
        proxy_http_version 1.1;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }

  server {
      listen 8888;

      location / {
          proxy_pass http://localhost:5000/;
      }

      location /new {
          proxy_pass http://localhost:5000/outsider/;
      }
  }
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
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
}
```

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
        proxy_set_header Host $host:$server_port;
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

`$request`  #用户的http请求起始行信息

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

    location / {
        proxy_pass http://127.0.0.1:5001
    }
}
```

## 配置SSL

检查nginx中是否包含http_ssl_module模块：`nginx -V`,如果没有需要下载源码编译。

```conf
server {
    # https 监听的是443端口
    listen       443 ssl;
    # 指定准备好的域名
    server_name  aaaa.com;
    # 指定证书路径，这里需要把准备好的证书放到此目录
    ssl_certificate      /usr/local/nginx/myssl/codezyq.cn.pem;
    ssl_certificate_key  /usr/local/nginx/myssl/codezyq.cn.key;
    ssl_session_cache    shared:SSL:1m;
    # 超时时间
    ssl_session_timeout 5m;
    # 表示使用的加密套件的类型
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    # 表示使用的TLS协议的类型
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; 
    ssl_prefer_server_ciphers on;
    location /www/ {
        root   static;
        index  index.html index.htm;
    }
}
```
## Nginx根据请求头转发到不同服务

转发规则配置，使用`$http_XXX`，来获取header指定的值，`$http_`为固定格式,`XXX`为自定义header字段名。

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
