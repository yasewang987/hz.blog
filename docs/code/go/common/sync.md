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