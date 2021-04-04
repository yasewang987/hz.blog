# Dapr-State

## Dapr-State简单使用示例

* 运行 Dapr Sidecar

```bash
# 在端口 3500 上监听名为 myapp 的空白应用程序
dapr run --app-id myapp --dapr-http-port 3500
```

* 保存状态

```bash
curl -X POST -H "Content-Type: application/json" -d '[{ "key": "name", "value": "Yasewang"}]' http://localhost:3500/v1.0/state/statestore
```

* 获取状态

```bash
curl http://localhost:3500/v1.0/state/statestore/name
```

* 查看状态如何在 Redis 中存储

```bash
docker exec -it dapr_redis redis-cli

# 查看所有key
keys *
# 结果如下：
1) "myapp||name"

# 查看内容
hgetall "myapp||name"
# 结果如下：
1) "data"
2) "\"Yasewang\""
3) "version"
4) "1"
```