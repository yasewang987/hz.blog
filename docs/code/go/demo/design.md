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