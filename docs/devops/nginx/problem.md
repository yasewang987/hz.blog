# Nginx常见错误处理

`no live upstreams while connecting to upstream`:

这个代表没有可用的后端服务，这个时候通常需要将 `upstream` 的 `max_fails` 和 `fail_timeout`设置大一点;
（ `max_fails=1和fail_timeout=10s` 表示在单位周期为10s钟内，中达到1次连接失败，那么接将把节点标记为不可用，并等待下一个周期（同样时常为fail_timeout）再一次去请求，判断是否连接是否成功。）

`upstream timed out (110: Connection timed out)`

该错误是由于nginx 代理去获取上游服务器的 返回值超时了，可以将 `proxy_read_timeout 240s; ` 值设置大一点来解决

## nginx请求头设置

在设计添加请求头时统一使用 `-` ，不要使用 `_`，因为nginx默认配置会忽略带下划线的header，官方解释：因为破折号和下划线都会被映射为下划线，两者不好区分

## nginx容器启动自动退出

容器启动使用如下命令 `nginx -g daemon off;`

## Nginx占用内存过高

Nginx 使用 `client_header_buffer_size` 缓存客户端的请求头，对于大部分请求，1K的默认值已经足够了。一旦请求头超过了1K，空间不够了，nginx就通过 `large_client_header_buffers` 按需扩容，这样做可以平衡资源和性能。

```conf
client_header_buffer_size 2000k;
#修改为
client_header_buffer_size 32k;
```

## 动态Upstream引入变量的导致Proxy_pass转发规则产生异常

`Nginx`会在请求DNS后把对应的IP信息缓存起来，后续的请求就一直用缓存的IP。直到下次`reload`的时候才会再次查询domain，不想经常`reload`，需要通过set设置一个变量变量实现

```conf
# 当请求 /foo/bar/baz时，转发的给后端请求将变为 / 而不是预期的 /bar/baz
location /foo/ {
  set $upstream_endpoint http://service-xxxxxxxx.elb.amazonaws.com/;
  proxy_pass $upstream_endpoint;
}

# 解决办法
location /foo/ {
  set $upstream_endpoint http://service-xxxxxxxx.elb.amazonaws.com/;
  rewrite ^/foo/(.*)$ /$1 break;
  proxy_pass $upstream_endpoint;
}
```

## nginx-dns缓存问题

最直接的处理方式 `docker exec -it mynginx nginx -s reload` 重启一下nginx

```conf
### http例子
# resolver 可以在http、server、location，set 可以写在server和location中。
#注意：当resolver 后面跟多个DNS服务器时，一定要保证这些DNS服务器都是有效的，因为这种是负载均衡模式的，当DNS记录失效了(超过valid时间)，首先由第一个DNS服务器(114.114.114.114)去解析，下一次继续失效时由第二个DNS服务器(223.5.5.5)去解析，亲自测试的，如有任何一个DNS服务器是坏的，那么这一次的解析会一直持续到resolver_timeout ，然后解析失败，且日志报错解析不了域名，通过页面抛出502错误。
server {
       listen      8080;
       server_name localhost;
       # resolver 后面指定DNS服务器，可以指定多个，空格隔开
       # valid设置DNS缓存失效时间，自己根据情况判断，建议600以上
       resolver 114.114.114.114 223.5.5.5 valid=3600s;
       # resolver_timeout 指定解析域名时，DNS服务器的超时时间，建议3秒左右
       resolver_timeout 3s;
       # 在代理到后端域名api111.test.cn时，千万不要直接写在proxy_pass中，因为server中使用了resolver，所以必须先把域名定义到一个变量里面，然后在 proxy_pass http://$变量名，否则nginx语法检测一直会报错，提示解析不了域名
       set $your_domain "api111.test.cn";
       location / {
          proxy_pass http://$your_domain;
       }
   }


### stream例子
# resolver 可以在stream、server
stream {
    resolver 114.114.114.114 valid=10s;
​
    map $remote_addr $backend {
        default  test.razeen.cn;
    }
​
    server {
        listen 8080;
        # resolver 114.114.114.114 valid=10s;  # 也可以写在这里
        proxy_pass $backend:80;
    }
}
```

