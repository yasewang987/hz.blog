# Dapr服务调用(invoke)

支持使用 `gRPC` 和 `HTTP` 协议调用其他服务

dapr采用sidcar模式运行，应用程序可以用过 `invoke` 这个API 访问自己的 `dapr sidcar`，Dapr 实例会相互发现并进行通信。

![1](http://cdn.go99.top/docs/microservices/dapr/invoke1.png)

注: Dapr 边车之间的所有调用考虑到性能都优先使用 gRPC。 仅服务与 Dapr 边车之间的调用可以是 HTTP 或 gRPC

调用appid为`myapp`的`neworder`方法：`http://localhost:3500/v1.0/invoke/myapp/method/neworder`

## 提供的能力

* 服务调用
* 服务发现
* 服务负载均衡（mDNS）
* 服务调用的安全性(mTLS)
* 服务调用故障处理（重试等）
* 分布式可观测性的追踪和指标

## 命名空间作用域

服务调用支持跨命名空间调用。 在所有受支持的托管平台上， Dapr 应用程序标识（ID）遵循包含了目标命名空间的有效 FQDN 格式。

例如，以下字符串包含应用程序标识 `nodeapp` 以及应用程序在 `production` 中运行的名称空间。在 Kubernetes 集群中进行跨命名空间调用特别有用.

```bash
localhost:3500/v1.0/invoke/nodeapp.production/method/neworder
```

## 服务间安全性

Dapr 应用程序之间的所有调用都可以通过托管平台上的相互(mTLS) 身份验证来安全，包括通过 Dapr 哨兵服务来自动证书翻转（certificate rollover）。

应用程序可以控制哪些其他应用程序允许调用它们，以及通过访问策略授权它们做什么。 这使您能够限制敏感应用，也就是说有人员信息的应用被未经授权的应用访问。 与服务间安全通信相结合，提供软多租户部署。

下图是 Kubernetes 集群上的一个部署示例，使用 Dapr 化的Ingress服务，该服务调用Service A，使用mTLS加密服务调用，并应用访问控制策略。 Service A 接下来调用 Service B 并也使用服务调用和 mTLS。 每个服务都在不同的名称空间中运行，以增加隔离。

![2](http://cdn.go99.top/docs/microservices/dapr/invoke2.png)

## 重试

在发生调用失败和瞬态错误的情况下，服务调用会在回退（backoff）时间段内执行自动重试。

导致重试的错误有：

* 网络错误，包括端点不可用和拒绝连接
* 因续订主调/被调方Dapr边车上的证书而导致的身份验证错误

每次调用重试的回退间隔是 1 秒，最多重试三次。 通过 gRPC 连接目标 sidecar 的超时时间为5秒

## 可插拔的服务发现

他们有一个能够发现服务的 名称解析组件。 例如，Kubernetes 名称解析组件使用 Kubernetes DNS 服务来解析在集群中运行的其他应用程序的位置。 对于本地和多个物理机器，这将使用 `mDNS` 协议。

Dapr 使用 mDNS 协议提供轮询负载均衡的服务调用请求，例如用于本地或多个联网的物理机器。

下面的图表显示了如何运作的一个例子。 如果您有一个应用程序实例，其中包含 app ID 为 FrontEnd 和 3 个 app ID 为 Cart 的应用程序实例，并且您从 FrontEnd 应用程序到 Cart 应用程序的3个实例之间的进行轮询。 这些实例可以在同一机器上或不同的机器上。 .

![3](http://cdn.go99.top/docs/microservices/dapr/invoke3.png)

* 注意：一组相同appid的应用作为同一个服务供其他应用调用

## 具有可观测性的追踪和指标

默认情况下，所有应用程序之间的调用都会被追踪，也会收集到度量（metrics），以便为应用程序提供洞察力（insights）和诊断。 这在生产场景中尤其重要。 这给您的服务之间的调用提供了调用链图和度量（metrics）。

