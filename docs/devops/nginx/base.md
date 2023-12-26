# Nginx基础知识

## 编译安装

```bash
# centos
yum install gcc -y                # C语言编译器
yum install pcre pcre-devel -y    # PCRE Library
yum install zlib zlib-devel -y    # zlib Library

# ubuntu
sudo apt update
sudo apt install gcc
sudo  apt-get install build-essential zlib1g-dev libpcre3 libpcre3-dev  libssl-dev libxslt1-dev libxml2-dev libgeoip-dev  libgoogle-perftools-dev libperl-dev libtool libpcrecpp0v5 openssl -y

# 进入解压后的目录中 编译安装 [指定用户/组] [--with-追加自带模块名称] 
./configure --prefix=/usr/local/nginx [--user=www --group=www] [--with-http_gzip_static_module]
make && make install

nginx            # 启动
nginx -s stop    # 停止，立即
nginx -s quit    # 退出，处理完现有任务后
nginx -s reopen  # 重启
nginx -s reload  # 重载配置，交替更新工作进程
```

## nginx源码编译参数含义

```bash
#Nginx安装路径。如果没有指定，默认为 /usr/local/nginx
--prefix=PATH 
#Nginx可执行文件安装路径。只能安装时指定，如果没有指定，默认为/sbin/nginx
--sbin-path=PATH 
#在没有给定-c选项下默认的nginx.conf的路径。如果没有指定，默认为/conf/nginx.conf
--conf-path=PATH
#在nginx.conf中没有指定error_log指令的情况下，默认的错误日志的路径。如果没有指定，默认为 /logs/error.log
--error-log-path=PATH
#在nginx.conf中没有指定pid指令的情况下，默认的nginx.pid的路径。如果没有指定，默认为 /logs/nginx.pid
--pid-path=PATH 
#nginx.lock文件的路径
--lock-path=PATH 
#在nginx.conf中没有指定user指令的情况下，默认的nginx使用的用户。如果没有指定，默认为 nobody
--user=USER
#在nginx.conf中没有指定group指令的情况下，默认的nginx使用的组。如果没有指定，默认为 nobody
--group=GROUP
#指定编译的名称
--build=NAME 
#指定编译的目录
--builddir=DIR 
#允许开启SELECT模式，如果 configure 没有找到更合适的模式，比如：kqueue(sun os),epoll (linux kenel 2.6+),rtsig（实时信号）或者/dev/poll（一种类似select的模式，底层实现与SELECT基本相 同，都是采用轮训方法） SELECT模式将是默认安装模式 
--with-select_module 
#禁用SELECT模式
--without-select_module 
#启用 poll 模块支持（功能与 select 相同，与 select 特性相同，为一种轮询模式,不推荐在高负载环境下使用）
--with-poll_module 
#禁用 poll 模块支持
--without-poll_module 
#开启线程池支持(社区版从1.7.11开始引入线程池, 默认不开启时无论是master进程，还是worker进程的线程数都是1)
--with-threads 
#启用 file aio 支持（一种 APL 文件传输格式）
--with-file-aio 
#启用 ipv6 支持
--with-ipv6 
#开启HTTP SSL模块，使NGINX可以支持HTTPS请求。这个模块需要已经安装了OPENSSL，在DEBIAN上是libssl
--with-http_ssl_module 
#启用对HTTP/2的支持，并取代ngx_http_spdy_module模块
--with-http_v2_module
#启用 ngx_http_realip_module 支持（这个模块允许从请求标头更改客户端的 IP 地址值，默认为关）
--with-http_realip_module
#启用 ngx_http_addition_module 支持（作为一个输出过滤器，支持不完全缓冲，分部分响应请求）
--with-http_addition_module
#启用 ngx_http_xslt_module 支持（过滤转换 XML 请求）
--with-http_xslt_module 
#启用 ngx_http_image_filter_module 支持（传输 JPEG/GIF/PNG 图片的一个过滤器）（默认为不启用。GD 库要用到）
--with-http_image_filter_module
#启用 ngx_http_geoip_module 支持（基于与 MaxMind GeoIP 二进制文件相配的客户端 IP 地址的 ngx_http_geoip_module 变量）
--with-http_geoip_module 
#启用 ngx_http_sub_module 支持（允许用一些其他文本替换 Nginx 响应中的一些文本）
--with-http_sub_module 
#启用 ngx_http_dav_module 支持（增加 PUT、DELETE、MKCOL 创建集合，COPY 和 MOVE 方法）默认情况下为关闭，需编译开启
--with-http_dav_module
#启用 ngx_http_flv_module 支持（提供寻求内存使用基于时间的偏移量文件）
--with-http_flv_module 
#启用ngx_http_mp4_module 模块为 MP4 文件提供伪流服务端支持。这些文件的扩展名通常为 .mp4、.m4v 或 .m4a。
--with-http_mp4_module
#启用ngx_http_gunzip_module模块为不支持"gzip"编码方式的客户端解压缩头"Content-Encoding:gzip"提供的过滤器。
--with-http_gunzip_module
#启用ngx_http_gzip_static_module模块，开启预读gzip功能，允许发送.gz扩展名文件进行响应。
--with-http_gzip_static_module 
#启用ngx_http_auth_request_module模块(1.5.4)基于子请求的结果实现客户端授权。如果子请求返回 2xx 响应代码，则允许访问。如 果返回 401 或 403，则使用相应的错误代码拒绝访问。子请求返回的任何其他响应代码都被视为错误
--with-http_auth_request_module
#启用 ngx_http_random_index_module 支持（从目录中随机挑选一个目录索引）
--with-http_random_index_module
#启用 ngx_http_secure_link_module 支持（计算和检查要求所需的安全链接网址）
--with-http_secure_link_module
#启用 ngx_http_degradation_module 支持（允许在内存不足的情况下返回204或444码）
--with-http_degradation_module
#启用ngx_http_slice_module模块(1.9.8), 提供一个过滤器，用于将请求分为多个子请求，每个子请求都返回一定范围的响应
--with-http_slice_module 
#启用 ngx_http_stub_status_module 支持（获取 Nginx 自上次启动以来的工作状态）
--with-http_stub_status_module 
#禁用 ngx_http_charset_module 支持（重新编码 WEB 页面，但只能是一个方向--服务器端到客户端，并且只有一个字节的编码可以被重 新编码） 
--without-http_charset_module
#禁用 ngx_http_gzip_module 支持（该模块同 --with-http_gzip_static_module 功能一样）
--without-http_gzip_module
#禁用 ngx_http_ssi_module 支持（该模块提供了一个在输入端处理处理服务器包含文件（SSI）的过滤器，目前支持 SSI 命令的列表是不完整的）
--without-http_ssi_module
#禁用 ngx_http_userid_module 支持（该模块用来处理用来确定客户端后续请求的 cookie ）
--without-http_userid_module
#禁用 ngx_http_access_module 支持（该模块提供了一个简单的基于主机的访问控制。允许/拒绝基于 IP 地址）
--without-http_access_module
#禁用 ngx_http_auth_basic_module（该模块是可以使用用户名和密码基于 HTTP 基本认证方法来保护你的站点或其部分内容）
--without-http_auth_basic_module
#禁用 ngx_http_autoindex_module支持（该模块用于自动生成目录列表，只在 ngx_http_index_module 模块未找到索引文件时发出请求）
--without-http_autoindex_module 
#禁用 ngx_http_geo_module 支持（创建一些变量，其值依赖于客户端的IP地址）
--without-http_geo_module 
#禁用 ngx_http_map_module 支持（使用任意的键/值对设置配置变量）
--without-http_map_module
#禁用 ngx_http_split_clients_module 支持（该模块用来基于某些条件划分用户。条件如：ip地址、报头、cookies等等）
--without-http_split_clients_module
#禁用 ngx_http_referer_module支持（该模块用来过滤请求，拒绝报头中 Referer 值不正确的请求）
--without-http_referer_module
#禁用 ngx_http_rewrite_module ，链接重写
--without-http_rewrite_module 
#禁用 ngx_http_proxy_module 支持（有关代理服务器）
--without-http_proxy_module 
#禁用 ngx_http_fastcgi_module 支持（该模块允许 Nginx 与 FastCGI 进程交互，并通过传递参数来控制 FastCGI 进程工作。 ）FastCGI 一个常驻型的公共网关接口 
--without-http_fastcgi_module
#禁用 ngx_http_uwsgi_module 支持（该模块用来医用uwsgi协议，uWSGI服务器相关）
--without-http_uwsgi_module
#禁用 ngx_http_scgi_module支持
--without-http_scgi_module
#禁用 ngx_http_memcached_module 支持（该模块用来提供简单的缓存，以提高系统效率）
--without-http_memcached_module 
##禁用ngx_http_limit_conn_module模块，该模块用于限制每个定义的键的连接数，特别是来自单个 IP 地址的连接数 
--without-http_limit_conn_module 
#禁用 ngx_http_limit_req_module 支持（该模块允许你对于一个地址进行请求数量的限制用一个给定的session或一个特定的事件）
--without-http_limit_req_module 
#禁用 ngx_http_empty_gif_module 支持（该模块在内存中常驻了一个1*1的透明GIF图像，可以被非常快速的调用）
--without-http_empty_gif_module
#禁用 ngx_http_browser_module 支持
--without-http_browser_module
#禁用ngx_http_upstream_hash_module，该模块支持普通的hash及一致性hash两种负载均衡算法，默认的是普通的hash来进行负载均衡。
--without-http_upstream_hash_module
#禁用 ngx_http_upstream_ip_hash_module 支持（该模块用于简单的负载均衡） 
--without-http_upstream_ip_hash_module
#禁用ngx_http_upstream_least_conn_module用于将多个服务器器定义成服务器器组,⽽由 proxy_pass,fastcgi_pass 等指令进⾏引 
--without-http_upstream_least_conn_module
#禁用http_upstream_keepalive_module模块 
--without-http_upstream_keepalive_module
#禁用ngx_http_upstream_zone_module模块 该模块使用共享内存使负载均衡策略对所有worker进程生效 
--without-http_upstream_zone_module
#启用 ngx_http_perl_module 支持（该模块使nginx可以直接使用perl或通过ssi调用perl）
--with-http_perl_module 
#设定 perl 模块路径
--with-perl_modules_path=PATH 
#设定 perl 库文件路径
--with-perl=PATH 
#设定 access log 路径
--http-log-path=PATH 
#设定 HTTP 客户端请求临时文件路径
--http-client-body-temp-path=PATH
#设定 HTTP 代理临时文件路径
--http-proxy-temp-path=PATH 
#设定 HTTP Fastcgi 临时文件路径
--http-fastcgi-temp-path=PATH
#设定 HTTP uwsgi 临时文件路径
--http-uwsgi-temp-path=PATH
#设定 HTTP scgi 临时文件路径
--http-scgi-temp-path=PATH
#禁用 HTTP server 功能
--without-http 
#禁用 HTTP Cache 功能
--without-http-cache 
#启用 POP3/IMAP4/SMTP 代理模块支持 
--with-mail
#启用 ngx_mail_ssl_module 支持
--with-mail_ssl_module
#禁用 POP3 协议
--without-mail_pop3_module
#禁用 IMAP 协议
--without-mail_imap_module 
#禁用 SMTP 协议
--without-mail_smtp_module 
#启用tcp代理支持
--with-stream 
#启用ngx_stream_ssl_module模块，用于流代理服务器与SSL / TLS协议工作必要的支持
--with-stream_ssl_module 
#启用ngx_http_limit_conn_module模块 能够配置并发连接数限制
--without-stream_limit_conn_module 
#禁用ngx_stream_access_module
#禁用ngx_stream_access_module模块（1.9.2），该模块允许对某些客户端地址限制访问
--without-stream_access_module
#禁用ngx_stream_upstream_hash_module模块
--without-stream_upstream_hash_module
#禁用ngx_stream_upstream_least_conn_module模块 
--without-stream_upstream_least_conn_module
#禁用ngx_stream_upstream_zone_module模块，共享内存使用的单链表模块 
--without-stream_upstream_zone_module
#启用 ngx_google_perftools_module支持（调试用，剖析程序性能瓶颈） 
--with-google_perftools_module 
#启用 ngx_cpp_test_module 支持
--with-cpp_test_module 
#添加新的模块
--add-module=PATH 
#指向 C 编译器路径
--with-cc=PATH
#指向 C 预处理路径
--with-cpp=PATH 
#设置 C 编译器参数
--with-cc-opt=OPTIONS
#设置连接文件参数
--with-ld-opt=OPTIONS
#指定编译的 CPU，可用的值为：pentium, pentiumpro, pentium3, pentium4, athlon, opteron, amd64, sparc32, sparc64, ppc64
--with-cpu-opt=CPU
#禁用 PCRE 库
--without-pcre 
#启用 PCRE 库
--with-pcre
#指向 PCRE 库文件目录
--with-pcre=DIR 
#在编译时为 PCRE 库设置附加参数
--with-pcre-opt=OPTIONS
# 配置参数启用 JIT 支持 PCRE JIT 可以明显加快正则表达式的处理速度。
--with-pcre-jit 
#指向 MD5 库文件目录（消息摘要算法第五版，用以提供消息的完整性保护）
--with-md5=DIR
#在编译时为 MD5 库设置附加参数
--with-md5-opt=OPTIONS
#使用 MD5 汇编源
--with-md5-asm 
#指向 sha1 库目录（数字签名算法，主要用于数字签名）
--with-sha1=DIR
#在编译时为 sha1 库设置附加参数
--with-sha1-opt=OPTIONS
#使用 sha1 汇编源
--with-sha1-asm
#指向 zlib 库目录
--with-zlib=DIR 
#在编译时为 zlib 设置附加参数
--with-zlib-opt=OPTIONS 
#为指定的 CPU 使用 zlib 汇编源进行优化，CPU 类型为 pentium, pentiumpro
--with-zlib-asm=CPU
#为原子内存的更新操作的实现提供一个架构
--with-libatomic 
#指向 libatomic_ops 安装目录
--with-libatomic=DIR 
#指向 openssl 安装目录
--with-openssl=DIR
#在编译时为 openssl 设置附加参数
--with-openssl-opt=OPTIONS 
#启用 debug 日志
--with-debug
```

## 使用docker部署nginx

```bash
# 新建配置文件夹
mkdir -p /home/nginx/conf

# 自定义配置
docker run -d -p 80:80 -p 443:443 -v $PWD/nginx.conf:/etc/nginx/nginx.conf -v $PWD/conf:/etc/nginx/conf.d -v $PWD/html:/data/html -v $PWD/logs:/data/logs -v /etc/localtime:/etc/localtime --name my-nginx nginx:latest

# 前端项目
docker run -d -p 8080:80 --name some-nginx -v /some/content:/usr/share/nginx/html:ro nginx:latest
```

## nginx特性

* 访问代理：
Nginx 可以通过访问路径、URL 关键字、客户端 IP等多种手段实现访问路由分配。

* 反向代理：
将接收到的请求再转到后端的目标应用服务器，并把响应数据返回给客户端。支持目前绝大多数的网络协议：HTTP/FastCGI/RPC/UDP/TCP等。

* 负载均衡：
通过自身的 upstream 模块支持多种负载均衡算法，使后端服务器可以非常方便地进行横向扩展，以应对高并发。

* 内容缓存：
Nginx支持静态站点和后端分离，可以把静态内容缓存起来，也可以将后端变化不大的响应结果缓存起来，使整体实现了更高速的相应能力。

* 可扩展性：
可定制的模块化架构方式，更多的语言(C/Perl/JavaScript/Lua)支持开发第三方模块并引入，增强可编程及扩展能力。

## nginx进程

首先，进程是CPU管理的运行单元，CPU的单个核心也可以运行多个进程，只不过是交替运行着各个进程，称为时间片，这种方式速度很快，以至于看上去像在同时运行；多核CPU就能同时运行更多的进程。

Nginx是由多个进程运行，一个主进程Master和多个子进程Worker，主进程负责管理子进程，如：重启/重载/创建/销毁等，子进程负责处理具体的请求等业务功能。进程间共享内存数据，更多的进程带来更好的处理能力。

## nginx重载

Nginx支持配置信息的重载，并以最新的配置内容运行，当Nginx在高速运行的时候，如何做到平稳过渡呢？

相关命令：`nginx -s reload`

重载过程：

`Nginx Master process` 负责 `fork` 出一个新的 `Worker process`，最新的Worker使用新的配置信息运行，这时候就销毁一个旧的`worker`，此时，Worker有新旧之分，新Worker用新配置运行，旧Worker依然用旧配置运行，Master继续fork出新的Worker。。。以同样的方式持续替换旧Worker，直到全部替换完成。整个过程中，Nginx 并没有停止运行，丝滑过渡。