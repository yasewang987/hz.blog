# Redis常见问题处理

* `WARNING overcommit_memory is set to 0 ...` 

    临时处理： `echo 1 > /proc/sys/vm/overcommit_memory` 然后重启redis或者redis容器

    永久解决：在`/etc/sysctl.conf`最后一行加入`vm.overcommit_memory = 1`,然后重启服务器或者执行`sysctl vm.overcommit_memory=1`命令生效。（或者执行 `sysctl -p` 可以立即生效）

* `The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128`

    将 `net.core.somaxconn = 1024` 添加到`/etc/sysctl.conf`中，然后执行 `sysctl -p` 生效配置。

* redis容器间隔1分钟左右就自动重启：有很大可能是redis的rdb文件比较大，服务器内存不够了，需要释放内存之后再启动。

* redis从库过多导致数据同步失败：修改主库的配置文件中的 `client-output-buffer-limit`,命令如下：`config set client-output-buffer-limit "normal 0 0 0 slave 0 0 0 pubsub 33554432 8388608 60"`

* `MISCONF Redis is configured to save RDB snapshots, but is currently not able`：

    原因1：强制关闭Redis或者重复启动Redis导致快照不能持久化。解决方案：关掉所有redis进程重新启动redis

    原因2：服务器内存不足。
    解决方案1：修改`/etc/sysctl.conf`增加`vm.overcommit_memory = 1`, 执行`sysctl -p`生效
    解决方案2：`127.0.0.1:6379> config set stop-writes-on-bgsave-error no`
