# Nginx压力测试及优化

借助`apache`服务器自带的web压力测试工具`ApacheBench`(简称ab) ,模拟多个请求同时对某一URL进行访问。

```bash
# 安装工具包httpd-tools
yum -y install httpd-tools

# -c：一次并发请求的数量；-n：请求总次数
ab -c 5000 -n 200000 http://192.168.1.10/
ab -c 5000 -n 200000 -p formData.txt -T 'application/json' http://192.168.1.10/
```

## 常用参数

### 输入参数说明
```
-n: 总的请求个数
-c: 一次并发的请求数
-t: 持续的时间，默认没有限制
-k:它会增加请求头Connection: Keep-Alive，相当于开启了HTTP长连接。这样做一方面可以降低测试服务器动态端口被耗尽的风险，另一方面也有助于给目标服务器更大的压力，测试出更接近极限的结果
说明：ab使用的是HTTP/1.0，缺省开启的是短链接，用-k参数则可以打开长连接
-p post的请求参数,新建一个文件，里面放入数据
如name=风之馨&title=风之馨,然后存为formData.txt         
-T 内容类型。这个一般和-p一起使用(application/json)
```

### 输出参数说明

```
Document Length: # 请求的页面大小
Concurrency Level: # 每次的并发请求数
Time taken for tests: # 测试总共耗时
Complete requests: # 完成的请求总数
Failed requests: # 失败的请求数量
Write errors: # 错误的请求数量
Total transferred: # 总共传输数据量
Requests per second 吞吐率（reqs/s）：服务器每秒能够处理的请求数量
Time per request 平均请求处理时间，它的两个值是:第一行为每次并发请求的耗时，
第二行为每个请求的耗时,第一行值为第二行的值乘上并发请求数量。可以尝试将并发数改为20，
这样就会看到第一行是第二行的20倍
Transfer rate 表示吞吐量（BPS）:即：每秒从服务器获取的数据的长度
```

## 优化思路

* 每个请求都要建立`socket`连接,那么影响并发量的因素有如下几方面:
* 客户端不允许一次性创建过多的连接
* 服务端不允许一次性创建过多的连接,每个请求都要访问一些资源。
* 服务端不允许一个文件在同一个时间点被访问N次,相当于一个文件在服务端打开了N次
* 使用ab模拟并发后,可以执行`dmesg`命令查看请求信息

## socket优化分为系统层面和nginx层面

### 系统层面

```bash
# 禁止洪水抵御，这个操作在重启之后失效
命令：more /proc/sys/net/ipv4/tcp_syncookies
命令：echo 0 > /proc/sys/net/ipv4/tcp_syncookies
# 最大连接数，这个操作在重启之后失效
命令：more /proc/sys/net/core/somaxconn
命令：echo 50000 > /proc/sys/net/core/somaxconn
# 加快 tcp 连接的回收，这个操作在重启之后失效
命令：cat /proc/sys/net/ipv4/tcp_tw_recycle
命令：echo 1 > /proc/sys/net/ipv4/tcp_tw_recycle
# 使空的 tcp 连接重新被利用，这个操作在重启之后失效
命令：cat /proc/sys/net/ipv4/tcp_tw_reuse
命令：echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse
# 完整的命令
echo 50000 > /proc/sys/net/core/somaxconn
echo 0 > /proc/sys/net/ipv4/tcp_syncookies
echo 1 > /proc/sys/net/ipv4/tcp_tw_recycle
echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse
```

### nginx

```conf
# 子进程允许打开的连接数（nginx.conf）及 IO 选择
events {
    # 子进程连接数
    worker_connections 65535;
    # 使用 linux 下的多路复用 IO，是 poll 增强版本
    use epoll;
}
# 将 keepalive_timeout 设置为 0，高并发网站中，一般不超过 2s。此参数在 F12 调试页面时，在 Network 的 Headers 的 Response Headers 下可以看到 Connection:keep-alive，如果设置为 0，那么为 Connection:close
keepalive_timeout 0;
```

## 文件优化

### 系统层面

```bash
# 设置同一个文件同一时间点可以打开 N 次，这个操作在重启之后失效
命令：ulimit -n
命令：ulimit -n 20000
```

### nginx层面

```conf
# nginx进程数，按照CPU数目指定
worker_processes 8;
# nginx 子进程允许打开的文件次数
worker_rlimit_nofile 102400;
```

使用ab的时候应该注意如果你用A和B俩台虚拟机压测,用B的ab去测试A的nginx,这是B就是客户端,A就是服务端,此时B应该调整系统配置

```bash
ulimit -n 20000
echo 50000 > /proc/sys/net/core/somaxconn
```

## nginx添加统计模块

```bash
./configure --prefix=/usr/local/nginx --with-http_stub_status_module
```

可以结合nginx实现通过日期来分割日志和动态添加模块来动态添加模块

```conf
# 在 nginx.conf 中配置统计模块
location /status{
    # 开启状态
    stub_status on;
    # 不需要日志
    access_log off;
    # 只允许此 ip 访问
    allow 192.168.1.10;
    # 其他 ip 禁止访问
    deny all;
}
```

### 查看nginx的统计模块查看状态

```bash
# ab 测试并发
ab -c 1000 -n 100000 http://192.168.1.10:80
```

* 浏览器打开http://192.168.1.10:80/status,浏览器会输出相关信息。
* 压力测试
* 测试因素:cpu 网络带宽 磁盘io
* 测试指标:QPS/TPS/IOPS/吞吐量
* QPS:每秒请求量,就是nginx的web服务每秒发http请求的数量
* TPS:每秒事务数
* IOPS: 单位时间内系统能处理的I/o请求数量,一般以每秒处理的I/O请求数量为单位,I/O请求通常为读或写数据操作请求。看数据库或者磁盘，一般指越大越好。
* 优化方向:硬件层面可以提升硬件配置，如果软件方面就从os层面，结合nginx负载均衡最后调整后端nginx的配置。

