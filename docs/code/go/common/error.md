# Go-Error

## 错误、异常介绍

### Error

错误是程序中可能出现的问题，比如连接数据库失败，连接网络失败等，在程序设计中，错误处理是业务的一部分。

Go内建一个error接口类型作为go的错误标准处理

```go
// 接口定义
type error interface {
   Error() string
}


// 实现
type errorString struct {
   s string
}

func New(text string) error {
   return &errorString{text}
}

func (e *errorString) Error() string {
   return e.s
}
```

### panic

对于真正意外的情况，那些表示不可恢复的程序错误，不可恢复才使用panic。对于其他的错误情况，我们应该是期望使用error来进行判定。

go源代码很多地方写panic(底层库), 但是`业务代码`不要主动写panic，理论上panic只存在于`server启动阶段`，比如`config文件解析失败`，`端口监听失败`等等，所有业务逻辑禁止主动panic，所有异步的goroutine都要用`recover`去处理。

## 处理错误的三种方式

### 经典Go逻辑

* 如果业务逻辑不是很清楚，推荐使用

```go

type ZooTour interface {
    Enter() error 
    VisitPanda(panda *Panda) error 
    Leave() error
}

// 分步处理，每个步骤可以针对具体返回结果进行处理
func Tour(t ZooTour1, panda *Panda) error {
    if err := t.Enter(); err != nil {
        return errors.WithMessage(err, "Enter failed.")
    }
    if err := t.VisitPanda(); err != nil {
        return errors.WithMessage(err, "VisitPanda failed.")
    }
    // ...

    return nil
}
```

### 屏蔽过程中的error的处理

* 代码很少去改动，类似标准库，推荐使用

将error保存到`对象内部`，处理逻辑交给每个方法，本质上仍是顺序执行。标准库的`bufio`、`database/sql`包中的`Rows`等都是这样实现的

```go

type ZooTour interface {
    Enter() error
    VisitPanda(panda *Panda) error
    Leave() error
    Err() error
}

func Tour(t ZooTour, panda *Panda) error {

    t.Enter()
    t.VisitPanda(panda)
    t.Leave()
    
    // 集中编写业务逻辑代码,最后统一处理error
    if err := t.Err(); err != nil {
        return errors.WithMessage(err, "ZooTour failed")
    }
    return nil
}
```

### 利用函数式编程延迟运行

* 比较复杂的场景，复杂到抽象成一种设计模式

分离关注点-遍历访问用数据结构定义运行顺序，根据场景选择，如顺序、逆序、二叉树树遍历等。运行逻辑将代码的控制流逻辑抽离，灵活调整。`kubernetes`中的`visitor`对此就有很多种扩展方式，分离了数据和行为

```go
// 数据
type ZooTour interface {
    Enter() error
    VisitPanda(panda *Panda) error
    Leave() error
    Err() error
}

// 有点类似option模式
type MyFunc func(ZooTour) error

type Walker interface {
    Next MyFunc
}

type SliceWalker struct {
    index int 
    funs []MyFunc
}

func (w SliceWalker) Next() MyFunc {
    // todo
}

// 数据行为分离
func NewEnterFunc() MyFunc {
    return func(t ZooTour) error {
        // 行为
        return t.Enter()
    }
}

func BreakOnError(t ZooTour, walker Walker) error {
    for {
        f := walker.Next() 
        if f == nil {
            break
        }
        if err := f(t); err := nil {
          // 遇到错误break或者continue继续执行  
      }
    }
}
```

## 分层下的Error Handling

`dao->service->controller`

最简单的处理方式（分层开发导致的处处打印日志，难以获取详细的堆栈关联，根因丢失）：

```go

// controller
if err := mode.ParamCheck(param); err != nil {
    log.Errorf("param=%+v", param)
    return errs.ErrInvalidParam
}

return mode.ListTestName("")

// service
_, err := dao.GetTestName(ctx, settleId)
    if err != nil {
    log.Errorf("GetTestName failed. err: %v", err)
    return errs.ErrDatabase
}

// dao
if err != nil {
    log.Errorf("GetTestDao failed. uery: %s error(%v)", sql, err)
}
```

* 推荐使用 `github.com/pkg/errors`,并且只在最顶层处理错误

```go

// 新生成一个错误, 带堆栈信息
func New(message string) error

// 只附加新的信息
func WithMessage(err error, message string) error

// 只附加调用堆栈信息
func WithStack(err error) error

// 同时附加堆栈和信息
func Wrapf(err error, format string, args ...interface{}) error

// 获得最根本的错误原因
func Cause(err error) error


////// Dao层使用Wrap上抛错误
if err != nil {
    if errors.Is(err, sql.ErrNoRows) {
        return nil, errors.Wrapf(ierror.ErrNotFound, "query:%s", query)
    }
    return nil, errors.Wrapf(ierror.ErrDatabase,
        "query: %s error(%v)", query, err)
}

////// Service层追加信息
bills, err := a.Dao.GetName(ctx, param)
if err != nil {
    return result, errors.WithMessage(err, "GetName failed")
}

////// MiddleWare统一打印错误日志

// 请求响应组装
func (Format) Handle(next ihttp.MiddleFunc) ihttp.MiddleFunc {
    return func(ctx context.Context, req *http.Request, rsp *ihttp.Response) error {
        format := &format{Time: time.Now().Unix()}
        err := next(ctx, req, rsp)
        format.Data = rsp.Data
        if err != nil {
            format.Code, format.Msg = errCodes(ctx, err)
        }
        rsp.Data = format
        return nil
    }
}

// 获取错误码
func errCodes(ctx context.Context, err error) (int, string) {
    if err != nil {
        log.CtxErrorf(ctx, "error: [%+v]", err)
    }
    var myError = new(erro.IError)
    if errors.As(err, &myError) {
        return myError.Code, myError.Msg
    }

    return code.ServerError, i18n.CodeMessage(code.ServerError)
}
```

## errgroup集中错误处理

### 官方包

`golang.org/x/sync/errgroup`

通常，在写业务代码性能优化时经常将一个通用的父任务拆成几个小任务并发执行。此时需要将一个大的任务拆成几个小任务并发执行，来提高QPS，我们需要再业务代码里嵌入以下逻辑，但这种方式存在问题：

* 每个请求都开启goroutinue，会有一定的性能开销。
* 野生的goroutinue，生命周期管理比较困难。
* 收到类似SIGQUIT信号时，无法平滑退出。

```go
type Group
    // 通过WithContext可以创建一个带取消的Group
    func WithContext(ctx context.Context) (*Group, context.Context)
    // Go方法传入一个func() error内部会启动一个goroutine去处理
    func (g *Group) Go(f func() error)
    // Wait类似WaitGroup的Wait方法，等待所有的goroutine结束后退出，返回的错误是一个出错的err。
    func (g *Group) Wait() error
```

代码示例：

```go
func TestErrgroup() {
   eg, ctx := errgroup.WithContext(context.Background())

   for i := 0; i < 100; i++ {
      i := i
      eg.Go(func() error {
         time.Sleep(2 * time.Second)
         select {
         case <-ctx.Done():
            fmt.Println("Canceled:", i)
            return nil
         default:
            fmt.Println("End:", i)
            return nil
         }})
    }

   if err := eg.Wait(); err != nil {
      log.Fatal(err)
   }
}
```

### B站拓展包

`https://github.com/go-kratos/kratos/blob/v0.3.3/pkg/sync/errgroup/errgroup.go`

* B站拓展包主要解决了官方ErrGroup的几个痛点：控制并发量、Recover住协程的Panic并打出堆栈信息。
* Go方法并发的去调用在量很多的情况下会产生死锁，因为他的切片不是线程安全的，如果要并发，并发数量一定不能过大，一旦动用了任务切片，那么很有可能就在wait方法那里hold住了。这个可以加个锁来优化。
* Wg watigroup只在Go方法中进行Add()，并没有控制消费者的并发，Wait的逻辑就是分发者都分发完成，直接关闭管道，让消费者并发池自行销毁，不去管控，一旦逻辑中有完全hold住的方法那么容易产生内存泄漏。

```go
type Group struct {
   err     error
   wg      sync.WaitGroup
   errOnce sync.Once

   // 控制并发初始化函数签名管道
   workerOnce sync.Once
   // 多出了一个函数签名管道，使用管道可以保证并发无锁
   ch         chan func(ctx context.Context) error
   // 一个函数签名切片  
   chs        []func(ctx context.Context) error

   ctx    context.Context
   cancel func()
}

// 把Context直接放入了返回的Group结构，返回仅返回一个Group结构指针
func WithContext(ctx context.Context) *Group {
   return &Group{ctx: ctx}
}

// Go方法可以看出并不是直接起协程的（如果管道已经初始化好了），优先将函数签名放入管道，管道如果满了就放入切片。
func (g *Group) Go(f func(ctx context.Context) error) {
   g.wg.Add(1)
   if g.ch != nil {
      select {
      // 将待处理函数放入管道
      case g.ch <- f:
      default:
         // 如果管道满了，先暂存到切片中
         g.chs = append(g.chs, f)
      }
      return
   }
   // 没有初始化切片，直接用协程去执行
   go g.do(f)
}

// GOMAXPROCS函数其实是起了一个并发池来控制协程数量，传入最大协程数量进行并发消费管道里的函数签名：
func (g *Group) GOMAXPROCS(n int) {
   if n <= 0 {
      panic("errgroup: GOMAXPROCS must great than 0")
   }
   g.workerOnce.Do(func() {
      // 初始化一个n长的管道
      g.ch = make(chan func(context.Context) error, n)
      // 启动n个协程消费管道中的函数
      for i := 0; i < n; i++ {
         go func() {
            for f := range g.ch {
               g.do(f)
            }
         }()
      }
   })
}

```


