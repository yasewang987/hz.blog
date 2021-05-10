# Nginx常见错误处理

`no live upstreams while connecting to upstream`:

这个代表没有可用的后端服务，这个时候通常需要将 `upstream` 的 `max_fails` 和 `fail_timeout`设置大一点;
（ `max_fails=1和fail_timeout=10s` 表示在单位周期为10s钟内，中达到1次连接失败，那么接将把节点标记为不可用，并等待下一个周期（同样时常为fail_timeout）再一次去请求，判断是否连接是否成功。）

`upstream timed out (110: Connection timed out)`

该错误是由于nginx 代理去获取上游服务器的 返回值超时了，可以将 `proxy_read_timeout 240s; ` 值设置大一点来解决