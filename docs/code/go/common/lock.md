# Go锁

## Mutex

在 Go 语言中这种锁的机制是通过 sync 包中 Mutex 来实现的。

`sync.Mutex` 是一个互斥锁，它的作用是守护在临界区入口来确保同一时间只能有一个线程进入临界区。

假设 info 是一个需要上锁的放在共享内存中的变量。通过包含 Mutex 来实现的一个典型例子如下：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Info struct {
	lock  sync.Mutex
	Str   string
	Count int
}

func main() {
	info := &Info{
		Str:   "0",
		Count: 0,
	}
	for i := 0; i < 10; i++ {
		go func(j int) {
			update(info, fmt.Sprint(j))
		}(i)
	}
	time.Sleep(time.Second * 3)
	fmt.Printf("%#v", info)
}

func update(info *Info, str string) {
	info.lock.Lock()

	defer info.lock.Unlock()

	info.Str = str
	info.Count++
}
```

在 `sync` 包中还有一个 `RWMutex` 锁：他能通过 `RLock()` 来允许同一时间多个线程对变量进行读操作，但是只能一个线程进行写操作。如果使用 `Lock()` 将和普通的 `Mutex` 作用相同。包中还有一个方便的 Once 类型变量的方法 `once.Do(call)`，这个方法确保被调用函数只能被调用一次。

相对简单的情况下，通过使用 sync 包可以解决同一时间只能一个线程访问变量或 map 类型数据的问题。如果这种方式导致程序明显变慢或者引起其他问题，我们要重新思考来通过 `goroutines` 和 `channels` 来解决问题，这是在 Go 语言中所提倡用来实现并发的技术。

## RWMutex

* `RLock()`：读操作获取锁，如果锁已经被 `writer` 占用，会一直阻塞直到 `writer` 释放锁；否则直接获得锁；
* `RUnlock()`：读操作完毕之后释放锁；
* `Lock()`：写操作获取锁，如果锁已经被 `reader` 或者 `writer` 占用，会一直阻塞直到获取到锁；否则直接获得锁；
* `Unlock()`：写操作完毕之后释放锁；
* `RLocker()`：返回读操作的 `Locker` 对象，该对象的 `Lock()` 方法对应 `RWMutex` 的 `RLock()，Unlock()` 方法对应 `RWMutex` 的 `RUnlock()` 方法。

`RWMutex` 是没有优先级，按照先来先到的顺序去执行，多个 `reader` 可以 `并行` 去执行。

1. 队列 `A` 最多只允许有 一个`writer`，如果有其他 `writer`，需要在 队列 `B` 等待；
1. 当一个 `writer` 到了 队列 `A` 后，只允许它 之前的 `reader` 执行读操作，新来的 `reader` 需要在 队列 `A` 后面排队；
1. 当前面的 `reader` 执行完读操作之后，`writer` 执行写操作；
1. `writer` 执行完写操作后，让 后面的 `reader` 执行读操作，再唤醒队列 `B` 的一个 `writer` 到 队列 `A` 后面排队。

* map实战

```go
package main

import (
 "fmt"
 "math/rand"
 "sync"
 "time"
)

type ConcurrentMap struct {
 m     sync.RWMutex
 items map[string]interface{}
}

func (c *ConcurrentMap) Add(key string, value interface{}) {
 c.m.Lock()
 defer c.m.Unlock()
 c.items[key] = value
}

func (c *ConcurrentMap) Remove(key string) {
 c.m.Lock()
 defer c.m.Unlock()
 delete(c.items, key)
}
func (c *ConcurrentMap) Get(key string) interface{} {
 c.m.RLock()
 defer c.m.RUnlock()
 return c.items[key]
}

func NewConcurrentMap() ConcurrentMap {
 return ConcurrentMap{
  items: make(map[string]interface{}),
 }
}

func main() {
 m := NewConcurrentMap()

 var wait sync.WaitGroup

 wait.Add(10000)
 for i := 0; i < 10000; i++ {

  key := fmt.Sprintf("%d", rand.Intn(10))
  value := fmt.Sprintf("%d", rand.Intn(100))
  if i%100 == 0 {
   go func() {
    defer wait.Done()
    m.Add(key, value)
   }()
  } else {
   go func() {
    defer wait.Done()
    fmt.Println(m.Get(key))
    time.Sleep(time.Millisecond * 10)
   }()
  }

 }

 wait.Wait()
}
```

## channel

```go
func channelLock() {
	file, err := os.Create("test.txt")
	defer func() {
		if err := recover(); err != nil {
			fmt.Printf("Error encounter: %v", err)
		}
		file.Close()
	}()
	if err != nil {
		panic(errors.New("Cannot create/open file"))
	}

	ss := []string{
		"A",
		"B",
		"C",
		"D",
	}

	chanLock := make(chan int, 1)
	var wg sync.WaitGroup

	for _, s := range ss {
		wg.Add(1)
		go func(name string) {
			chanLock <- 1
			for i := 0; i < 100; i++ {
				file.WriteString(name + "\n")
			}
			<-chanLock
			wg.Done()
		}(s)
	}

	wg.Wait()
}
```