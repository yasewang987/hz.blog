# Dapr-PubSub

Pub/Sub 是一个分布式系统中的常见模式，它有许多服务用于解偶、异步消息传递。 使用Pub/Sub，您可以在事件消费者与事件生产者解偶的场景中启用。

典型的发布/订阅形式如下图

![1](http://cdn.go99.top/docs/microservices/dapr/pubsub1.png)

Dapr Pub/Sub 构建块提供一个平台不可知（platform-agnositc）的 API 来发送和接收消息。 您的服务发布消息到一个命名主题（named topic），并且也订阅一个 topic 来消费消息。

![2](http://cdn.go99.top/docs/microservices/dapr/pubsub2.png)

Dapr 保证消息传递 `at-least-once` 语义。 这意味着，当应用程序使用发布/订阅 API 将消息发布到主题时，Dapr 可确保此消息至少传递给每个订阅者一次（at least once）。

当同一个应用程序的多个实例(相同的 ID) 订阅主题时，Dapr 只将每个消息传递给该应用程序的一个实例。

同样，如果两个不同的应用程序 (不同的 ID) 订阅同一主题，那么 Dapr 将每个消息仅传递到每个应用程序的一个实例。

Dapr 可以在每个消息的基础上设置超时。 表示如果消息未从 Pub/Sub 组件读取，则消息将被丢弃。 这是为了防止未读消息的积累。 在队列中超过配置的 TTL 的消息就可以说它挂了。

```bash
curl -X "POST" http://localhost:3500/v1.0/publish/pubsub/TOPIC_A?metadata.ttlInSeconds=120 -H "Content-Type: application/json" -d '{"order-number": "345"}'
```

## Dapr发布/订阅API

要启用消息路由并为每个消息提供附加上下文，Dapr 使用 CloudEvents 1.0 规范 作为其消息格式。 使用 Dapr 应用程序发送的任何信息都将自动包入 Cloud Events 中，`datacontenttype` 属性自动使用 `Content-Type` 头部值，默认值为 `text/plain` 。

Dapr 实现以下 Cloud Events 字段:

```
id
source
specversion
type
datacontenttype (可选)
```

下面的示例显示了 CloudEvent v1.0 中序列化为 JSON 的 XML 内容：

```conf
{
    "specversion" : "1.0",
    "type" : "xml.message",
    "source" : "https://example.com/message",
    "subject" : "Test XML Message",
    "id" : "id-1234-5678-9101",
    "time" : "2020-09-23T06:23:21Z",
    "datacontenttype" : "text/xml",
    "data" : "<note><to>User1</to><from>user2</from><message>hi</message></note>"
}
```

## 设置 pub/sub 组件

在 Linux/MacOS 上打开 `~/.dapr/components/pubsub.yaml` 或在 Windows 上打开`%UserProfile%\.dapr\components\pubsub.yaml` 组件文件以验证:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub123
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
```

## 订阅主题

* 声明式：其中定义在外部文件中。

    在`$HOME/.dapr/components`的文件夹中创建 `subscription.yaml` 文件，内容如下：

    ```yaml
    apiVersion: dapr.io/v1alpha1
    kind: Subscription
    metadata:
      name: myevent-subscription
    spec:
      topic: deathStarStatus
      route: /dsstatus
      pubsubname: pubsub123
    scopes:
    - app1
    - app2
    ```

    上面的示例显示了 `deathStarStatus` 主题的事件订阅，对于pubsub 组件 `pubsub123`。

    * `route` 告诉 Dapr 将所有主题消息发送到应用程序中的 `/dsstatus` 端点。
    * `scopes` 为 app1 和 app2 启用订阅。

    还可以通过将 Dapr CLI 指向组件路径来覆盖默认目录(如果你将订阅置于自定义组件路径中，请确保Pub/Sub 组件也存在)：

    ```bash
    dapr run --app-id myapp --components-path ./myComponents -- python3 app1.py
    ```

    ```py
    import flask
    from flask import request, jsonify
    from flask_cors import CORS
    import json
    import sys

    app = flask.Flask(__name__)
    CORS(app)

    @app.route('/dsstatus', methods=['POST'])
    def ds_subscriber():
        print(request.json, flush=True)
        return json.dumps({'success':True}), 200, {'ContentType':'application/json'}

    app.run()
    ```

    上面为了告诉Dapr 消息处理成功，返回一个 200 OK 响应。 如果 Dapr 收到超过 200 的返回状态代码，或者你的应用崩溃，Dapr 将根据 At-Least-Once 语义尝试重新传递消息。

    ```bash
    # 启动
    dapr --app-id app1 --app-port 5000 run python app1.py
    ```

* 编程方式：订阅在用户代码中定义

    若要订阅主题，请使用您选择的编程语言启动 Web 服务器，并监听以下 GET 终结点： `/dapr/subscribe`。 Dapr 实例将在启动时调用到您的应用，并期望对的订阅主题响应 JOSN：

    * pubsubname: Dapr 用到的 pub/sub 组件（pubsub123）
    * topic: 订阅的主题
    * route：当消息来到该主题时，Dapr 需要调用哪个终结点

    ```py
    import flask
    from flask import request, jsonify
    from flask_cors import CORS
    import json
    import sys

    app = flask.Flask(__name__)
    CORS(app)

    @app.route('/dapr/subscribe', methods=['GET'])
    def subscribe():
        subscriptions = [{'pubsubname': 'pubsub',
                        'topic': 'deathStarStatus',
                        'route': 'dsstatus'}]
        return jsonify(subscriptions)

    @app.route('/dsstatus', methods=['POST'])
    def ds_subscriber():
        print(request.json, flush=True)
        return json.dumps({'success':True}), 200, {'ContentType':'application/json'}
    app.run()
    ```

## 发布主题

要发布主题，您需要运行一个 Dapr sidecar 的实例才能使用 Pub/Sub Redis 组件。 您可以使用安装在您本地环境中的默认的Redis组件。

```bash
dapr run --app-id testpubsub --dapr-http-port 3500
```

然后发布一条消息给 deathStarStatus 主题

```bash
dapr publish --publish-app-id testpubsub --pubsub pubsub123 --topic deathStarStatus --data '{"status": "completed"}'
```

## pub/sub 主题作用域限定

* `spec.metadata.publishingScopes`
    * 分号分隔应用程序列表& 逗号分隔的主题列表允许该 app 发布信息到主题列表
    * 如果在 `publishingScopes` (缺省行为) 中未指定任何内容，那么所有应用程序可以发布到所有主题
    * 要拒绝应用程序发布信息到任何主题，请将主题列表留空 (`app1=;app2=topic2`)
    * 例如， `app1=topic1;app2=topic2,topic3;app3=` 允许 app1 发布信息至 topic1 ，app2 允许发布信息到 topic2 和 topic3 ，app3 不允许发布信息到任何主题。
* `spec.metadata.subscriptionScopes`
    * 分号分隔应用程序列表& 逗号分隔的主题列表允许该 app 订阅主题列表
    * 如果在 `subscriptionScopes` (缺省行为) 中未指定任何内容，那么所有应用程序都可以订阅所有主题
    * 例如， `app1=topic1;app2=topic2,topic3` 允许 app1 订阅 topic1 ，app2 可以订阅 topic2 和 topic3
* `spec.metadata.allowedTopics`
    * 一个逗号分隔的允许主题列表，对所有应用程序。
    * 如果未设置 `allowedTopics` (缺省行为) ，那么所有主题都有效。 `subscriptionScopes` 和 `publishingScopes` 如果存在则仍然生效。
    * `publishingScopes` 或 `subscriptionScopes` 可用于与 `allowedTopics` 的 `conjuction` ，以添加限制粒度

如果主题包含敏感信息，并且只允许应用程序的某个子集发布或订阅这些主题，限制哪些应用程序可以发布/订阅主题可能很有用。

它还可以用于所有主题，以始终具有应用程序使用哪些主题作为发布者/订阅者的“基本事实”。

以下是三个应用程序和三个主题的示例:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub123
  namespace: default
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: "localhost:6379"
  - name: redisPassword
    value: ""
  - name: publishingScopes
    value: "app1=topic1;app2=topic2,topic3;app3="
  - name: subscriptionScopes
    value: "app2=;app3=topic1"
```

当 Dapr 应用程序给主题发送信息时，主题将自动创建。 在某些情况下，这个主题的创建应该得到管理。 例如:

* Dapr 应用程序中有关生成主题名称的错误可能会导致创建无限数量的主题
* 简化主题名称和总数，防止主题无限增长

在这些情况下，可以使用 allowedTopics。

以下是三个允许的主题的示例:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub123
  namespace: default
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: "localhost:6379"
  - name: redisPassword
    value: ""
  - name: allowedTopics
    value: "topic1,topic2,topic3"
```




