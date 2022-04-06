# Go-Context

## Context 使用规则

* 勿将 Context 作为 struct 的字段使用，而是对每个使用其的函数分别作参数使用，其需定义为函数或方法的第一个参数，一般叫作 ctx；
* 勿对 Context 参数传 `nil`，未想好的使用那个 Context，请传`context.TODO`；
* 使用 context 传值仅可用作请求域的数据，其它类型数据请不要滥用；
* 同一个 Context 可以传给使用其的多个 goroutine，且 Context 可被多个 goroutine 同时安全访问。
* 当需要在多个 `goroutine` 中传递上下文信息时，可以使用 `Context` 实现
* `Context` 除了用来传递上下文信息，还可以用于传递终结执行子任务的相关信号，中止多个执行子任务的 `goroutine`

## http服务使用小结

在 Go 服务端，每个进入的请求会被其所属 `goroutine` 处理。

而每个请求对应的 `Handler`，常会启动额外的 `goroutine` 进行数据查询或 PRC 调用等。

而当请求返回时，这些额外创建的 goroutine 需要及时回收。而且，一个请求对应一组请求域内的数据可能会被该请求调用链条内的各 goroutine 所需要。

例如，在如下代码中，当请求进来时，Handler 会创建一个监控 goroutine，其会每隔 1s 打印一句“req is processing”。

```go
func StartHttp() {
	http.HandleFunc("/echo", func(rw http.ResponseWriter, r *http.Request) {
		go func() {
			for range time.Tick(time.Second) {
				fmt.Println("req is processing")
			}
		}()
		time.Sleep(3 * time.Second)
		rw.Write([]byte("hello world"))
	})
	log.Fatalln(http.ListenAndServe(":8887", nil))
}
```

假定请求需耗时 3s，即请求在 3s 后返回，我们期望监控 goroutine 在打印 3 次“req is processing”后即停止。但运行发现，监控 goroutine 打印 3 次后，其仍不会结束，而会一直打印下去。

问题出在创建监控 `goroutine` 后，未对其生命周期作控制，下面我们使用 `context` 作一下控制，即监控程序打印前需检测`r.Context()`是否已经结束，若结束则退出循环，即结束生命周期。

```go
func StartHttp() {
	http.HandleFunc("/echo", func(rw http.ResponseWriter, r *http.Request) {
		go func() {
			for range time.Tick(time.Second) {
				select {
				case <-r.Context().Done():
					fmt.Println("req is ending")
					return
				default:
					fmt.Println("req is processing")
				}
			}
		}()
		time.Sleep(3 * time.Second)
		rw.Write([]byte("hello world"))
	})
	log.Fatalln(http.ListenAndServe(":8887", nil))
}
```

context 包可以提供一个请求从 API 请求边界到各 goroutine 的请求域数据传递、取消信号及截止时间等能力。

## Context类型

```go
// A Context carries a deadline, cancelation signal, and request-scoped values
// across API boundaries. Its methods are safe for simultaneous use by multiple
// goroutines.
type Context interface {
    // Done returns a channel that is closed when this Context is canceled
    // or times out.
    // Done 方法返回一个 channel，当 Context 取消或到达截止时间时，该 channel 即会关闭。Err 方法返回 Context 取消的原因。
    Done() <-chan struct{}

    // Err indicates why this context was canceled, after the Done channel
    // is closed.
    Err() error

    // Deadline returns the time when this Context will be canceled, if any.
    // 若有截止时间，Deadline 方法可以返回该 Context 的取消时间。
    Deadline() (deadline time.Time, ok bool)

    // Value returns the value associated with key or nil if none.
    // Value 允许 Context 携带请求域内的数据，该数据访问必须保障多个 goroutine 同时访问的安全性。
    Value(key interface{}) interface{}
}
```

`Context` 自己没有 `Cancel` 方法，而且 `Done channel` 仅用来接收信号：接收取消信号的函数不应同时是发送取消信号的函数。父 `goroutine` 启动子 `goroutine` 来做一些子操作，而子 `goroutine` 不应用来取消父 `goroutine`。

Context 是安全的，可被多个 goroutine 同时使用。一个 Context 可以传给多个 goroutine，而且可以给所有这些 goroutine 发取消信号。

## 衍生 Context

```go
// Background returns an empty Context. It is never canceled, has no deadline,
// and has no values. Background is typically used in main, init, and tests,
// and as the top-level Context for incoming requests.
func Background() Context

// WithCancel returns a copy of parent whose Done channel is closed as soon as
// parent.Done is closed or cancel is called.
func WithCancel(parent Context) (ctx Context, cancel CancelFunc)

// A CancelFunc cancels a Context.
type CancelFunc func()

// A CancelFunc cancels a Context.
type CancelFunc func()

// WithTimeout returns a copy of parent whose Done channel is closed as soon as
// parent.Done is closed, cancel is called, or timeout elapses. The new
// Context's Deadline is the sooner of now+timeout and the parent's deadline, if
// any. If the timer is still running, the cancel function releases its
// resources.
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)

// WithValue returns a copy of parent whose Value method returns val for key.
func WithValue(parent Context, key interface{}, val interface{}) Context
```

context 包提供从已有 Context 衍生新的 Context 的能力。这样即可形成一个 Context 树，当父 Context 取消时，所有从其衍生出来的子 Context 亦会被取消。

`Background` 是所有 Context 树的根，其永远不会被取消。

使用 `WithCancel` 及 `WithTimeout` 可以创建衍生的 `Context`，`WithCancel` 可用来取消一组从其衍生的 goroutine，`WithTimeout` 可用来设置截止时间。

`WithValue` 提供给 Context 赋予请求域数据的能力。

常见例子：

```go
// WitchCancel 的使用
// monitor 每隔 1s 打印一句“monitor woring”，main 函数在 3s 后执行 cancel，那么 monitor 检测到取消信号后即会退出。
func MyContextDemo1() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() {
		for range time.Tick(time.Second) {
			select {
			case <-ctx.Done():
				return
			default:
				fmt.Println("monitor working")
			}
		}
	}()

	time.Sleep(3 * time.Second)
}

// WithTimeout 的使用
// 注意，虽然到截至时间会自动 cancel，但 cancel 代码仍建议加上。
// 到截至时间而被取消还是被 cancel 代码所取消，取决于哪个信号发送的早。
func MyContextDemo2() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()
	select {
	case <-ctx.Done():
		fmt.Println(ctx.Err())
	case <-time.After(4 * time.Second):
		fmt.Println("overslept")
}
// WithDeadline 的使用与 `WithTimeout` 相似。
// 没想好 Context 的具体使用，可以使用 `TODO` 来占位，也便于工具作正确性检查。

// WithValue 的使用
// 注意：避免多个包同时使用 context 而带来冲突，key 不建议使用 string 或其他内置类型，而建议自定义 key 类型。
type myCtxKey string

func MyContextDemo3() {
	ctx := context.WithValue(context.Background(), myCtxKey("a"), "a")
	get := func(ctx context.Context, k myCtxKey) {
		if v, ok := ctx.Value(k).(string); ok {
			fmt.Println(v)
		}
	}
	// 输出：a
	get(ctx, myCtxKey("a"))
	// 没有输出
	get(ctx, myCtxKey("b"))
}
```
