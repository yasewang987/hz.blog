# Dapr可观测性

通过跟踪(traces)、度量(metrics)、日志(logs)和健康状况(health)来监控应用程序

在利用 Dapr 构建块来执行`服务到服务调用`和 `pub/sub` 消息传递构建应用程序时， Dapr 拥有相对于 `分布式跟踪` 的优势，因为此服务间通信全部流经 `Dapr sidecar`，sidecar 处于这样独特的位置，可以消除应用程序级别检测的负担。

## 分布式跟踪

Dapr 可以配置发送跟踪数据，并且由于 Dapr 使用广泛采用的协议（如 Zipkin 协议）进行跟踪，因此可以轻松地集成多个 监控后端。

![1](http://cdn.go99.top/docs/microservices/daprobservability1.png)

![1.1](http://cdn.go99.top/docs/microservices/dapr/tracing1.1.png)

### OpenTelemetry 采集器

Dapr 还可以通过配置来使用 `OpenTelemetry Collector` ，它会提供更多与外部监控工具的兼容性。

使用行业标准的 `OpenCensus/ OpenTelemetry SDKs` 生成跟踪头

![2](http://cdn.go99.top/docs/microservices/daprobservability2.png)

### 跟踪上下文

Dapr 使用 W3C 追踪上下文对服务调用和 `pub/sub` 消息传递进行分布式跟踪。 在很大程度上，Dapr 负责生成和传播跟踪上下文信息的所有繁重工作，这些信息可以发送到许多不同的诊断工具进行可视化和查询。

### Dapr 在服务之间生成和传播跟踪上下文

在这些场景下，Dapr 会为您完成所有工作。 您不需要创建和传播任何跟踪头。 Dapr 负责创建所有跟踪头并传播它们。 让我们用示例来了解一下这些场景：

* 单个服务调用 (service A -> service B )，Dapr 在服务A 中生成跟踪标头，这些跟踪标头从服务A 传播到服务B。
* 多个顺序的服务调用 （ 服务 A -> 服务 B -> 服务 C），Dapr 在服务 A 中请求开始时生成跟踪标头，这些跟踪标头从 服务 A-> 服务 B -> 服务 C 一路传播到进一步启用了 Dapr 的服务。
* 请求来自外部端点 （例如从网关服务到启用 Dapr 的服务 A），Dapr 在服务 A 中生成跟踪标头，这些跟踪标头从服务 A 传播到进一步启用了 Dapr 的服务 服务 A -> 服务 B -> 服务 C。 这与上面的场景 2 类似。
* Pub/sub消息：Dapr 在发布的消息主题中生成跟踪头，而这些跟踪头被传播到任何监听该主题的服务。

### 需要在服务之间传播或生成跟踪上下文

* 从单个服务到不同服务的多次服务调用

    ```
     service A -> service B
    [ .. some code logic ..]
    service A -> service C
    [ .. some code logic ..]
    service A -> service D
    [ .. some code logic ..] some code logic ..]
    service A -> service C
    [ .. some code logic ..]
    service A -> service D
    [ .. some code logic ..]
    ```

### 使用W3C跟踪上下文

https://dapr-cn.github.io/developing-applications/building-blocks/observability/w3c-tracing/w3c-tracing-howto/

## Dapr sidecar 和系统服务的可观察性

至于系统的其他部分，您希望能够观察 Dapr 本身，并收集 Dapr sidecar 沿每个微服务以及您环境中的 Dapr 相关服务（如部署在 Dapr 启用的 Kubernetes 集群中的控制面板服务）发出的指标和日志。

![3](http://cdn.go99.top/docs/microservices/daprobservability3.png)

### 日志

Dapr 生成 日志，以提供 sidecar 操作的可见性，并帮助用户识别问题并执行调试。 日志事件包含由 Dapr 系统服务生成的警告，错误，信息和调试消息。 Dapr 还可以通过配置将日志发送到收集器，例如 `Fluentd` 和 `Azure Monitor` ，这样就可以轻松搜索，分析和提供洞察。

### 度量

指标（Metrics）是在一段时间内收集和存储的一系列度量值和计数。 Dapr 指标 提供监控功能，以了解 Dapr sidecar 和系统服务的行为。 例如，Dapr sidecar 和用户应用之间的服务指标可以展示调用延迟、流量故障、请求的错误率等。 Dapr 的系统服务度量 则可以显示 sidecar 注入失败，系统服务的运行状况 ( 包括 CPU 使用率，actor 位置数量等) 。

接入prometheus,修改 `prometheus.yml` 文件。

```yaml
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  - job_name: 'dapr'

    # Override the global default and scrape targets from this job every 5 seconds.
    global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  - job_name: 'dapr'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:9090'] # Replace with Dapr metrics port if not default
```

引入 grafana 模版：https://github.com/dapr/dapr/tree/master/grafana

### 健康状态

Dapr sidecar 暴露了 健康检查的 HTTP 终结点。 通过此终结点，可以探测 Dapr 进程或 sidecar，以确定它的准备度和活跃度，并采取相应的行动。

## Sidecar 运行状况

Dapr 提供了一种使用 HTTP `/healthz` 端点来确定其健康状况的方法。 