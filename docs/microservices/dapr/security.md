# Dapr-Security

传输数据加密：安全机制之一是 相互认证`mutual authentication` TLS 或简写为 mTLS

    * 双向身份验证 - 客户端向服务器证明其身份，反之亦然
    * 建立双向认证后，所有进行中通信都走加密通道

## Sidecar与应用程序之间的通信

Dapr sidecar通过 `localhost` 运行在应用程序附近，建议在与应用程序相同的网络边界下运行。 尽管如今许多云原生系统将 Pod 级别（例如 Kubernetes 上）视为可信任的安全边界，但 Dapr 还是可以为用户提供使用令牌的 API 级别身份验证。 此功能保证即使在 localhost 上，也只有经过身份验证的调用方才能调用 Dapr。

## Sidecar之间的通信

默认配置文件字段：`spec.mtls.enabled`

Dapr 包括一个"默认开启"，自动相互 TLS，为 Dapr sidecar之间的流量提供传输加密。 为此，Dapr 利用名为 `Sentry` 的系统服务，该服务充当证书颁发机构 （Certificate Authority/CA），并为来自 Dapr sidecar的工作负载 （app） 签署证书请求。

Dapr 还管理工作负载证书轮换，并且这样做时应用程序不会停机，除非用户提供了现有的根证书，否则，作为 CA 服务的 Sentry 会自动创建并持有自签名根证书，有效期为一年。

下图显示了 Sentry 系统服务如何根据运维人员提供或由 Sentry 服务生成的根证书/颁发者证书（这些证书存储在文件中）为应用程序颁发证书。

![1](http://cdn.go99.top/docs/microservices/dapr/security1.png)

## Sidecar与系统服务之间的通信

除了 Dapr Sidecar 之间的自动 mTLS 之外，Dapr 还提供 Dapr sidecar 和 Dapr 系统服务之间的强制性 mTLS，这些系统服务包括 `Sentry` 服务（证书颁发机构）、 `Placement` 服务（`Actor`安置）和 `Kubernetes Operator`。

在自托管模式下，每个系统服务都可以装载文件系统路径以获取证书




