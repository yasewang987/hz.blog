# Nginx优化配置

## nginx基础配置

```conf
user  root;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid   /var/run/nginx.pid;

events {
    use epoll;
    worker_connections  65534;
    accept_mutex on;
    multi_accept on;
}

http {
    include        /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main        '$remote_addr - $remote_user [$time_local] "$request" '
                                            'rc:$status $body_bytes_sent "$http_referer" '
                                            '"$http_user_agent" "$http_x_forwarded_for"'
                                            '$upstream_addr '
                                            'ups_resp_time: $upstream_response_time '
                                            'request_time: $request_time';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;

    client_max_body_size 200M;
    keepalive_timeout  300s;
    client_body_timeout 240s;
    send_timeout 240s;
    keepalive_requests 30000;
    proxy_read_timeout 180s;
    client_header_buffer_size 512k;
    large_client_header_buffers 4 512k;

    include /etc/nginx/conf.d/*.conf;
}
```

## 打开长连接配置

建议开启HTTP长连接，用户减少握手的次数，降低服务器损耗，具体如下：

```conf
upstream xxx {
    # 长连接数
    keepalive 32;
    # 每个长连接提供的最大请求数
    keepalived_requests 100;
    # 每个长连接没有新的请求时，保持的最长时间
    keepalive_timeout 60s;
}
```

## 开启零拷贝技术

零拷贝读取机制与传统资源读取机制的区别：
* 传统方式：硬件-->内核-->用户空间-->程序空间-->程序内核空间-->网络套接字
* 零拷贝方式：硬件-->内核-->程序内核空间-->网络套接字

```conf
sendfile on; # 开启零拷贝机制
```

## 开启无延迟或多包共发机制

`tcp_nodelay、tcp_nopush`两个参数是“互斥”的，如果追求响应速度的应用推荐开启`tcp_nodelay`参数，如IM、金融等类型的项目。如果追求吞吐量的应用则建议开启`tcp_nopush`参数，如调度系统、报表系统等。

* `tcp_nodelay`一般要建立在开启了长连接模式的情况下使用
* `tcp_nopush`参数是必须要开启`sendfile`参数才可使用的。

```conf
# 开启tcp_nodelay配置，让应用程序向内核递交的每个数据包都会立即发送出去。但这样会产生大量的TCP报文头，增加很大的网络开销。
tcp_nodelay on;
# 有些项目的业务对数据的实时性要求并不高，追求的则是更高的吞吐，那么则可以开启tcp_nopush配置项，这个配置就类似于“塞子”的意思，首先将连接塞住，使得数据先不发出去，等到拔去塞子后再发出去。设置该选项后，内核会尽量把小数据包拼接成一个大的数据包（一个MTU）再发送出去.
tcp_nopush on;
```

## 调整Worker工作进程

```conf
# 自动根据CPU核心数调整Worker进程数量
worker_processes auto;
# 也可以稍微调整一下每个工作进程能够打开的文件句柄数：
worker_rlimit_nofile 20000;
```

## 开启CPU亲和机制

CPU亲和机制则是指将每个Nginx的工作进程，绑定在固定的CPU核心上，从而减小CPU切换带来的时间开销和资源损耗

```conf
worker_cpu_affinity auto;
```

## 开启epoll模型及调整并发连接数

```conf
events {
    # 使用epoll网络模型
    use epoll;
    # 调整每个Worker能够处理的连接数上限
    worker_connections  10240;
}
```