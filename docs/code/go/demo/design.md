# Go设计模式

## 单例

```go
type Conn struct {
	Addr  string
	State int
}

var c *Conn
var once sync.Once

func setInstance() {
	fmt.Println("setup")
	c = &Conn{"127.0.0.1:8080", 1}
}

func doPrint() {
	once.Do(setInstance)
	fmt.Println(c)
}

func loopPrint() {
	for i := 0; i < 10; i++ {
		go doprint()
	}
}
```

Once源码

```go
type Once struct {
	done uint32
	m    Mutex
}

func (o *Once) Do(f func()) {
	if atomic.LoadUint32(&o.done) == 0 {
		o.doSlow(f)
	}
}

func (o *Once) doSlow(f func()) {
	o.m.Lock()
	defer o.m.Unlock()
	if o.done == 0 {
		defer atomic.StoreUint32(&o.done, 1)
		f()
	}
}
```

## 函数式选项模式 - 参数可选

在设计一个函数时，当存在配置参数较多，同时参数可选时，函数式选项模式是一个很好的选择，它既有为不熟悉的调用者准备好的默认配置，还有为需要定制的调用者提供自由修改配置的能力，且支持未来灵活扩展属性。

```go
type getoptions struct {
   cluster string
   addr    string
   auth    bool
}

// GetOption represents option of get op
type GetOption func(o *getoptions)

// WithCluster sets cluster of get context
func WithCluster(cluster string) GetOption {
   return func(o *getoptions) {
      o.cluster = cluster
   }
}

// WithAddr sets addr for http request instead get from consul
func WithAddr(addr string) GetOption {
   return func(o *getoptions) {
      o.addr = addr
   }
}
// WithAuth Set the GDPR Certify On.
func WithAuth(auth bool) GetOption {
   return func(o *getoptions) {
      o.auth = auth
   }
}

// NewBConfigClient creates instance of BConfigClient
func NewBConfigClient(opts ...GetOption) *BConfigClient {
   oo := getoptions{cluster: defaultCluster}
   for _, op := range opts {
      op(&oo)
   }
   c := &BConfigClient{oo: oo}
   ......
   return c
}
```

## 装饰模式 - 扩展功能

当已有类功能不够便捷时，通过组合的方式实现对已有类的功能扩展，实现了对已有代码的黑盒复用。

在下面的`DemotionClient`结构体中组合了`ClientV2`的引用，对外提供了`GetInt`和`GetBool`两个方法，包掉了对原始 `string` 类型的转换，对外提供了更为便捷的方法。

```go
//// ClientV2
// Get 获取key对应的value.
func (c *ClientV2) Get(ctx context.Context, key string) (string, error)

//// DemotionClient
type DemotionClient struct {
   *ClientV2
}

func NewDemotionClient(serviceName string, config *ConfigV2) (*DemotionClient, error) {
   clientV2, err := NewClientV2(serviceName, config)
   if err != nil {
      return nil, err
   }
   client := &DemotionClient{clientV2}
   return client, nil
}

// GetInt parse value to int
func (d *DemotionClient) GetInt(ctx context.Context, key string) (int, error) {
   value, err := d.Get(ctx, key)
   if err != nil {
      return 0, err
   }
   ret, err := strconv.Atoi(value)
   if err != nil {
      return 0, fmt.Errorf("GetInt Error: Key = %s; value = %s is not int", key, value)
   }
   return ret, nil
}

// GetBool parse value to bool:
//     if value=="0" return false;
//     if value=="1" return true;
//     if value!="0" && value!="1" return error;
func (d *DemotionClient) GetBool(ctx context.Context, key string) (bool, error) {
   ......
   // 类似GetInt方法
}
```

## 工厂模式

将对象复杂的构造逻辑隐藏在内部，调用者不用关心细节，同时集中变化。

`NewLogCounter`方法通过入参 `LogMode` 枚举类型即可生成不同规格配置的`LogCounter`，可以无需再去理解 `TriggerLogCount`、`TriggerLogDuration`、`Enable` 的含义。

```go
type LogMode string

const (
   LowMode       LogMode = "low"
   MediumMode    LogMode = "medium"
   HighMode      LogMode = "high"
   AlwaysMode    LogMode = "always"
   ForbiddenMode LogMode = "forbidden"
)

// In TriggerLogDuration, if error times < TriggerLogCount pass, else print error log.
type LogCounter struct {
   FirstLogTime       time.Time
   LogCount           int
   mu                 sync.RWMutex
   TriggerLogCount    int
   TriggerLogDuration time.Duration
   Enable             bool // If Enable is true, start the rule.
}

func NewLogCounter(logMode LogMode, triggerLogCount int, triggerLogDuration time.Duration) *LogCounter {
   logCounter := &LogCounter{}
   switch logMode {
   case AlwaysMode:
      logCounter.Enable = false
   case LowMode:
      logCounter.Enable = true
      logCounter.TriggerLogCount = 5
      logCounter.TriggerLogDuration = 60 * time.Second
   case MediumMode:
      logCounter.Enable = true
      logCounter.TriggerLogCount = 5
      logCounter.TriggerLogDuration = 300 * time.Second
   case HighMode:
      logCounter.Enable = true
      logCounter.TriggerLogCount = 3
      logCounter.TriggerLogDuration = 300 * time.Second
   case ForbiddenMode:
      logCounter.Enable = true
      logCounter.TriggerLogCount = 0
   }
   if triggerLogCount > 0 {
      logCounter.Enable = true
      logCounter.TriggerLogCount = triggerLogCount
      logCounter.TriggerLogDuration = triggerLogDuration
   }
   return logCounter
}

func (r *LogCounter) CheckPrintLog() bool
func (r *LogCounter) CheckDiffTime(lastErrorTime, newErrorTime time.Time) bool
```

## 建造者模式 - 构建复杂对象

使用多个简单的对象一步一步构建成一个复杂的对象。工厂方法模式注重的是整体对象的创建方法，而建造者模式注重的是部件构建的过程，旨在通过一步一步地精确构造创建出一个复杂的对象。

以“对路径前缀为 `/wechat` 的请求开启微信认证中间件”为例子，`Matcher` 函数不用开发者从头实现一个，只需要初始化 `SimpleMatcherBuilder` 对象，设置请求前缀后，直接 `Build` 出来即可，它将复杂的匹配逻辑隐藏在内部，非常好用。

```go
// Conditional handlers chain
type CondHandlersChain struct {
   // 匹配函数
   Matcher func(method, path string) bool
   // 命中匹配后，执行的处理函数
   Chain   HandlersChain
}

// 对路径前缀为 `/wechat` 的请求开启微信认证中间件
mw1 := apix.CondHandlersChain{
   Matcher: new(apix.SimpleMatcherBuilder).PrefixPath("/wechat").Build(),
   Chain:   apix.HandlersChain{wxsession.NewMiddleware()},
}

// 注册中间件
e.CondUse(mw1)
```

`SimpleMatcherBuilder`是一个建造者，它实现了`MatcherBuilder`接口，该类支持 `method`、`pathPrefix` 和 `paths` 三种匹配方式，业务方通过`Method()`、`PrefixPath()`、`FullPath()`三个方法的组合调用即可构造出期望的匹配函数。

```go
type MatcherBuilder interface {
   Build() func(method, path string) bool
}

var _ MatcherBuilder = (*SimpleMatcherBuilder)(nil)

// SimpleMatcherBuilder build a matcher for CondHandlersChain.
// An `AND` logic will be applied to all fields(if provided).
type SimpleMatcherBuilder struct {
   method     string
   pathPrefix string
   paths      []string
}

func (m *SimpleMatcherBuilder) Method(method string) *SimpleMatcherBuilder {
   m.method = method
   return m
}

func (m *SimpleMatcherBuilder) PrefixPath(path string) *SimpleMatcherBuilder {
   m.pathPrefix = path
   return m
}

func (m *SimpleMatcherBuilder) FullPath(path ...string) *SimpleMatcherBuilder {
   m.paths = append(m.paths, path...)
   return m
}

func (m *SimpleMatcherBuilder) Build() func(method, path string) bool {
   method, prefix := m.method, m.pathPrefix
   paths := make(map[string]struct{}, len(m.paths))
   for _, p := range m.paths {
      paths[p] = struct{}{}
   }

   return func(m, p string) bool {
      if method != "" && m != method {
         return false
      }
      if prefix != "" && !strings.HasPrefix(p, prefix) {
         return false
      }

      if len(paths) == 0 {
         return true
      }

      _, ok := paths[p]
      return ok
   }
}

var _ MatcherBuilder = (AndMBuilder)(nil)
var _ MatcherBuilder = (OrMBuilder)(nil)
var _ MatcherBuilder = (*NotMBuilder)(nil)
var _ MatcherBuilder = (*ExcludePathBuilder)(nil)
......
```

## 责任链模式 - 中间件

当业务处理流程很长时，可将所有请求的处理者通过前一对象记住其下一个对象的引用而连成一条链；当有请求发生时，可将请求沿着这条链传递，直到没有对象处理它为止。

请求进来时，一层一层的通过中间件执行`Next`函数进入到你设置的下一个中间件中，并且可以通过`Context`对象一直向下传递下去，当到达最后一个中间件的时候，又向上返回到最初的地方。

开始执行时，是调用`Context`的`Next`函数，遍历每个`HandlerFunc`，然后将`Context`自身的引用传入，`index`是记录当前执行到第几个中间件，当过程中出现不满足继续进行的条件时，可以调用`Abort()`来终止流程。

```go
// 定义中间件的接口
type HandlerFunc func(*Context)

// 将一组处理函数组合成一个处理链条
type HandlersChain []HandlerFunc

// 处理的上下文
type Context struct {
    // ...

    // handlers 是一个包含执行函数的数组
    // type HandlersChain []HandlerFunc
    handlers HandlersChain
    // index 表示当前执行到哪个位置了
    index    int8

    // ...
}

// Next 会按照顺序将一个个中间件执行完毕
// 并且 Next 也可以在中间件中进行调用，达到请求前以及请求后的处理
func (c *Context) Next() {
   c.index++
   for c.index < int8(len(c.handlers)) {
      if handler := c.handlers[c.index]; handler != nil {
         handler(c)
      }
      c.index++
   }
}

// 停止中间件的循环, 通过将索引后移到abortIndex实现。
func (c *Context) Abort() {
   if c.IsDebugging() && c.index < int8(len(c.handlers)) {
      handler := c.handlers[c.index]
      handlerName := nameOfFunction(handler)
      c.SetHeader("X-APIX-Aborted", handlerName)
   }

   c.index = abortIndex
}


//// 检查用户是否登录的中间件实现
// RequireLogin 检查用户是否登陆成功。如果不是，终止请求。
func RequireLogin(c *apix.Context) {
   if c.Header(agwconsts.Key_LoaderSessionError) == "1" {
      hsuite.AbortWithBizCode(c, bizstat.APIErrRPCFailed)
      return
   }

   if c.UserId() == 0 {
      hsuite.AbortWithBizCode(c, bizstat.APIErrSessionExpired)
      return
   }
}
//// 注册中间件
func main() {
   e := apiservice.Default(
      hsuite.WithBizCodeErrs(consts.BizCodeErrs...), // user-defined error code
   )
   // 可通过 e.Use(), e.CondUse() 注册中间件
   e.Use(devicesession.AGWSessionSuccess, devicesession.NewHWSessionMiddleware(), middleware.Tracing)
   ......
   apiservice.Run()
}
```

## 观察者模式 - DI

依赖注入，控制反转，解耦观察者和被观察者，尤其是存在多个观察者的场景。

`TccClient`对外提供`AddListener`方法，允许业务注册对某 `key` 变更的监听，同时开启定时轮询，如果 `key` 的值与上次不同就回调业务的 `callback` 方法。观察者是调用 `AddListener` 的发起者，被观察者是 `key`。`Callback`可以看作只有一个函数的接口，不依赖于具体的实现，而是依赖于抽象，同时`Callback`对象不是在内部构建的，而是在运行时传入的，让被观察者不再依赖观察者，通过依赖注入达到控制反转的目的。

```go
// Callback for listener，外部监听者需要实现该方法传入，用于回调
type Callback func(value string, err error)

// 一个监听者实体
type listener struct {
   key             string
   callback        Callback
   lastVersionCode string
   lastValue       string
   lastErr         error
}

// 检测监听的key是否有发生变化，如果有，则回调callback函数
func (l *listener) update(value, versionCode string, err error) {
   if versionCode == l.lastVersionCode && err == l.lastErr {
      return
   }
   if value == l.lastValue && err == l.lastErr {
      // version_code updated, but value not updated
      l.lastVersionCode = versionCode
      return
   }
   defer func() {
      if r := recover(); r != nil {
         logs.Errorf("[TCC] listener callback panic, key: %s, %v", l.key, r)
      }
   }()
   l.callback(value, err)
   l.lastVersionCode = versionCode
   l.lastValue = value
   l.lastErr = err
}

// AddListener add listener of key, if key's value updated, callback will be called
func (c *ClientV2) AddListener(key string, callback Callback, opts ...ListenOption) error {
   listenOps := listenOptions{}
   for _, op := range opts {
      op(&listenOps)
   }

   listener := listener{
      key:      key,
      callback: callback,
   }
   if listenOps.curValue == nil {
      listener.update(c.getWithCache(context.Background(), key))
   } else {
      listener.lastValue = *listenOps.curValue
   }

   c.listenerMu.Lock()
   defer c.listenerMu.Unlock()
   if _, ok := c.listeners[key]; ok {
      return fmt.Errorf("[TCC] listener already exist, key: %s", key)
   }
   c.listeners[key] = &listener
   // 一个client启动一个监听者
   if !c.listening {
      go c.listen()
      c.listening = true
   }
   return nil
}

// 轮询监听
func (c *ClientV2) listen() {
   for {
      time.Sleep(c.listenInterval)
      listeners := c.getListeners()
      for key := range listeners {
         listeners[key].update(c.getWithCache(context.Background(), key))
      }
   }
}

// 加锁防止多线程同时修改listeners，同时拷贝一份map在循环监听时使用。
func (c *ClientV2) getListeners() map[string]*listener {
   c.listenerMu.Lock()
   defer c.listenerMu.Unlock()
   listeners := make(map[string]*listener, len(c.listeners))
   for key := range c.listeners {
      listeners[key] = c.listeners[key]
   }
   return listeners
}
```

## 策略模式 - 替代if

支持不同策略的灵活切换，避免多层控制语句的不优雅实现【多个`if,else`】

通常的做法是定义了一个公共接口，各种不同的算法以不同的方式实现这个接口，环境角色使用这个接口调用不同的算法。

GORM 将 SQL 的拼接过程，拆分成了一个个小的子句，这些子句统一实现`clause.Interface`这个接口，然后各自在`Build`方法中实现自己的构造逻辑。

```go
//// 策略定义
// Interface clause interface
type Interface interface {
   Name() string
   Build(Builder)
   MergeClause(*Clause)
}

//// 策略实现
// Limit
type Limit struct {
   Limit  int
   Offset int
}

// Build build where clause
func (limit Limit) Build(builder Builder) {
   if limit.Limit > 0 {
      builder.WriteString("LIMIT ")
      builder.WriteString(strconv.Itoa(limit.Limit))
   }
   if limit.Offset > 0 {
      if limit.Limit > 0 {
         builder.WriteString(" ")
      }
      builder.WriteString("OFFSET ")
      builder.WriteString(strconv.Itoa(limit.Offset))
   }
}

// Name where clause name
func (limit Limit) Name() string {......}
// MergeClause merge limit by clause
func (limit Limit) MergeClause(clause *Clause) {......}

// orderby
type OrderByColumn struct {
   Column  Column
   Desc    bool
   Reorder bool
}

type OrderBy struct {
   Columns    []OrderByColumn
   Expression Expression
}

// Build build where clause
func (orderBy OrderBy) Build(builder Builder) {
   if orderBy.Expression != nil {
      orderBy.Expression.Build(builder)
   } else {
      for idx, column := range orderBy.Columns {
         if idx > 0 {
            builder.WriteByte(',')
         }

         builder.WriteQuoted(column.Column)
         if column.Desc {
            builder.WriteString(" DESC")
         }
      }
   }
}

// Name where clause name
func (limit Limit) Name() string {......}
// MergeClause merge order by clause
func (limit Limit) MergeClause(clause *Clause) {......}

//// 业务调用方
db.WithContext(ctx).
    Model(&Course{}).
    Order("course_id DESC").
    Limit(0).
    Offset(100)

//// 业务定义方
// Limit specify the number of records to be retrieved
func (db *DB) Limit(limit int) (tx *DB) {
   tx = db.getInstance()
	 // 这里加入 Limit 实现的 clause.Interface
   tx.Statement.AddClause(clause.Limit{Limit: limit})
   return
}

// Offset specify the number of records to skip before starting to return the records
func (db *DB) Offset(offset int) (tx *DB) {
   tx = db.getInstance()
   tx.Statement.AddClause(clause.Limit{Offset: offset})
   return
}


// Order specify order when retrieve records from database
//     db.Order("name DESC")
//     db.Order(clause.OrderByColumn{Column: clause.Column{Name: "name"}, Desc: true})
func (db *DB) Order(value interface{}) (tx *DB) {
   tx = db.getInstance()

   switch v := value.(type) {
   case clause.OrderByColumn:
      tx.Statement.AddClause(clause.OrderBy{
         Columns: []clause.OrderByColumn{v},
      })
   case string:
      if v != "" {
         tx.Statement.AddClause(clause.OrderBy{
            Columns: []clause.OrderByColumn{{
               Column: clause.Column{Name: v, Raw: true},
            }},
         })
      }
   }
   return
}
```