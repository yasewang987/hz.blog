# Redis安装

## docker安装教程

### 主服务器

在redis目录下创建文件夹 data，conf

下载redis.conf文件：http://download.redis.io/redis-stable/redis.conf 放到 conf 文件夹下

修改启动默认配置(从上至下依次)：

`bind 127.0.0.1` #注释掉这部分，这是限制redis只能本地访问

`protected-mode no` #默认yes，开启保护模式，限制为本地访问

`daemonize no` #默认no，改为yes意为以守护进程方式启动，可后台运行，除非kill进程，改为yes会使配置文件方式启动redis失败

`databases 16` #数据库个数（可选），我修改了这个只是查看是否生效。。

`dir  ./` #输入本地redis数据库存放文件夹（可选）

`appendonly yes` #redis持久化（可选）

`requirepass  密码` #配置redis访问密码

运行容器命令(redis文件夹下运行)：

```bash
sudo docker run -d --restart=always -p 6379:6379 \
-v $PWD/conf:/usr/local/etc/redis \
-v $PWD/data:/data \
--name redis redis redis-server /usr/local/etc/redis/redis.conf
```

### 从服务器

从服务器只需要修改如下配置文件，其他与主服务器一样即可：

```conf
replicaof 主redis-ip 主reids端口
masterauth 主redis密码
```

## nginx反向代理

监听具备公网ip服务器的3307端口，实现跳转到172.31.88.27的3306端口。

特别注意：stream要与http在同级目录  

```conf
stream {    # stream 模块配置和 http 模块在相同级别
    upstream redis {
        server 127.0.0.1:6379 max_fails=3 fail_timeout=30s;
    }
    server {
        listen 16379;
        proxy_connect_timeout 1s;
        proxy_timeout 3s;
        proxy_pass redis;
    }
}
```

## Redis常用客户端工具

* `another redis desktop manager`
* `RedisInsight`
