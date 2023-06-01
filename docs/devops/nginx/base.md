# Nginx基础知识

## 编译安装

```bash
yum install gcc -y                # C语言编译器
yum install pcre pcre-devel -y    # PCRE Library
yum install zlib zlib-devel -y    # zlib Library

# 进入解压后的目录中 编译安装 [指定用户/组] [--with-追加自带模块名称] 
./configure --prefix=/usr/local/nginx [--user=www --group=www] [--with-http_gzip_static_module]
make && make install

nginx            # 启动
nginx -s stop    # 停止，立即
nginx -s quit    # 退出，处理完现有任务后
nginx -s reopen  # 重启
nginx -s reload  # 重载配置，交替更新工作进程
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