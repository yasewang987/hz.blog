# Time介绍

## 定时任务Timer
* `Timer`代表一次定时，时间到来后只发生一个事件 只发生一次
* `Timer`对外仅暴露一个通道，指定的时间到了，就会往该通道中写入系统时间，时间到了就触发一次事件，只会触发一次，因为时间只会到一次

```go
func timedemo1() {
	t := time.NewTimer(1 * time.Second)
	<-t.C
	fmt.Println("1s 之后执行: ", time.Now())

	// 延迟2s
	// After本质上就是新建了一个 timer 返回这个timer的chan
	<-time.After(2 * time.Second)
	fmt.Println("又过了2s: ", time.Now())

	// 延迟2s
	time.Sleep(2 * time.Second)
	fmt.Println("2s:", time.Now())

	// 重置完时间后，1s执行
	t2 := time.NewTimer(5 * time.Second)
	t2.Reset(1 * time.Second)
	<-t2.C
	fmt.Println("只是过了1s：", time.Now())
}

func timedemo2() {
	timer := time.NewTimer(3 * time.Second)
	c := make(chan int, 1)

	go func() {
		fmt.Println("start func")
		//for {
		select {
		case <-timer.C:
			fmt.Println("超时执行: ", time.Now())
		case <-c:
			fmt.Println("中断执行: ", time.Now())
			timer.Stop()
		}
		//}
		// 不使用for循环的话，执行了一次方法就会终止
		// 只要触发任意一个case都会执行下面的end func逻辑
		fmt.Println("end func: ", time.Now())
	}()
	fmt.Println("开始执行：", time.Now())
	<-time.NewTimer(4 * time.Second).C
	c <- 1
	fmt.Println("c channel入值：", time.Now())
	for {
	}
}
```

## 周期任务Ticker

* `Ticker`也是定时器，不过他是一个周期性的定时器

```go
type myFnc func()

func testFnc() {
	fmt.Println("触发了 1 次 testFunc")
}

// 自定义定时器
type myTicker struct {
	MyTicker *time.Ticker
	Runner   myFnc
}

// 新建定时器
func NewMyTicker() *myTicker {
	return &myTicker{
		MyTicker: time.NewTicker(2 * time.Second),
		Runner:   testFnc,
	}
}

// 启动定时器
func (t *myTicker) Start() {
	for {
		select {
		case <-t.MyTicker.C:
			t.Runner()
		}
	}
}
// demo
func tickerdemo() {
	mt := NewMyTicker()
	mt.Start()
}
```

## 执行计划Cron

使用 `github.com/robfig/cron` 库,本质上还是使用 `Timer` 去实现的。

```go
// 每隔1秒执行一次
// */1 * * * * ?
// 每一分钟的 1 ， 3 ，5秒 会执行任务
// 1,3,5 * * * * ?
// 每分钟的 1 -10，每隔 2 秒钟，执行任务
// 1-10/2 * * * * ?
// 每隔1分钟执行一次
// 0 */1 * * * ?
// 在1分、2分、3分执行一次
// 0 1,2,3 * * * ?
// 每天0点执行一次
// 0 0 0 * * ?
// 每天的0点、1点、2点执行一次
// 0 0 0,1,2 * * ?
// 每月1号凌晨1点执行一次
// 0 0 1 1 * ?
func crondemo() {
	c := cron.New()
	spec := "*/2 * * * * ?"
	i := 1
	c.AddFunc(spec, func() {
		fmt.Println("cron 执行了：", i)
		i++
	})
	c.Start()
	defer c.Stop()
	select {}
}
```