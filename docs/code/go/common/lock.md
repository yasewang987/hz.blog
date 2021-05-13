# Go锁

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