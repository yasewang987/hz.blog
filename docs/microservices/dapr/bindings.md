# Dapr-Bindings

使用绑定，您可以使用来自外部系统的事件或与外部系统的接口来触发应用程序。 此构建块为您和您的代码提供了若干益处 :

* 除去连接到消息传递系统 ( 如队列和消息总线 ) 并进行轮询的复杂性
* 聚焦于业务逻辑，而不是如何与系统交互的实现细节
* 使代码不受 SDK 或库的跟踪
* 处理重试和故障恢复
* 在运行时在绑定之间切换
* 构建具有特定于环境的绑定的可移植应用程序，不需要进行代码更改

## 输入绑定

输入绑定用于在发生来自外部资源的事件时触发应用程序。 可选的有效负载和元数据可以与请求一起发送。

为了接收来自输入绑定的事件 :

* 定义描述绑定类型及其元数据 ( 连接信息等) 的组件 YAML
* 监听传入事件的 HTTP 终结点，或使用 gRPC 原型库获取传入事件

> 如果应用程序要订阅绑定，在启动 Dapr 时，对应用程序的所有已定义输入绑定发送 OPTIONS 请求，并期望 NOT FOUND (404) 以外的状态码。

使用绑定，代码可以被来自不同资源的传入事件触发，这些事件可以是任何内容：队列、消息传递管道、云服务、文件系统等。

### 创建绑定

输入绑定表示 Dapr 用于读取事件并推送到应用程序的事件资源。

创建以下 YAML 文件，名为 `binding.yaml`，并将其保存到应用程序的 `components` 子文件夹中。 （使用具有 `--components-path` 标记 的 dapr run 命令来指向自定义组件目录）

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: myevent
  namespace: default
spec:
  type: bindings.kafka
  version: v1
  metadata:
  - name: topics
    value: topic1
  - name: brokers
    value: localhost:9092
  - name: consumerGroup
    value: group1
```

在这里，创建一个新的名称为 `myevent` 的绑定组件。

在 `metadata` 部分中，配置 Kafka 相关属性，如要监听的topics，代理或者更多。

### 监听传入事件

现在配置您的应用程序来接收传入事件。 如果使用 HTTP ，那么需要监听在文件 `metadata.name` 中指定的绑定名称所对应的POST 终结点。 在此示例中，是 `myevent`。

```js
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

const port = 3000

app.post('/myevent', (req, res) => {
    console.log(req.body)
    res.status(200).send()
})

app.listen(port, () => console.log(`Kafka consumer app listening on port ${port}!`))
```

确认事件: `res.status(200).send()`

拒绝事件: `res.status(500).send()`

## 输出绑定

输出绑定允许用户调用外部资源。 可选的有效负载和元数据可与调用请求一起发送。

为了调用输出绑定：

* 定义描述绑定类型及其元数据 ( 连接信息等) 的组件 YAML
* 使用 HTTP 终结点或 gRPC 方法调用具有可选有效负载的绑定

使用绑定，可以调用外部资源，而无需绑定到特定的 SDK 或库。

### 创建绑定

输出绑定表示 Dapr 将使用调用和向其发送消息的资源。

创建一个新的名称为 myevent 的绑定组件。在 `metadata` 部分中，配置 Kafka 相关属性，如要将消息发布到其的`topics`和代理。

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: myevent
  namespace: default
spec:
  type: bindings.kafka
  version: v1
  metadata:
  - name: brokers
    value: localhost:9092
  - name: publishTopic
    value: topic1
```

### 发送事件

注: 在 Kubernetes 中运行时，使用 `kubectl apply -f binding.yaml` 将此文件应用于您的集群

```bash
curl -X POST -H 'Content-Type: application/json' http://localhost:3500/v1.0/bindings/myevent -d '{ "data": { "message": "Hi!" }, "operation": "create" }'
```

如上文所见，您使用了要调用的绑定的名称来调用 `/binding` 终结点。 在我们的示例中，它的名称是 `myevent` 。 有效载荷位于必需的 `data` 字段中，并且可以是任何 JSON 可序列化的值。

有一个 operation 字段告诉绑定您需要它执行的操作。

