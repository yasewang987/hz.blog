# Go最佳实践

## defer

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

## 在初始化slice的时候尽量补全cap

方法2相较于方法1，就只有一个区别：在初始化`[]int slice`的时候在`make`中设置了`cap`的长度，就是`slice`的大小。

这两种方法对应的功能和输出结果是没有任何差别的，但是实际运行的时候，方法2会比少运行了一个`growslice`的命令。`growslice`的作用就是扩充`slice`的容量大小。就好比是原先我们没有定制容量，系统给了我们一个能装两个鞋子的盒子，但是当我们装到第三个鞋子的时候，这个盒子就不够了，我们就要换一个盒子，而换这个盒子，我们势必还需要将原先的盒子里面的鞋子也拿出来放到新的盒子里面。所以这个`growsslice`的操作是一个比较复杂的操作，它的表现和复杂度会高于最基本的初始化`make`方法。对追求性能的程序来说，应该能避免尽量避免。
```go
// 方法1
package main
import "fmt"
func main() {
	arr := []int{}
	arr = append(arr, 1,2,3,4, 5)
	fmt.Println(arr)
}

// 方法2
package main
import "fmt"
func main() {
   arr := make([]int, 0, 5)
   arr = append(arr, 1,2,3,4, 5)
   fmt.Println(arr)
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