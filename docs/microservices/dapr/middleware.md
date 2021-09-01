# Dapr-Middleware

Dapr 允许通过链接一系列中间件组件来定义自定义处理管道。 请求在路由到用户代码之前经过所有已定义的中间件组件，然后在返回到客户机之前，按相反顺序经过已定义的中间件，如下图中所示。

![1](http://cdn.go99.top/docs/microservices/dapr/middleware1.png)

启动后， Dapr sidecar 会构建中间件处理管道。 默认情况下，管道由 `追踪中间件` 和 `CORS中间件` 组成。 其他中间件，由 `Dapr configuration` 配置，按照定义的顺序添加到管道中。 管道适用于所有 Dapr API 终结点，包括状态，发布/订阅，服务调用，绑定，安全性和其他。

以下配置示例定义了使用 `OAuth 2.0` 中间件 和`大写`中间件组件的自定义管道。 在这种情况下，在转发到用户代码之前，所有请求都将通过 OAuth 2.0 协议进行授权，并转换为大写文本。

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: pipeline
  namespace: default
spec:
  httpPipeline:
    handlers:
    - name: oauth2
      type: middleware.http.oauth2
    - name: uppercase
      type: middleware.http.uppercase
```

Dapr中的中间件使用Component文件描述，其schema如下:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: <COMPONENT NAME>
  namespace: <NAMESPACE>
spec:
  type: middleware.http.<MIDDLEWARE TYPE>
  version: v1
  metadata:
  - name: <KEY>
    value: <VALUE>
  - name: <KEY>
    value: <VALUE>
...
```

例如限流组件

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: ratelimit
spec:
  type: middleware.http.ratelimit
  version: v1
  metadata:
  - name: maxRequestsPerSecond
    value: 10
```
## 编写自定义中间件

Dapr 使用 [FastHTTP](https://github.com/valyala/fasthttp) 来实现其的 HTTP 服务器。 因此，您的 HTTP 中间件也需要编写为 `FastHTTP handler`。 您的中间件需要实现 Middleware 接口，该接口定义 `GetHandler` 方法，该方法返回 `fasthttp.RequestHandler`:

```go
type Middleware interface {
  GetHandler(metadata Metadata) (func(h fasthttp.RequestHandler) fasthttp.RequestHandler, error)
}

func GetHandler(metadata Metadata) fasthttp.RequestHandler {
  return func(h fasthttp.RequestHandler) fasthttp.RequestHandler {
    return func(ctx *fasthttp.RequestCtx) {
      // inboud logic
      h(ctx)  // call the downstream handler
      // outbound logic
    }
  }
}
```

## 添加新的中间件组件

您的中间件组件可以贡献到 [components-contrib](https://github.com/dapr/components-contrib/tree/master/middleware) 仓库。

在接受了 `components-contrib` 变更后，针对 Dapr 运行时仓库 提交另一个 pull 请求，以注册新的中间件类型。 您需要修改`runtime.WithHTTPMiddleware`方法中的**`cmd/daprd/main.go`方法，将您的中间件注册到Dapr的运行时。

## 常用中间件

* [Rate limit](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-rate-limit/)：限制每秒允许的 HTTP 请求的最大数量
* [OAuth2](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-oauth2/)：在Web API上启用OAuth2授权授权流程
* [OAuth2 client credentials](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-oauth2clientcredentials/)：在Web API上启用OAuth2客户端凭证授予流程
* [Bearer](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-bearer/)：使用 OpenID Connect在 Web API 上验证 Bearer Token
* [Open Policy Agent](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-opa/)：将Rego/OPA策略应用到传入的Dapr HTTP请求中