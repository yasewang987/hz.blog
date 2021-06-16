# Dapr-Component

自定义组件

## 所有组件介绍

* 状态存储
* 服务发现
* 中间件：Dapr 允许将自定义 中间件 插入请求处理管道。 中间件组件与 `服务调用` 基础结构块一起使用。
* Pub/Sub 代理
* 绑定资源 bangdings
* Secret stores（密钥存储）

## Dapr自定义密钥组件(Secrets)

* 创建一个 JSON 密钥存储

Dapr 支持 许多类型的密钥存储， 但最简单的方法是在本地的JSON文件中加入您的密钥(注意这个秘密存储是为了开发的目的，不推荐生产使用，因为它不安全)。

首先保存下面的 JSON 内容到名为 `my-components/mysecrets.json` 的文件：

```json
{
   "my-secret" : "yasewang"
}
```

* 创建一个密钥存储Dapr 组件配置文件: `localSecretStore.yaml`

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: my-secret-store
  namespace: default
spec:
  type: secretstores.local.file
  version: v1
  metadata:
  - name: secretsFile # 文件位置
    value: /Users/hzgod/Documents/hz/daprtest/my-components/mysecrets.json
  - name: nestedSeparator # 分隔符
    value: ":"
```

可以看到上面的文件定义有一个 type: secretstores.local.file 告诉Dapr使用本地文件组件作为密钥存储。

* 运行Dapr sidecar

```bash
dapr run --app-id myapp --dapr-http-port 3500 --components-path ./my-components
```

* 获取密钥

```bash
curl http://localhost:3500/v1.0/secrets/my-secret-store/my-secret
# 内容如下
{"my-secret":"yasewang"}
```


