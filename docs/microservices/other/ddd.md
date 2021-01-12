# DDD领域驱动设计

注意事项：

* 聚合根下的子实体通过聚合根一次性全部加载（聚合根+子实体构成完成的聚合）
* 对子实体的所有操作都必须通过聚合根（不能越过聚合根直接操作子实体）
* 不同聚合根通过领域事件互相影响
* 由于聚合根动作引起的集成事件通过领域事件发送，由于用户业务操作引起的可以直接在command handler直接使用集成事件

## CQRS & ES

在使用CQS原则对Service API进行切分后，进一步根据读写职责不同，把领域模型切分为Command端与Query端两个部分，便得到了下图所示的CQRS模式（命令与查询职责分离，Command and Query Responsibility Segregation）。Command端与Query端共享同一份持久数据，但Command端只写入状态，Query端只读取状态。

一方面，从CQRS模式的结构看，系统状态变化都发生在Command端，因此只有Command端掌握着具体是哪些内容发生了变化，如果把变化的这些内容封装在一起，表明系统“刚刚发生了哪些变化”，就得到了所谓的事件Event。

反观Query端，查询返回的总是反映系统当前状态的静态数据。根据“当前状态 + 变化 = 新的状态”，如果能从Command端得到“变化”，就能得到变化后的“新的状态”。而Event正好符合“变化”的定义，所以选择从Command端将Event推送到Query端，Query端根据Event刷新状态，就能保证两端的模型都反映系统的最终状态，达到最终一致性。

另一方面，在解决了取得最终一致性的难题后，还得设法改进数据的持久化。

首先能确定的是，从Query端查询得到的总是系统当前状态的静态数据，所以从传统架构一直沿用到CQRS模式下的DTO方案依然有效。但是，由于这样的DTO直接映射领域对象，会暴露领域对象细节，而且这种映射会产生阻抗失配，导致过多的间接查询和多聚合数据的联结，使优化查询变得非常困难。所以，为提高查询效率，可以采取类似关系数据库中“视图”的方式，直接面向数据模型，采用一切可使用的数据库技术，构造一个Thin Read Layer。

再是Command端的持久化。根据“初始状态 + 若干次变化 = 当前状态”，在初始状态上依次叠加每一次变化，同样能得到当前状态。其中聚合对象实例的初始状态是固定的，每一次变化即处理Command后产出的事件Event，那么只要保存好所有发生过的历史事件，就能从初始对象重现（Replay）到当前状态。所以，Command端的持久化最终演变成事件历史的持久化，这便是事件存储（Event Storage）。

最终，事件的产生、存储、推送和重现，即构成了完整的事件溯源（Event Sourcing）。

在CQRS与Event Sourcing的支持下，系统架构也相应地变成了下图这样：

![1](http://cdn.go99.top/docs/microservices/other/ddd1.jpg)

CQRS使Event Sourcing成为改变和存储系统状态的核心机制。在这种模式下，由Application Service Layer统揽整个业务流程。Service首先从Query端查询系统状态，为执行Command准备好上下文环境；然后Service构造好Command，并发送给利用Repository.GetById()加载（重现）得到的聚合对象实例；接着聚合对象实例使用内置的Command Handler完成命令处理，更新聚合状态，并产生Event，在其被持久化的同时推送往Query端；Query端收到Event后，对其自身维护的系统状态也进行更新，达到与Command端同样的一致，以迎接下一次Service的查询。

从上述过程可知，Service是一切活动的发起者和组织者，Command的执行环境均由Service准备，Command是活动内容的承载者，聚合是活动的执行者，而Event是活动的推动者。

同时要注意，Command本质是对领域模型的一种请求，可能会被模型拒绝执行（悲伤路径）。而Event则不同，它代表着系统刚刚完成了某项任务，必定发生了某种变化。Event的用语必定是肯定的过去式，而不仅仅是某个事实，比如应该是OpenFileFailed，而不是FileNotFound。

实现细节：

Command的常见实现如下所示，其中AggregateId指示是由哪个聚合对象实例处理，Version指示在将Command发送给该聚合时聚合的最新版本，以备发生并发冲突时进行检验。
```csharp
class Command {
  Guid Id;
  Guid AggregateId;
  Int Version;
  // 包含其他信息的字段
}
```
Event的常见实现与Command基本相同，区别只是AggregateId指示是由哪个聚合对象实例产生的Event，Version表示Event发生时聚合对象实例的版本。

聚合Aggregate是Command的处理器和Event的发布器，其Command Handler与Event Handler的基本结构如下：
```csharp
class Aggregate {
  public readonly Guid AggregateId;
  public readonly List<Event> UnsavedEvents = new List<Event>();
  public Int Version = 0;

  public void HandleCommand(Command c) {
    if (!Valid(c))
      throw new AggregateException();

    var e = new SomeEvent(AggregateId, ...);
    this.HandleEvent(e);    
    e.Version = this.Version;
    this.UnsavedEvents.Add(e);    
    
    DoAnythingWithSideEffect();
  }

  void HandelEvent(Event  e) {
    ModifyState();
    this.Version ++;    
  }

  public void Replay(List<Event> events) {
    foreach(var e in events) {
      this.HandleEvent(e);
    }
  }
}
```

Repository与Event/Data Storage: 
 > Repository是聚合的集合，其主要方法GetById()负责返回聚合对象实例给调用者。当该实例尚未在内存当中之时，将从Event Storage读取所有对应该聚合Id的事件，接着构造一个空白的初始对象，利用获取的历史事件按版本先后重现到对象的最新版本，此后便可直接从内存中返回实例，而不再需要重复上述加载过程了，这被称为In-Memory特性。

重现部分的简单实现，参见前述Aggregate.Replay()

Event Storage是一个追加型的数据库。由于事件总与聚合对象实例相关，所以一个以聚合对象实例的Id为key、事件序列化流为value的Key-Value型NoSQL数据库将非常适合这样的场景。当然，传统的关系数据库也完全能胜任。数据库的结构也很简单，每条Event作为一条记录，大致为下面这样的结构。其中，Data字段的序列化除采用二进制流的方式，也可以使用Json或者XML等结构化文本方式。而且除上述字段外，还可附加Time Stamp等字段，这给系统回溯到指定时点提供了最基本的数据支持。

|Name|Type|Content|
|---|----|---|
Id|Guid|Event的Id，方便索引
AggregateId|Guid|产出该事件的聚合对象实例Id
Version|Integer|该事件的版本编号
Data|Blob|Event序列化得到的二进制流

而在Query端，其数据主要目的为前端展示，所以在数据模型设计上，更趋向于“面向界面”或“面向查询”，需要一次性加载呈现所需的全部数据，所以私以为MongoDB这样的文档型NoSQL数据库非常符合Query端的情况。

* **延迟加载与快照**

在传统架构下，Repository从Data Storage中加载聚合对象实例，通常很纠结于是否使用延迟加载（Lazy Load）。

而在Event Sourcing条件下，因为写模型本质是历史的叠加，每一次操作都是追加事件，而不是刷新整个对象，所以延迟加载没有存在必要。

但是，每次从Event Storage读取所有属于某个聚合对象实例的事件然后进行重现，仍是可以改进的，方法就是使用快照（Snapshot）。

快照就是特定版本的聚合对象实例，所以构建快照的方法和重现获得一个聚合对象实例是类似的：构造一个空白的初始对象，利用获取的历史事件，按版本先后重现到特定版本。正因为快照等价于某个版本的聚合对象，所以快照的生成可以完全独立并行于系统运行，而且可以在快照基础上重现其后续版本的事件，以得到更新版本的聚合对象实例。

![2](http://cdn.go99.top/docs/microservices/other/ddd2.jpg)