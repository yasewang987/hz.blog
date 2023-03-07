# Go常用开源库

## zap

github地址：https://github.com/uber-go/zap

`zap`是`uber`开源的日志库，选择zap他有两个优势：

* 它非常的快
* 它同时提供了结构化日志记录和printf风格的日志记录

大多数日志库基本都是基于反射的序列化和字符串格式化的，这样会导致在日志上占用大量CPU资源，不适用于业务开发场景，业务对性能敏感还是挺高的。zap采用了不同的方法，它设计了一个无反射、零分配的 JSON 编码器，并且基础 Logger 力求尽可能避免序列化开销和分配。通过在此基础上构建高级 SugaredLogger，zap 允许用户选择何时需要计算每次分配以及何时更喜欢更熟悉的松散类型的 API。

## jsoniter

github地址：https://github.com/json-iterator/go

做业务开发离不开`json`的序列化与反序列化，标准库虽然提供了`encoding/json`，但是它主要是通过反射来实现的，所以性能消耗比较大。`jsoniter`可以解决这个痛点，其是一款快且灵活的 JSON 解析器，具有良好的性能并能100%兼容标准库，我们可以使用`jsoniter`替代`encoding/json`，官方文档称可以比标准库快6倍多，后来Go官方在go1.12版本对 `json.Unmarshal` 函数使用 `sync.Pool` 缓存了 `decoder`，性能较之前的版本有所提升，所以现在达不到快6倍多。

## robfig/cron

github地址：https://github.com/robfig/cron

业务开发更离不开定时器的使用了，cron就是一个用于管理定时任务的库，用 Go 实现 Linux 中crontab这个命令的效果，与Linux 中crontab命令相似，cron库支持用 5 个空格分隔的域来表示时间。cron上手也是非常容易的，看一个官方的例子：

```go
package main

import (
  "fmt"
  "time"

  "github.com/robfig/cron/v3"
)

func main() {
  c := cron.New()

  c.AddFunc("@every 1s", func() {
    fmt.Println("tick every 1 second run once")
  })
  c.Start()
  time.Sleep(time.Second * 10)
}
```

## ants

github地址：https://github.com/panjf2000/ants

某些业务场景还会使用到`goroutine`池，`ants`就是一个广泛使用的`goroute`池，可以有效控制协程数量，防止协程过多影响程序性能。`ants`也是国人开发的，设计博文写的也很详细的，目前很多大厂也都在使用`ants`，经历过线上业务检验的，所以可以放心使用。

## cobra

github地址：https://github.com/spf13/cobra

用于快速构建命令行程序的golang包cobra，基于cobra写命令行的著名项目一只手数不过来：Docker CLI、Helm、istio、etcd、Git、Github CLI

## conc

结构更佳的 Go 并发库。








