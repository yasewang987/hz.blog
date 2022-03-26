# Redis常用命令

```bash
# 客户端链接
redis-cli -p 1234 -a mypassword

# 获取修改(连上redis之后执行)
config get client-output-buffer-limit
# 修改配置
config set client-output-buffer-limit "normal 0 0 0 slave 0 0 0 pubsub 33554432 8388608 60"

# 清理所有db数据
flushall

# 清理指定数据库5
select 5
flushdb
```