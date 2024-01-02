# Sync相关库

## Sync.Once

`sync.Once` 是 Go 语言中的一种同步原语，用于确保某个操作或函数在并发环境下只被执行一次。它只有一个导出的方法，即 `Do`，该方法接收一个函数参数。在 `Do` 方法被调用后，该函数将被执行，而且只会执行一次，即使在多个协程同时调用的情况下也是如此。

`sync.Once` 主要用于以下场景：

* 单例模式：确保全局只有一个实例对象，避免重复创建资源。
* 延迟初始化：在程序运行过程中需要用到某个资源时，通过 `sync.Once` 动态地初始化该资源。
* 只执行一次的操作：例如只需要执行一次的配置加载、数据清理等操作。

### 简单示例

```go
//// 单例
package main

import (
   "fmt"
   "sync"
)

type Singleton struct{}

var (
   instance *Singleton
   once     sync.Once
)

func GetInstance() *Singleton {
   once.Do(func() {
      instance = &Singleton{}
   })
   return instance
}

func main() {
   var wg sync.WaitGroup

   for i := 0; i < 5; i++ {
      wg.Add(1)
      gofunc() {
         defer wg.Done()
         s := GetInstance()
         fmt.Printf("Singleton instance address: %p\n", s)
      }()
   }

   wg.Wait()
}


///// 延迟初始化
package main

import (
   "fmt"
   "sync"
)

type Config struct {
   config map[string]string
}

var (
   config *Config
   once   sync.Once
)

func GetConfig() *Config {
   once.Do(func() {
      fmt.Println("init config...")
      config = &Config{
         config: map[string]string{
            "c1": "v1",
            "c2": "v2",
         },
      }
   })
   return config
}

func main() {
   // 第一次需要获取配置信息，初始化 config
   cfg := GetConfig()
   fmt.Println("c1: ", cfg.config["c1"])

   // 第二次需要，此时 config 已经被初始化过，无需再次初始化
   cfg2 := GetConfig()
   fmt.Println("c2: ", cfg2.config["c2"])
}
```

### 实现原理

```go
type Once struct {
   // 表示是否执行了操作
   done uint32
   // 互斥锁，确保多个协程访问时，只能一个协程执行操作
   m    Mutex
}

func (o *Once) Do(f func()) {
   // 判断 done 的值，如果是 0，说明 f 还没有被执行过
   // 第一次检查：在获取锁之前，先使用原子加载操作 atomic.LoadUint32 检查 done 变量的值，如果 done 的值为 1，表示操作已执行，此时直接返回，不再执行 doSlow 方法。这一检查可以避免不必要的锁竞争。
   if atomic.LoadUint32(&o.done) == 0 {
      // 构建慢路径(slow-path)，以允许对 Do 方法的快路径(fast-path)进行内联
      o.doSlow(f)
   }
}

func (o *Once) doSlow(f func()) {
   // 加锁
   o.m.Lock()
   defer o.m.Unlock()
   // 双重检查，避免 f 已被执行过
   if o.done == 0 {
      // 修改 done 的值
      defer atomic.StoreUint32(&o.done, 1)
      // 执行函数
      f()
   }
}
```

### 加强的 sync.Once 实现

与标准的 `sync.Once` 不同，这个实现允许 Do 方法的函数参数返回一个 `error`。如果执行函数没有返回 `error`，则修改 `done` 的值以表示函数已执行。这样，在后续的调用中，只有在没有发生 error 的情况下，才会跳过函数执行，避免初始化失败。

```go
package main

import (
   "sync"
   "sync/atomic"
)


type Once struct {
   done uint32
   m    sync.Mutex
}

func (o *Once) Do(f func() error) error {
   if atomic.LoadUint32(&o.done) == 0 {
      return o.doSlow(f)
   }
   returnnil
}

func (o *Once) doSlow(f func() error) error {
   o.m.Lock()
   defer o.m.Unlock()
   var err error
   if o.done == 0 {
      err = f()
      // 只有没有 error 的时候，才修改 done 的值
      if err == nil {
         atomic.StoreUint32(&o.done, 1)
      }
   }
   return err
}
```

## Sync.Cond

在并发编程中，当多个 `goroutine` 需要访问共享资源时，我们需要使用一些机制来协调它们的执行顺序，以避免竞态条件和数据不一致的问题。在 Go 语言中，`sync.Cond` 条件变量就是一种常用的机制，它可以用来等待和通知其他 `goroutine`。

互斥锁（`sync.Mutex`）用于保护临界区和共享资源，而 `sync.Cond` 则用于协调多个 `goroutine` 的执行顺序。互斥锁只能一个 `goroutine` 持有锁，其他 `goroutine` 必须等待锁被释放才能继续执行。而 `sync.Cond` 可以让等待的 `goroutine` 在条件满足时被唤醒，进而继续执行。

```go
// 结构定义
// 每个 Cond 实例都会关联一个锁 L（互斥锁 *Mutex，或读写锁 *RWMutex），当修改条件或者调用 Wait 方法时，必须加锁。
type Cond struct {
        noCopy noCopy

        // L is held while observing or changing the condition
        L Locker

        notify  notifyList
        checker copyChecker
}

// 创建实例
func NewCond(l Locker) *Cond

// Broadcast 广播唤醒所有等待的 goroutine
func (c *Cond) Broadcast()

// Signal 唤醒一个等待的 goroutine
func (c *Cond) Signal()

// Wait 等待条件变量满足
// Wait 方法会自动释放锁，并挂起当前的 goroutine，直到条件变量 c 被 Broadcast 或 Signal 唤醒。被唤醒后，Wait 方法会重新获得锁，并继续执行后续的代码
func (c *Cond) Wait()
```

完整使用示例：

```go
// 在这个示例中，有两个读取协程（reader1 和 reader2）和一个写入协程（writer）。写入协程在执行后会通知所有等待的读取协程，读取协程在条件满足时才能开始读取。
package main

import (
    "fmt"
    "sync"
    "time"
)

var done = false

func read(str string, c *sync.Cond) {
    c.L.Lock()
    for !done {
        c.Wait()
    }
    fmt.Println(str, "start reading")
    c.L.Unlock()
}

func write(str string, c *sync.Cond) {
    fmt.Println(str, "start writing")
    time.Sleep(2 * time.Second)
    c.L.Lock()
    done = true
    c.L.Unlock()
    fmt.Println(str, "wake up all")
    c.Broadcast()
}

func main() {
    m := &sync.Mutex{}
    c := sync.NewCond(m)

    go read("reader1", c)
    go read("reader2", c)
    write("writer", c)

    time.Sleep(5 * time.Second)
}

// 输出结果
writer start writing
writer wake up all
reader2 start reading
reader1 start reading
```


## Sync.Pool

`sync.Pool` 是 Go 标准库中提供的一个对象池（`Object Pool`）的实现。对象池是一种用于缓存和复用对象的机制，可以在一定程度上减轻内存分配的开销。`sync.Pool` 专门用于管理临时对象，适用于一些需要频繁创建和销毁的短暂对象，例如临时缓冲区。

```go
//// 创建对象池
import (
   "sync"
)

var myPool = sync.Pool{
   New: func() interface{} {
       // 创建一个新的对象
       return make([]byte, 0, 1024)
   },
}

//// 从对象池中获取对象
func getObject() []byte {
   return myPool.Get().([]byte)
}

//// 将对象放回对象池
func releaseObject(obj []byte) {
   // 重置对象状态
   obj = obj[:0]
   // 将对象放回对象池
   myPool.Put(obj)
}
```

```go
//// 完整示例
package main

import (
"fmt"
"sync"
)

var myPool = sync.Pool{
New: func() interface{} {
    // 创建一个新的切片对象
    return make([]byte, 0, 1024)
},
}

func getObject() []byte {
return myPool.Get().([]byte)
}

func releaseObject(obj []byte) {
// 重置对象状态
obj = obj[:0]
// 将对象放回对象池
myPool.Put(obj)
}

func main() {
// 获取对象
obj := getObject()
fmt.Println("Object:", obj)

// 释放对象
releaseObject(obj)

// 再次获取对象，应该是之前释放的对象
newObj := getObject()
fmt.Println("New Object:", newObj)
}
```