# Go最佳实践

## defer

```go

p.Lock()
defer p.Unlock()

if p.count < 10 {
  return p.count
}

p.count++
return p.count
```

* 不要在`for`循环中使用`defer`，因为`defer`只有在函数最后去执行。

```go
// bad
for _, filename := range filenames {
    f, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer f.Close()
}

// good
for _, filename := range filenames {
    if err := doFile(filename); err != nil {
        return err
    }
}
func doFile(filename string) error {
    f, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer f.Close()
}
```

* `defer` 表达式的函数如果在 `panic` 后面，则这个函数无法被执行。

```go
// defer 逻辑不执行
func main() {
    panic("a")
    defer func() {
        fmt.Println("b")
    }()
}

// 执行defer逻辑
func main() {
	defer func() {
		fmt.Println("b")
	}()
	panic("a")
}

// goroutine 外部函数，也就是 G() 函数是没办法捕获的，程序直接崩溃退出。
func G() {
	defer func() {
		// goroutine 外进行 recover
		if err := recover(); err != nil {
			fmt.Println("捕获异常:", err)
		}
		fmt.Println("c")
	}()

	// 创建 goroutine 调用 F 函数
	go F()
	time.Sleep(time.Second)
}

func F() {
	defer func() {
		fmt.Println("b")
	}()
	// goroutine 内部抛出panic
	panic("a")
}

func main() {
	G()
}
///// 输出
b
panic: a

goroutine 6 [running]:
main.F()
	xxx.go:96 +0x5b
created by main.G
	xxx.go:87 +0x57
exit status 2
```

## 使用pkg/error代替官方error库

假设我们有一个项目叫errdemo，他有sub1,sub2两个子包。sub1和sub2两个包都有Diff和IoDiff两个函数。

```go
// sub2.go
package sub2
import (
    "errors"
    "io/ioutil"
)
func Diff(foo int, bar int) error {
    return errors.New("diff error")
}


// sub1.go
package sub1

import (
    "errdemo/sub1/sub2"
    "fmt"
    "errors"
)
func Diff(foo int, bar int) error {
    if foo < 0 {
        return errors.New("diff error")
    }
    if err := sub2.Diff(foo, bar); err != nil {
        return err
    }
    return nil
}

// main.go
package main

import (
    "errdemo/sub1"
    "fmt"
)
func main() {
    err := sub1.Diff(1, 2)
    fmt.Println(err)
}

////// 官方error库输出没有详细的错信信息
diff error
```

而使用 `github.com/pkg/errors` ，我们所有的代码都不需要进行修改，只需要将`import`地方进行对应的修改即可。在`main.go`中使用`fmt.Printf("%+v", err)` 就能除了打印`error`的信息，也能将堆栈打印出来了。

```go
// sub2.go
package sub2
import (
    "github.com/pkg/errors"
    "io/ioutil"
)
func Diff(foo int, bar int) error {
    return errors.New("diff error")
}


// sub1.go
package sub1

import (
    "errdemo/sub1/sub2"
    "fmt"
    "github.com/pkg/errors"
)
func Diff(foo int, bar int) error {
    if foo < 0 {
        return errors.New("diff error")
    }
    if err := sub2.Diff(foo, bar); err != nil {
        return err
    }
    return nil
}

// main.go
package main

import (
    "errdemo/sub1"
    "fmt"
)
func main() {
    err := sub1.Diff(1, 2)
    fmt.Printf("%+v", err)
}
```


## 类的构造参数较多，尽量使用Option写法

```go
////// bad case
package newdemo
type Foo struct {
   name string
   id int
   age int

   db interface{}
}
func NewFoo(name string, id int, age int, db interface{}) *Foo {
   return &Foo{
      name: name,
      id:   id,
      age:  age,
      db:   db,
   }
}
/// 初始化
foo := NewFoo("jianfengye", 1, 0, nil)
/// 参数继续增加？那么所有调用方的地方也都需要进行修改了，且按照代码整洁的逻辑，参数多于5个，这个函数就很难使用了。而且，如果这5个参数都是可有可无的参数，就是有的参数可以允许不填写，有默认值，比如age这个字段，如果不填写，在后续的业务逻辑中可能没有很多影响

////// good case
type Foo struct {
	name string
	id int
	age int

	db interface{}
}

// FooOption 代表可选参数
type FooOption func(foo *Foo)

// WithName 代表Name为可选参数
func WithName(name string) FooOption {
   return func(foo *Foo) {
      foo.name = name
   }
}

// WithAge 代表age为可选参数
func WithAge(age int) FooOption {
   return func(foo *Foo) {
      foo.age = age
   }
}

// WithDB 代表db为可选参数
func WithDB(db interface{}) FooOption {
   return func(foo *Foo) {
      foo.db = db
   }
}

// 参数我们就改造为两个部分，一个部分是“非Option”字段，就是必填字段，假设我们的Foo结构实际上只有一个必填字段id，而其他字段皆是选填的。而其他所有选填字段，我们使用一个可变参数 options 替换。
func NewFoo(id int, options ...FooOption) *Foo {
   // 按照默认值初始化一个foo对象
   foo := &Foo{
      name: "default",
      id:   id,
      age:  10,
      db:   nil,
   }
   // 遍历options改造这个foo对象
   for _, option := range options {
      option(foo)
   }
   return foo
}
// 将所有【可选的参数】作为一个可选方式，一般我们会定一个“函数类型”来代表这个Option，然后配套将所有【可选字段】设计一个这个函数类型的具体实现。而在具体的使用的时候，使用可变字段的方式来控制有多少个函数类型会被执行。
// 后续如果Foo多了一个可变属性，那么只需要多一个WithXXX的方法，而NewFoo函数不需要任何变化，调用方只有需要指定这个可变属性的地方增加WithXXX即可。扩展性非常好。
///// 初始化
func Bar() {
   foo := NewFoo(1, WithAge(15), WithName("foo"))
   fmt.Println(foo)
}
```

## 巧用大括号控制变量作用域

err变量的作用域就完全局限在括号中了，每次都可以直接使用 := 来创建一个新的 err并处理它，不需要额外思考这个err 变量是否前面已经创建过了。

```go
var name string
var folder string
var mod string
...
{
   prompt := &survey.Input{
      Message: "请输入目录名称：",
   }
   err := survey.AskOne(prompt, &name)
   if err != nil {
      return err
   }

   ...
}
{
   prompt := &survey.Input{
      Message: "请输入模块名称(go.mod中的module, 默认为文件夹名称)：",
   }
   err := survey.AskOne(prompt, &mod)
   if err != nil {
      return err
   }
   ...
}
{
   // 获取hade的版本
   client := github.NewClient(nil)
   prompt := &survey.Input{
      Message: "请输入版本名称(参考 https://github.com/gohade/hade/releases，默认为最新版本)：",
   }
   err := survey.AskOne(prompt, &version)
   if err != nil {
      return err
   }
   ...
}
```

## Goroutine内存泄漏

### 情况一：http服务未设置超时时间

* 上游服务作为客户端使用了 `http1.1` 并且将连接设置为 `keepalive`；
* 本服务作为服务端未设置 `idletimeout` 与 `readtimeout`；

当这两种情况同时发生时，如果上游持有对本服务的连接不进行释放，那么服务端会一直维持这个连接的存在，不进行回收，进而导致协程泄漏；

解决方案：

```go
server := &http.Server {
    Addr: addr,
    Handler: mux,
    IdleTimeout: 120 * time.Second,
}

if err := server.ListenAndServer; err != nil {
    return err
}
```

## 反射虽好，切莫贪杯

标准库 reflect 为 Go 语言提供了运行时动态获取对象的类型和值以及动态创建对象的能力。反射可以帮助抽象和简化代码，提高开发效率。

Go 语言标准库以及很多开源软件中都使用了 Go 语言的反射能力，例如用于序列化和反序列化的 json、ORM 框架 gorm、xorm 等。

## 字符串操作

* 使用 **``** ，避免转义

```go
// 反面示例
wantError := "unknown name:\"test\""
//推荐写法
wantError := `unknown error:"test"`
```

* 格式化字符串使用 `const` 定义

```go
// 反面示例
msg := "unexpected values %v, %v\n"
fmt.Printf(msg, 1, 2)
// 推荐写法
const msg = "unexpected values %v, %v\n"
fmt.Printf(msg, 1, 2)
```

* 避免重复的字符串到字节切片的转换

```go
// Bad
for i := 0; i < b.N; i++ {
 w.Write([]byte("Hello world"))
}

BenchmarkBad-4   50000000   22.2 ns/op

// Good
data := []byte("Hello world")
for i := 0; i < b.N; i++ {
 w.Write(data)
}

BenchmarkGood-4  500000000   3.25 ns/op
```

* 优先使用 `strconv` 而不是 `fmt`, fmt使用了反射

```go
// Bad
for i := 0; i < b.N; i++ {
 s := fmt.Sprint(rand.Int())
}

BenchmarkFmtSprint-4    143 ns/op    2 allocs/op

// Good
for i := 0; i < b.N; i++ {
 s := strconv.Itoa(rand.Int())
}

BenchmarkStrconv-4    64.2 ns/op    1 allocs/op
```

### 行内拼接字符串推荐使用运算符+

行内拼接字符串为了书写方便快捷，最常用的两个方法是：

* 运算符+
* fmt.Sprintf()

行内字符串的拼接，主要追求的是代码的简洁可读。fmt.Sprintf() 能够接收不同类型的入参，通过格式化输出完成字符串的拼接，使用非常方便。但因其底层实现使用了反射，性能上会有所损耗。

运算符 + 只能简单地完成字符串之间的拼接，非字符串类型的变量需要单独做类型转换。行内拼接字符串不会产生内存分配，也不涉及类型地动态转换，所以性能上优于fmt.Sprintf()。

从性能出发，兼顾易用可读，如果待拼接的变量不涉及类型转换且数量较少（<=5），行内拼接字符串推荐使用运算符 +，反之使用 fmt.Sprintf()。

下面看下二者的性能对比。

```go
// Good
func BenchmarkJoinStrWithOperator(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  _ = s1 + s2 + s3
 }
}

// Bad
func BenchmarkJoinStrWithSprintf(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  _ = fmt.Sprintf("%s%s%s", s1, s2, s3)
 }
}

go test -bench=^BenchmarkJoinStr -benchmem .
BenchmarkJoinStrWithOperator-8    70638928    17.53 ns/op     0 B/op    0 allocs/op
BenchmarkJoinStrWithSprintf-8      7520017    157.2 ns/op    64 B/op    4 allocs/op
```

### 非行内拼接字符串推荐使用 strings.Builder

字符串拼接还有其他的方式，比如strings.Join()、strings.Builder、bytes.Buffer和byte[]，这几种不适合行内使用。当待拼接字符串数量较多时可考虑使用。

先看下其性能测试的对比。

```go
func BenchmarkJoinStrWithStringsJoin(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  _ = strings.Join([]string{s1, s2, s3}, "")
 }
}

func BenchmarkJoinStrWithStringsBuilder(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  var builder strings.Builder
  _, _ = builder.WriteString(s1)
  _, _ = builder.WriteString(s2)
  _, _ = builder.WriteString(s3)
 }
}

func BenchmarkJoinStrWithBytesBuffer(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  var buffer bytes.Buffer
  _, _ = buffer.WriteString(s1)
  _, _ = buffer.WriteString(s2)
  _, _ = buffer.WriteString(s3)
 }
}

func BenchmarkJoinStrWithByteSlice(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  var bys []byte
  bys= append(bys, s1...)
  bys= append(bys, s2...)
  _ = append(bys, s3...)
 }
}

func BenchmarkJoinStrWithByteSlicePreAlloc(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  bys:= make([]byte, 0, 9)
  bys= append(bys, s1...)
  bys= append(bys, s2...)
  _ = append(bys, s3...)
 }
}

go test -bench=^BenchmarkJoinStr .
goos: windows
goarch: amd64
pkg: main/perf
cpu: Intel(R) Core(TM) i7-9700 CPU @ 3.00GHz
BenchmarkJoinStrWithStringsJoin-8               31543916                36.39 ns/op
BenchmarkJoinStrWithStringsBuilder-8            30079785                40.60 ns/op
BenchmarkJoinStrWithBytesBuffer-8               31663521                39.58 ns/op
BenchmarkJoinStrWithByteSlice-8                 30748495                37.34 ns/op
BenchmarkJoinStrWithByteSlicePreAlloc-8         665341896               1.813 ns/op
```

从结果可以看出，strings.Join()、strings.Builder、bytes.Buffer和byte[] 的性能相近。如果结果字符串的长度是可预知的，使用 byte[] 且预先分配容量的拼接方式性能最佳。

所以如果对性能要求非常严格，或待拼接的字符串数量足够多时，建议使用  byte[] 预先分配容量这种方式。

综合易用性和性能，一般推荐使用strings.Builder来拼接字符串。

string.Builder也提供了预分配内存的方式 Grow：

```go
func BenchmarkJoinStrWithStringsBuilderPreAlloc(b *testing.B) {
 s1, s2, s3 := "foo", "bar", "baz"
 for i := 0; i < b.N; i++ {
  var builder strings.Builder
  builder.Grow(9)
  _, _ = builder.WriteString(s1)
  _, _ = builder.WriteString(s2)
  _, _ = builder.WriteString(s3)
 }
}

BenchmarkJoinStrWithStringsBuilderPreAlloc-8    60079003                20.95 ns/op
```

使用了 Grow 优化后的版本的性能测试结果如下。可以看出相较于不预先分配空间的方式，性能提升了很多。

## import 分组

```go
import (
  "fmt"
  "os"

  "go.uber.org/atomic" // 其他库 
  "golang.org/x/sync/errgroup" // 其他库 
)
```

## Channel的size

`Channel` 的 `size` 要么是 `1`，要么是无缓冲的

```go
// 大小：1
c := make(chan int, 1)
// 或者无缓冲 channel，大小为 0
c := make(chan int)
```

## 枚举从1开始
```go
type Operation int

const (
  Add Operation = iota + 1
  Subtract
  Multiply
)
```

## 断言使用
```go
// 反面示例
t := i.(string)

// 推荐写法
t, ok := i.(string)
if !ok {
  // 优雅地处理错误
}
```

## 不要使用panic

在生产环境中运行的代码必须避免出现 `panic`。`panic` 是 级联失败 的主要根源 。如果发生错误，该函数必须返回错误，并允许调用方决定如何处理它。

```go
//// 反面例子
func run(args []string) {
  if len(args) == 0 {
    panic("an argument is required")
  }
  // ...
}

func main() {
  run(os.Args[1:])
}

//// 推荐写法
func run(args []string) error {
  if len(args) == 0 {
    return errors.New("an argument is required")
  }
  // ...
  return nil
}

func main() {
  if err := run(os.Args[1:]); err != nil {
    fmt.Fprintln(os.Stderr, err)
    os.Exit(1)
  }
}
```

## 避免使用init()

尽可能避免使用`init()`。当`init()`是不可避免或可取的，代码应先尝试：

1. 无论程序环境或调用如何，都要完全确定。
1. 避免依赖于其他`init()`函数的顺序或副作用。虽然`init()`顺序是明确的，但代码可以更改， 因此`init()`函数之间的关系可能会使代码变得脆弱和容易出错。
1. 避免访问或操作全局或环境状态，如机器信息、环境变量、工作目录、程序参数/输入等。
1. 避免`I/O`，包括文件系统、网络和系统调用。

尽可能的作为`main()`函数流程中调用的一个环节。

```go
//// 反面示例
type Config struct {
    // ...
}
var _config Config
func init() {
    // Bad: 基于当前目录
    cwd, _ := os.Getwd()
    // Bad: I/O
    raw, _ := ioutil.ReadFile(
        path.Join(cwd, "config", "config.yaml"),
    )
    yaml.Unmarshal(raw, &_config)
}

//// 推荐写法
type Config struct {
    // ...
}
// 提供一个获取配置的方法
func loadConfig() Config {
    cwd, err := os.Getwd()
    // handle err
    raw, err := ioutil.ReadFile(
        path.Join(cwd, "config", "config.yaml"),
    )
    // handle err
    var config Config
    yaml.Unmarshal(raw, &config)
    return config
}
```

## 流程优化ifelse

代码应尽可能先处理错误情况、特殊情况并尽早返回，依次来减少嵌套。

```go
//// 反面示例
for _, v := range data {
  if v.F1 == 1 {
    v = process(v)
    if err := v.Call(); err == nil {
      v.Send()
    } else {
      return err
    }
  } else {
    log.Printf("Invalid v: %v", v)
  }
}

//// 推荐写法
for _, v := range data {
  if v.F1 != 1 {
    log.Printf("Invalid v: %v", v)
    continue
  }

  v = process(v)
  if err := v.Call(); err != nil {
    return err
  }
  v.Send()
}

// 反面示例
var a int
if b {
  a = 100
} else {
  a = 10
}

// 推荐写法
a := 10
if b {
  a = 100
}
```

## 结构体

* 嵌入的类型，应放在结构体内字段列表的顶部，并且必须有一个空行将嵌入式字段与常规字段分隔开。

```go
//// 反面示例

type Client struct {
  version int
  http.Client
}

//// 推荐写法

// 1.嵌入类型在顶部 
// 2.空行将嵌入式字段与常规字段分隔开
type Client struct {
  http.Client

  version int
}
```

* 使用字段名初始化

```go
// 反面示例
k := User{"John", "Doe", true}

// 推荐写法
k := User{
    FirstName: "John",
    LastName: "Doe",
    Admin: true,
}
```

* 对零值结构使用 `var`

```go
// 反面示例
user := User{}

// 推荐
var user User
```

* 初始化 `Struct` 引用,请使用`&T{}`代替`new(T)`，以使其与结构体初始化一致

```go
// 反面示例
sptr := new(T)
sptr.Name = "bar"

// 推荐
sptr := &T{Name: "bar"}
```

## slice操作

* 当返回长度为零的切片时使用`nil`

```go
// 反面示例
if x == "" {
  return []int{}
}

// 推荐写法
if x == "" {
  return nil
}
```

* 检查切片是否为空

```go
// 反面示例
func isEmpty(s []string) bool {
  return s == nil
}

// 推荐示例
func isEmpty(s []string) bool {
  return len(s) == 0
}
```

* 零值切片（用`var`声明的切片）可立即使用，无需调用`make()`创建。

```go
//// 反面示例

nums := []int{}
// or, nums := make([]int)

if add1 {
  nums = append(nums, 1)
}

if add2 {
  nums = append(nums, 2)
}

//// 推荐写法

var nums []int

if add1 {
  nums = append(nums, 1)
}

if add2 {
  nums = append(nums, 2)
}
```

### 初始化时尽量指定容量

方法2相较于方法1，就只有一个区别：在初始化`[]int slice`的时候在`make`中设置了`cap`的长度，就是`slice`的大小。

这两种方法对应的功能和输出结果是没有任何差别的，但是实际运行的时候，方法2会比少运行了一个`growslice`的命令。`growslice`的作用就是扩充`slice`的容量大小。就好比是原先我们没有定制容量，系统给了我们一个能装两个鞋子的盒子，但是当我们装到第三个鞋子的时候，这个盒子就不够了，我们就要换一个盒子，而换这个盒子，我们势必还需要将原先的盒子里面的鞋子也拿出来放到新的盒子里面。所以这个`growsslice`的操作是一个比较复杂的操作，它的表现和复杂度会高于最基本的初始化`make`方法。对追求性能的程序来说，应该能避免尽量避免。

```go
// 反面示例
package main
import "fmt"
func main() {
	arr := []int{}
	arr = append(arr, 1,2,3,4, 5)
	fmt.Println(arr)
}

//// 推荐写法
package main
import "fmt"
func main() {
   arr := make([]int, 0, 5)
   arr = append(arr, 1,2,3,4, 5)
   fmt.Println(arr)
}
```

## map操作

### 初始化时指定容量

注意，与 slice 不同。map capacity 提示并不保证完全的抢占式分配，而是用于估计所需的 hashmap bucket 的数量。因此，在将元素添加到 map 时，甚至在指定 map 容量时，仍可能发生分配。

* map

```go
make(map[T1]T2, hint)

// Bad
m := make(map[string]os.FileInfo)

files, _ := ioutil.ReadDir("./files")
for _, f := range files {
    m[f.Name()] = f
}
// m 是在没有大小提示的情况下创建的； 在运行时可能会有更多分配。

// Good
files, _ := ioutil.ReadDir("./files")

m := make(map[string]os.FileInfo, len(files))
for _, f := range files {
    m[f.Name()] = f
}
// m 是有大小提示创建的；在运行时可能会有更少的分配。
```

## 参数和返回(slice & map)

`slice` 和 `map` 包含了指向底层数据的指针，因此当在函数中使用他们作为参数和返回值时，需要特别注意。

### 作为参数

```go
//// 反面示例

type User struct {
 Likes []string
}

func (u *User) SetLikes(likes []string) {
 u.Likes = likes
}
func TestRun(t *testing.T) {
 like := []string{"篮球", "旅游", "听歌"}
 user := new(User)
  // 切片作为参数传递
 user.SetLikes(like)
 fmt.Println("user Like1: ", user.Likes)
 // 这里修改变量，会影响到user对象中的属性
 like[1] = "学习"
 fmt.Println("user Like2 : ", user.Likes)
}
/**输出
=== RUN   TestRun
user Like1:  [篮球 旅游 听歌]
user Like2 :  [篮球 学习 听歌]
--- PASS: TestRun (0.00s)
PASS
*/

//// 推荐写法

// 只需要修改这个方法，其他不变
func (u *User) SetLikes(likes []string) {
 u.Likes = make([]string, len(likes))
 // 这里使用了复制
 copy(u.Likes, likes)
}
/**输出
=== RUN   TestRun
user Like1:  [篮球 旅游 听歌]
user Like2 :  [篮球 旅游 听歌]
--- PASS: TestRun (0.00s)
PASS
*/
```

### 作为返回值

```go
//// 反面示例
type Stats struct {
  mu sync.Mutex
  counters map[string]int
}
// Snapshot 返回当前状态。
func (s *Stats) Snapshot() map[string]int {
  s.mu.Lock()
  defer s.mu.Unlock()
  // 返回的对象中的属性
  return s.counters
}
// snapshot 不再受互斥锁保护
// 因此对 snapshot 的任何访问都将受到数据竞争的影响
// 影响 stats.counters
snapshot := stats.Snapshot()

//// 推荐写法

type Stats struct {
  mu sync.Mutex
  counters map[string]int
}

func (s *Stats) Snapshot() map[string]int {
  s.mu.Lock()
  defer s.mu.Unlock()
  // 这里重新定义一个变量，复制结果返回
  result := make(map[string]int, len(s.counters))
  for k, v := range s.counters {
    result[k] = v
  }
  return result
}
// snapshot 现在是一个拷贝
snapshot := stats.Snapshot()
```
