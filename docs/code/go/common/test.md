# Go测试

## 常规测试

```go
// 逻辑代码
package unit

func add(a int, b int) int {
   return a + b
}

func sub(a int, b int) int {
   return a - b
}

// 测试代码
package unit

import (
    "github.com/stretchr/testify/assert"
    "testing"
)

func TestAdd(t *testing.T) {
    assert.Equal(t, 10, add(5, 5))
}

func TestSub(t *testing.T) {
    assert.Equal(t, 0, sub(5, 5))
}
```

执行测试：

```bash
go test --cover cal_test.go cal.go -v
```

## 性能测试

和单元测试类似，golang的benchmark也是开箱即用。在`cal_test.go`基础上增加一个`BenchmarkAdd`方法

```go
func BenchmarkAdd(b *testing.B) {
   for i:= 0; i < b.N; i++ {
      add(5, 5)
   }
}
```

执行测试：

```bash
go test -bench=. -cpu=4 -count=3
```

## pprof

pprof是golang自带的可以用来做cpu、内存、锁分析的工具，非常类似java的async-profiler。

pprof的使用非常简单，只需要在代码中引入net/http/pprof包，然后监听一个端口即可。

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
    _ "net/http/pprof"
)

func main() {
    go func() {
        //example: visit http://127.0.0.1:6060/debug/pprof in browser.
        err := http.ListenAndServe("0.0.0.0:6060", nil)
        if err != nil {
            fmt.Println("failed to start pprof goroutine:", err)
        }
    }()

    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe("localhost:8000", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(1 * time.Second)
    eat()
    time := time.Now().Unix() * 2 + 1000000
    fmt.Fprintf(w, "URL.Path = %q; time = %d\n", r.URL.Path, time)
}

func eat() {
    loop := 10000000000
    for i := 0; i < loop; i++ {
        // do nothing
    }
}
```
在命令行中输入:
```bash
go tool pprof http://127.0.0.1:6060/debug/pprof/profile
```
同时不停的请求，让pprof能采集到数据，这里我的请求是:
```bash
curl http://127.0.0.1:8000/hello
```
等待30秒后，采集结束会显示采集文件的地址
```bash
Saved profile in /Users/roshi/pprof/pprof.samples.cpu.003.pb.gz
```
此时可以使用top等命令直接查看cpu消耗过高的函数，更多命令可以使用help查看。
```bash
# todo
```
或者把文件下载下来用可视化的界面来分析，可以使用
```bash
go tool pprof -http=":8080" /User/roshi/pprof/pprof.samples.cpu.003.pb.gz
```
来开启一个可视化的页面，查看，如果报错需要安装graphviz，安装文档在这里可以查找：`https://graphviz.gitlab.io/download/`

访问 `http://localhost:8080/ui/` 可以看到下图，其中面积最大的块表示消耗cpu最多

## dlv

pprof很好用，但有一个缺点是必须事先在代码中开启，如果线上出问题且没有开启pprof，可能就需要类似jstack、jmap、arthas等这类工具来排查。这里推荐一个最近使用过非常好用的golang问题排查利器——dlv，项目地址见

https://github.com/go-delve/delve

它很有用的一个功能是attach，可以attach到正在运行的golang程序，查看goroutine。这点可以很好的排查线上问题。
各个平台的安装在github上写的很清楚，需要说明的是安装dlv的golang版本和要排查进程的golang版本需要保持一致。
先写一个测试程序，起两个goroutine，一个运行，一个阻塞

```go
package main

import (
   "fmt"
   "sync"
)

func main()  {
   go count()
   go wait()
   wait()
}

func count()  {
   count := 0
   for {
      count = count + 1
      if count % 1000000000 == 0 {
         fmt.Println("I'm a running routine")
      }
   }
}

func wait()  {
   wg := sync.WaitGroup{}
   wg.Add(1)
   wg.Wait()
}
```

运行起来，然后使用dlv进行attach,（具体命令可以attach后使用help查看）

```bash
dlv attach 进程id
```
## fuzzing

`go fuzzing` 是通过持续给一个程序不同的输入来自动化测试，并通过分析代码覆盖率来智能的寻找失败的 `case`。这种方法可以尽可能的寻找到一些边缘 `case`。

![test1](http://cdn.go99.top/docs/code/go/test1.webp)

fuzz tests 的一些规则：

* 函数必须是 `Fuzz`开头，唯一的参数是 `*testing.F`，没有返回值
* Fuzz tests 必须在 `*_test.go` 的文件里
* 上图中的 `fuzz target` 是个方法调用 `(*testing.F).Fuzz`，第一个参数是 `*testing.T`，然后就是称之为 `fuzzing arguments` 的参数，没有返回值
* 每个 `fuzz test` 里只能有一个 `fuzz target`
* 调用 `f.Add(…)` 的时候需要参数类型跟 `fuzzing arguments` 顺序和类型都一致
* `fuzzing arguments` 只支持以下类型：
    * string, []byte
    * int, int8, int16, int32/rune, int64
    * uint, uint8/byte, uint16, uint32, uint64
    * float32, float64
    * bool
* `fuzz target` 不要依赖全局状态，会并行跑。

简单例子：
```go
// 具体代码见 https://github.com/zeromicro/go-zero/blob/master/core/mr/mapreduce_fuzz_test.go
func FuzzMapReduce(f *testing.F) {
  ...
}
```
执行：
```bash
go test -fuzz=MapReduce
```
我们会得到类似如下结果：
```bash
fuzz: elapsed: 0s, gathering baseline coverage: 0/2 completed
fuzz: elapsed: 0s, gathering baseline coverage: 2/2 completed, now fuzzing with 10 workers
fuzz: elapsed: 3s, execs: 3338 (1112/sec), new interesting: 56 (total: 57)
fuzz: elapsed: 6s, execs: 6770 (1144/sec), new interesting: 62 (total: 63)
fuzz: elapsed: 9s, execs: 10157 (1129/sec), new interesting: 69 (total: 70)
fuzz: elapsed: 12s, execs: 13586 (1143/sec), new interesting: 72 (total: 73)
fuzz: elapsed: 13s, execs: 14031 (1084/sec), new interesting: 72 (total: 73)
PASS
ok    github.com/zeromicro/go-zero/core/mr  13.169s
```

### fuzz最佳实践

1. 定义 `fuzzing arguments`，首先要想明白怎么定义 `fuzzing arguments`，并通过给定的 `fuzzing arguments` 写 `fuzzing target`
1. 思考 `fuzzing target` 怎么写，这里的重点是怎么验证结果的正确性，因为 `fuzzing arguments` 是“随机”给的，所以要有个通用的结果验证方法
1. 思考遇到失败的 `case` 如何打印结果，便于生成新的 `unit test`
1. 根据失败的 `fuzzing test` 打印结果编写新的 `unit test`，这个新的`unit test`会被用来调试解决`fuzzing test`发现的问题，并固化下来留给CI用

代码示例：
```go
func Sum(vals []int64) int64 {
  var total int64

  for _, val := range vals {
    if val%1e5 != 0 {
      total += val
    }
  }

  return total
}
```

定义 fuzzing arguments，你至少需要给出一个 fuzzing argument，不然 go fuzzing 没法生成测试代码，所以即使我们没有很好的输入，我们也需要定义一个对结果产生影响的 fuzzing argument，这里我们就用 slice 元素个数作为 fuzzing arguments，然后 Go fuzzing 会根据跑出来的 code coverage 自动生成不同的参数来模拟测试。

```go
func FuzzSum(f *testing.F) {
  f.Add(10)
  f.Fuzz(func(t *testing.T, n int) {
    n %= 20
    ...
  })
}
```
这里的 `n` 就是让 `go fuzzing` 来模拟 `slice` 元素个数，为了保证元素个数不会太多，我们限制在20以内（0个也没问题），并且我们添加了一个值为10的语料（go fuzzing 里面称之为 `corpus`），这个值就是让 go fuzzing 冷启动的一个值，具体为多少不重要。

失败 `case` 打印输入:

```go
func FuzzSum(f *testing.F) {
  rand.Seed(time.Now().UnixNano())

  f.Add(10)
  f.Fuzz(func(t *testing.T, n int) {
    n %= 20
    var vals []int64
    var expect int64
    var buf strings.Builder
    buf.WriteString("\n")
    for i := 0; i < n; i++ {
      val := rand.Int63() % 1e6
      vals = append(vals, val)
      expect += val
      buf.WriteString(fmt.Sprintf("%d,\n", val))
    }

    assert.Equal(t, expect, Sum(vals), buf.String())
  })
}
```

输出：

```bash
$ go test -fuzz=Sum
fuzz: elapsed: 0s, gathering baseline coverage: 0/2 completed
fuzz: elapsed: 0s, gathering baseline coverage: 2/2 completed, now fuzzing with 10 workers
fuzz: elapsed: 0s, execs: 1402 (10028/sec), new interesting: 10 (total: 8)
--- FAIL: FuzzSum (0.16s)
    --- FAIL: FuzzSum (0.00s)
        sum_fuzz_test.go:34:
              Error Trace:  sum_fuzz_test.go:34
                                  value.go:556
                                  value.go:339
                                  fuzz.go:334
              Error:        Not equal:
                            expected: 5823336
                            actual  : 5623336
              Test:         FuzzSum
              Messages:
                            799023,
                            110387,
                            811082,
                            115543,
                            859422,
                            997646,
                            200000,
                            399008,
                            7905,
                            931332,
                            591988,

    Failing input written to testdata/fuzz/FuzzSum/26d024acf85aae88f3291bf7e1c6f473eab8b051f2adb1bf05d4491bc49f5767
    To re-run:
    go test -run=FuzzSum/26d024acf85aae88f3291bf7e1c6f473eab8b051f2adb1bf05d4491bc49f5767
FAIL
exit status 1
FAIL  github.com/kevwan/fuzzing  0.602s
```

编写新的测试用例:

```go
func TestSumFuzzCase1(t *testing.T) {
  vals := []int64{
    799023,
    110387,
    811082,
    115543,
    859422,
    997646,
    200000,
    399008,
    7905,
    931332,
    591988,
  }
  assert.Equal(t, int64(5823336), Sum(vals))
}
```