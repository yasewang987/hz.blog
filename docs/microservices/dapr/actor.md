# Dapr-Actors

Actor接收消息并一次处理消息，而不进行任何类型的并行或线程处理。

当代码处理一条消息时，它可以向其他参与者发送一条或多条消息，或者创建新的 Actors。

大量 Actors 可以同时执行，而 Actors 可以相互独立执行。

使用场景：

* 您的问题空间涉及大量(数千或更多) 的独立和孤立的小单位和逻辑。
* 您想要处理单线程对象，这些对象不需要外部组件的大量交互，例如在一组 Actors 之间查询状态。
* 您的 actor 实例不会通过发出I/O操作来阻塞调用方。

Dapr Actor 运行时在回调完成时保存对actor的状态所作的更改。 如果在保存状态时发生错误，那么将取消激活该actor对象，并且将激活新实例。

## Actor 生命周期

调用 actor 方法和 reminders 将重置空闲时间，例如，reminders 触发将使 actor 保持活动状态。 不论 actor 是否处于活动状态或不活动状态 Actor reminders 都会触发，对不活动 actor ，那么会首先激活 actor。 Actor timers 不会重置空闲时间，因此 timer 触发不会使参与者保持活动状态。 Timer 仅在 actor 活跃时被触发。

空闲超时和扫描时间间隔 Dapr 运行时用于查看是否可以对 actor 进行垃圾收集。 当 Dapr 运行时调用 actor 服务以获取受支持的 actor 类型时，可以传递此信息。

Dapr Actors 是虚拟的，意思是他们的生命周期与他们的 in - memory 表现不相关。 因此，它们不需要显式创建或销毁。 Dapr Actors 运行时在第一次接收到该 actor ID 的请求时自动激活 actor。 如果 actor 在一段时间内未被使用，那么 Dapr Actors 运行时将回收内存对象。 如果以后需要重新启动，它还将保持对 actor 的一切原有数据（因为状态存储在 Dapr 运行时的配置状态提供程序中）。

Actors 可以通过 timer 或者 remider 自行注册周期性的任务.

### Actors timer

当actor作为垃圾回收(GC)的一部分被停用时，所有 timer 都会停止。 在此之后，将不会再调用 timer 的回调。 此外， Dapr Actors 运行时不会保留有关在失活之前运行的 timer 的任何信息。 也就是说，重新启动 actor 后将会激活的 timer 完全取决于注册时登记的 timer。

您可以通过将 HTTP/gRPC 请求调用 Dapr 来为 actor 创建 timer。

```bash
POST/PUT http://localhost:3500/v1.0/actors/<actorType>/<actorId>/timers/<name>
```

Timer 的 `duetime` 和回调函数可以在请求主体中指定。 到期时间（`duetime`）表示注册后 `timer` 将首次触发的时间。 `period` 表示timer在此之后触发的频率。 到期时间为0表示立即执行。 负 `due times` 和负 `periods` 都是无效。

下面的请求体配置了一个 timer, dueTime 9秒, period 3秒。 这意味着它将在9秒后首次触发，然后每3秒触发一次。

```json
{
  "dueTime":"0h0m9s0ms",
  "period":"0h0m3s0ms"
}
```

您可以通过调用来除去 Actor timers

```bash
DELETE http://localhost:3500/v1.0/actors/<actorType>/<actorId>/timers/<name>
```

### Actor reminders

Reminders 是一种在指定时间内触发 persistent 回调的机制。 它们的功能类似于 timer。 但与 timer 不同，在所有情况下 reminders 都会触发，直到 actor 显式取消注册 reminders 或删除 actor 。具体而言， reminders 会在所有 actor 失活和故障时也会触发触发，因为Dapr Actors 运行时会将 reminders 信息持久化到 Dapr Actors 状态提供者中。

您可以通过将 HTTP/gRPC 请求调用 Dapr 来为 actor 创建 reminders。

```bash
POST/PUT http://localhost:3500/v1.0/actors/<actorType>/<actorId>/reminders/<name>
```

Reminders 的 `duetime` 和回调函数可以在请求主体中指定。 到期时间（due time）表示注册后 reminders将首次触发的时间。 `period` 表示在此之后 reminders 将触发的频率。 到期时间(due time)为0表示立即执行。 负 due times 和负 periods 都是无效。 若要注册仅触发一次的 reminders ，请将 `period` 设置为空字符串。

下面的请求体配置了一个 reminders, dueTime 0秒, period 3秒。 这意味着它将在注册之后立即触发，然后每3秒触发一次。

```json
{
  "dueTime":"0h0m0s0ms",
  "period":"0h0m3s0ms"
}
```

下面的请求体配置了一个 reminders, dueTime 15秒, period 空字符串。 这意味着它将在15秒后首次触发，之后就不再被触发。

```json
{
  "dueTime":"0h0m15s0ms",
  "period":""
}
```

检索 actor reminders

```bash
GET http://localhost:3500/v1.0/actors/<actorType>/<actorId>/reminders/<name>
```

删除 actor reminders

```bash
DELETE http://localhost:3500/v1.0/actors/<actorType>/<actorId>/reminders/<name>
```


## 分发和故障转移

为了提供可扩展性和可靠性，Actors 实例分布在整个集群中， Dapr 会根据需要自动将对象从失败的节点迁移到健康的节点。

Actors 分布在 actor 服务的实例中，并且这些实例分布在集群中的节点之间。 每个服务实例都包含给定 Actors 类型的一组 Actors。

## Actor 安置服务 (Actor placement service)

Dapr actor 运行时为您管理分发方案和键范围设置。 这是由 actor Placement 服务完成的。 创建服务的新实例时，相应的 Dapr 运行时将注册它可以创建的 actor 类型， Placement 服务将计算给定 actor 类型的所有实例之间的分区。 每个 actor 类型的分区信息表将更新并存储在环境中运行的每个 Dapr 实例中，并且可以随着新 actor 服务实例创建和销毁动态更改。 如下图所示。

![1](http://cdn.go99.top/docs/microservices/dapr/actors1.png)

当客户端调用具有特定标识的 actor ( 例如，actor Id 123) 时，客户端的 Dapr 实例将散列 actor 类型和 Id，并使用该信息来调用相应的 Dapr 实例，该实例可以为该特定 actor Id提供请求。 因此，始终对任何给定 actor Id 始终会落在同一分区 (或服务实例) 。 如下图所示。

![2](http://cdn.go99.top/docs/microservices/dapr/actors2.png)

这简化了一些选择，但也带有一些考虑：

* 默认情况下，Actors 被随机放入分区中，从而形成均匀的分布。
* 由于 Actors 是随机放置的，因此可知，执行操作始终需要网络通信，包括方法调用数据的序列化和去序列化，产生延迟和开销。

注: Dapr actor Placement 服务仅用于 actor 安置，因此，如果您的服务未使用 Dapr Actors，那么不需要。

## Actor 通信

可以通过 HTTP/gRPC 来与 Dapr 交互以调用 actor 方法.

```bash
POST/GET/PUT/DELETE http://localhost:3500/v1.0/actors/<actorType>/<actorId>/<method/state/timers/reminders>
```

您可以在请求主体中为 actor 方法提供任何数据，并且请求的响应在响应主体中，这是来自 actor 方法调用的数据。

### 并发（Concurrency）

Dapr Actors 运行时提供了一个简单的基于回合的访问模型，用于访问 Actors 方法。 这意味着任何时候都不能有一个以上的线程在一个 actor 对象的代码内活动。 基于回合的访问大大简化了并发系统，因为不需要同步数据访问机制。 这也意味着系统的设计必须考虑到每个 actor 实例的单线程访问性质。

单个 actor 实例一次无法处理多个请求。 如果 actor 实例预期要处理并发请求，可能会导致吞吐量瓶颈。

如果两个 Actors 之间存在循环请求，而外部请求同时向其中一个 Actors 发出外部请求，那么 Actors 可以相互死锁。 Dapr actor 运行时会自动分出 actor 调用，并向调用方引发异常以中断可能死锁的情况。

![3](http://cdn.go99.top/docs/microservices/dapr/actors3.png)

### 基于回合的访问 

一个回合包括执行 actor 方法的全部过程。在允许新回合之前，必须完全结束之前的回合。

Dapr Actors 运行时通过在回合开始时获取每个 Actors 的锁定并在该回合结束时释放锁定来实施基于回合的并行。 因此，基于回合的并发性是按每个 actor 执行的，而不是跨 Actors 执行的。 Actor 方法和 timer/reminders 回调可以代表不同的 Actors 同时执行。

下面的示例演示了上述概念。 现在有一个实现了两个异步方法（例如，方法 1 和方法 2）、timer 和 reminders 的 actor。 下图显示了执行这些方法的时间线的示例，并代表属于此 Actors 类型的两个 Actors ( ActorId1 和 ActorId2) 的回调。

![4](http://cdn.go99.top/docs/microservices/dapr/actors4.png)
