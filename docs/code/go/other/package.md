# Go项目规范

## 应用项目结构

* go官方推荐

```bash
demo
├── cmd # 可执行文件目录，如果一个项目有多个可执行文件，可以放在不同的子目录中，如例子中的app1和app2目录。如果是当项目，直接不需要cmd文件夹，直接把main.go文件放在这里即可。
│   ├── app1
│   │   └── main.go
│   └── app2
│       └── main.go
├── go.mod
├── go.sum
├── internal # 项目内部私有代码，其他项目引入时会报错。
│   ├── pkga
│   │   └── pkg_a.go
│   └── pkgb
│       └── pkg_b.go
├── pkg1 # 存放项目的依赖代码,可以被其项目引入。注意，这里并不是说一定要pkg为前缀来命名，你可以对取任意符合包命名规范的名称，比如service,model等
│   └── pkg1.go
├── pkg2
│   └── pkg2.go
└── vendor # 存储项目的依赖包，但由于现今Go项目都是使用go module进行依赖管理，因此这个目录是可省略的。
└── docs # 说明文档
└── deploy # 部署文档

```

* 常规项目

app 目录下有 api、cmd、configs、internal 目录。一般还会放置 README、CHANGELOG、OWNERS。项目的依赖路径为：model -> dao -> service -> api，model struct 串联各个层，直到 api 做 DTO 对象转换。

```bash
|-- service
    |-- api             API 定义（protobuf 等）以及对应生成的 client 代码，基于 pb 生成的 swagger.json。
    |-- cmd
    |-- configs         服务配置文件，比如 database.yaml、redis.yaml、application.yaml。
    |-- internal        避免有同业务下被跨目录引用了内部的 model、dao 等内部 struct。
        |-- model       对应“存储层”的结构体，是对存储的一一映射。
        |-- dao         数据读写层，统一处理数据库和缓存（cache miss 等问题）。
        |-- service     组合各种数据访问来构建业务逻辑，包括 api 中生成的接口实现。
        |-- server      依赖 proto 定义的服务作为入参，提供快捷的启动服务全局方法。
|-- web
```

* DDD项目

```bash
.
|-- CHANGELOG
|-- OWNERS
|-- README
|-- api
|-- cmd
    |-- myapp1-admin
    |-- myapp1-interface
    |-- myapp1-job
    |-- myapp1-service
    +-- myapp1-task
|-- go.mod
|-- internal        避免有同业务下被跨目录引用了内部的 model、dao 等内部 struct。
    |-- biz         业务逻辑组装层，类似 DDD domain（repo 接口再次定义，依赖倒置）。
    |-- data        业务数据访问，包含 cache、db 等封装，实现 biz 的 repo 接口。
    |-- pkg
    +-- service     实现了 api 定义的服务层，类似 DDD application
    处理 DTO 到 biz 领域实体的转换（DTO->DO），同时协同各类 biz 交互，不处理复杂逻辑。
```

## 库项目结构

* go官方推荐

```bash
demo
├── go.mod
├── go.sum
├── internal
│   ├── pkga
│   │   └── pkg_a.go
│   └── pkgb
│       └── pkg_b.go
├── pkg1
│   └── pkg1.go
└── pkg2
    └── pkg2.go
│___examples # 示例
```

* 一般一个公司的所有基础库都应该归到一个仓库中，通过文件夹来区分不同的基础功能

```bash
|-- cache
    |-- memcache
    |   +-- test
    +-- redis
        +-- test
|-- conf
    |-- dsn 
    |-- env
    |-- flagvar
    +-- paladin
        +-- apollo
            +-- internal
                +-- mockserver
|-- container
    |-- group
    |-- pool
    +-- queue
        +-- apm
|-- database
    |-- hbase
    |-- sql
    +-- tidb
|-- ecode
    +-- types
|-- log
    +-- internal
        |-- core
        +-- filewriter
```

## 命名规范

* 项目名可以通过`中划线`来连接多个单词。

### 文件

* 文件名要简短有意义，应`小写`并使用`下划线`分割单词。
* 测试文件名必须以 `_test.go` 结尾


### 包

* 包名必须和目录名一致，尽量采取有意义、简短的包名，不要和标准库冲突。
* 包名全部`小写`，没有大写或下划线，使用多级目录来`划分层级`。
* 包名以及包所在的目录名，不要使用复数，比如 `net/utl` 而不是 `net/urls`。
* 不要用 `common`、`util`、`shared` 或者 `lib` 这类宽泛的、无意义的包名。
* 包名要简单明了，例如 `net`、`time`、`log`。
* 如果程序包名称与导入路径的最后一个元素不匹配，则必须使用导入别名。
    ```go
    import (
        "net/http"

        client "example.com/client-go"  
        trace "example.com/trace/v2" // 最后一个元素是v2
        nettrace "golang.net/x/trace" // 没有冲突，不使用别名
    )
    ```

### 函数

* 函数名采用驼峰式，首字母根据`访问控制`决定使用大写或小写，例如：`MixedCaps` 或者 `mixedCaps`。
* 测试用例函数必须以 `Test、Benchmark、Example`
    * 单元测试:测试代码功能是否正常，其函数名称必须以 `Test` 开头，参数为 `t *testing.T`
    * 基准测试:其函数名称必须以 `Benchmark` 开头，参数为 `t *testing.B`


### 结构体

* 采用驼峰命名方式，首字母根据访问控制决定使用大写或小写，例如 MixedCaps 或者 mixedCaps。
* 结构体名不应该是动词，应该是名词，比如 Node、NodeSpec。
* 避免使用 Data、Info 这类无意义的结构体名。
* 结构体的声明和初始化应采用多行：

```go
// User 多行声明
type User struct {
    Name  string
    Email string
}

// 多行初始化
u := User{
    UserName: "aa",
    Email:    "aa@bb.com",
}
```

### 接口

* 单个函数的接口名以 `er` 作为后缀（例如 Reader，Writer），有时候可能导致蹩脚的英文，但是没关系。
* 两个函数的接口名以两个函数名命名，例如 ReadWriter。
* 三个以上函数的接口名，类似于结构体名。

```go
type Seeker interface {
    Seek(offset int64, whence int) (int64, error)
}

// ReadWriter is the interface that groups the basic Read and Write methods.
type ReadWriter interface {
    Reader
    Writer
}
```

### 变量/常量

* `变量/常量`名必须遵循驼峰式，首字母根据访问控制决定使用大写或小写。
* 在相对简单（对象数量少、针对性强）的环境中，可以将一些名称由完整单词简写为单个字母，比如：user 可简写为 u；userID 可简写 uid。
* 对于私有特有名词为首个单词则使用小写（如 apiClient）。其他特有名词都应当使用该名词原有的写法，如 APIClient、repoID、UserID。
* 若变量类型为 bool 类型，则名称应以 `Has,Is,Can,Allow` 开头。
* 局部变量应当尽可能短小，比如使用 `buf` 指代 `buffer`，使用 `i` 指代 `index`。
* 对于未导出的全局(包内)`vars`和`consts`， 前面加上前缀`_`,错误类型的变量例外，错误类型变量应以`err`开头
    ```go
    // 包内变量
    const (
        _defaultPort = 8080
        _defaultUser = "user"
    )
    ```
* 相似声明放一组
    ```go
    // 常量
    const (
        a = 1
        b = 2
    )

    var (
        a = 1
        b = 2
    )

    type (
        Area float64
        Volume float64
    )
    // 将相关的声明放在一组
    type Operation int

    const (
        Add Operation = iota + 1
        Subtract
        Multiply
    )
    const EnvVar = "MY_ENV"
    ```

### Error

* `Error` 类型应该写成 `FooError` 的形式，比如 `type ExitError struct {}`。
* `Error` 变量写成 `ErrFoo` 的形式，比如 `var ErrFormat = errors.New("unknown format")`。

### 注释规范

* 每个可导出的名字都要有注释，该注释对导出的变量、函数、结构体、接口等进行简要介绍。
* 全部使用单行注释，禁止使用多行注释。
* 和代码的规范一样，单行注释不要过长，禁止超过 120 字符，超过的请使用换行展示，尽量保持格式优雅。
* 注释必须是完整的句子，以需要注释的内容作为开头，句点作为结尾，格式为 `// 名称 描述`。
    * 每个`包`都有且仅有一个包级别的注释，格式统一为 `// Package 包名 包描述`
    * 导出的`变量和常量`常量都必须有注释说明，格式为 `// 变量名 变量描述`
    * 导出的`结构体或者接口`都必须有注释，格式为 `// 结构体名 结构体描述`.
    * 导出的`函数或者方法`都必须有注释，格式为 `// 函数名 函数描述`
    * 每个需要导出的`类型定义和类型别名`都必须有注释说明，格式为 `// 类型名 类型描述`.

### 错误规范

```bash
无发生错误 +--- 开发调试时需要：Debug
          +--- 非开发调试时也需要：info
             
发生错误   +--- 基本无影响/影响暂时：Warn
          +--- 影响有限/只影响某次请求：Error
          |                       
          +--- 肯定会出现严重问题 ---+--- defer 处理后可运行：Panic
                                   +--- 完全无法运行：Fatal
```

## Go正常包导入

```go
import "包名"
```

## Go本地包导入

假设我们现在有`moduledemo`和`mypackage`两个包，其中moduledemo包中会导入mypackage包并使用它的New方法。

```go
package mypackage

import "fmt"

func New(){
    fmt.Println("mypackage.New")
}
```

### 在同一个项目下

* 注意：在一个项目（project）下我们是可以定义多个包（package）的。

项目目录结构如下：

```bash
moduledemo
├── go.mod # 注意mod文件位置
├── main.go
└── mypackage
    └── mypackage.go
```

这个时候，我们需要在moduledemo/go.mod中按如下定义：

```mod
module github.com/yasewang/moduledemo

go 1.16
```

然后在`moduledemo/main.go`中按如下方式导入mypackage

```go
package main

import (
    "fmt"
    "github.com/yasewang/moduledemo/mypackage"  // 导入同一项目下的mypackage包
)
func main() {
    mypackage.New()
    fmt.Println("main")
}
```

### 不在同一个项目下

**注意：** 这个时候如果使用vscode，就需要将不同项目分别用vscode打开，不然会报错，找不到包。

目录结构如下：

```bash
├── moduledemo
│   ├── go.mod
│   └── main.go
└── mypackage
    ├── go.mod
    └── mypackage.go
```

这个时候，`mypackage`也需要进行`module`初始化，即拥有一个属于自己的go.mod文件，内容如下：

```mod
module github.com/yasewang/mypackage

go 1.16
```

然后我们在`moduledemo/main.go`中按如下方式导入：

```go
import (
    "fmt"
    "github.com/yasewang/mypackage"
)
func main() {
    mypackage.New()
    fmt.Println("main")
}
```

因为这两个包不在同一个项目路径下，你想要导入本地包，并且这些包也没有发布到远程的github或其他代码仓库地址。这个时候我们就需要在go.mod文件中使用 `replace` 指令。

在调用方也就是`packagedemo/go.mod`中按如下方式指定使用相对路径来寻找`mypackage`这个包。

```mod
module moduledemo

go 1.16


require "github.com/yasewang/mypackage" v0.0.0
replace "github.com/yasewang/mypackage" => "../mypackage"
```

