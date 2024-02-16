# Go项目规范

## 应用项目结构

* go官方推荐

```bash
### basic command
project-root-directory/
├── go.mod
└── main.go

或

project-root-directory/
├── go.mod
├── main.go
├── auth.go
├── auth_test.go
├── hash.go
└── hash_test.go

# 使用方式如下
go install github.com/someuser/modname@latest


### command with supporting packages
project-root-directory/
├── go.mod
├── main.go # 这里和库文件不同，必须是main.go才能编译为command
└── internal/
    ├── auth/
    │   ├── auth.go
    │   └── auth_test.go
    └── hash/
        ├── hash.go
        └── hash_test.go

### multiple commands
project-root-directory/
├── go.mod
├── prog1/
│   └── main.go
├── prog2/
│   └── main.go
└── internal/
    └── trace/
        ├── trace.go
        └── trace_test.go
# 编译命令如下
$go build github.com/someuser/modname/prog1
$go build github.com/someuser/modname/prog2
# 安装命令如下
$go install github.com/someuser/modname/prog1@latest
$go install github.com/someuser/modname/prog2@latest

### multiple packages and commands
project-root-directory/
├── go.mod
├── modname.go
├── modname_test.go
├── auth/
│   ├── auth.go
│   ├── auth_test.go
│   └── token/
│       ├── token.go
│       └── token_test.go
├── hash/
│   ├── hash.go
│   └── hash_test.go
├── internal/
│       └── trace/
│           ├── trace.go
│           └── trace_test.go
└── cmd/
    ├── prog1/
    │   └── main.go
    └── prog2/
        └── main.go
# 上面结构的项目导出如下包
github.com/user/modname
github.com/user/modname/auth
github.com/user/modname/hash
# 还包含两个命令
$go install github.com/someuser/modname/cmd/prog1@latest
$go install github.com/someuser/modname/cmd/prog2@latest
```

* 常规项目

```bash
/
├── cmd
│   └── myapp
│       └── main.go
├── pkg   # pkg目录包含项目中可以被外部应用使用的库代码
│   ├── api
│   │   └── handler.go
│   ├── config
│   │   └── config.go
│   └── service
│       └── service.go
├── internal # internal目录包含应用程序私有的代码
│   └── repository
│       └── repo.go
├── vendor # 当您使用模块以及包依赖度管理工具如go mod vendor时，所有的包依赖都会被复制到vendor目录中。这能保证在没有互联网的环境下也能构建项目。
├── go.mod
├── go.sum
└── README.md
```

* 大型项目

```bash
├── api  # 此目录包含定义API接口的文件，如Protocol Buffers定义文件或OpenAPI/Swagger规范
│   ├── proto
│   │   └── myapp.proto
│   └── swagger
│       └── myapp.yaml
├── cmd
│   └── myapp
│       └── main.go
├── configs # configs目录包含配置文件模板或默认配置
│   └── config.yaml
├── deployments # 包含部署相关的文件，如Docker、Kubernetes配置文件
│   └── docker-compose.yaml
├── internal
│   ├── handler
│   ├── service
│   └── repository
├── pkg
│   ├── util
│   └── logger
├── scripts # 用于存储为项目编写的实用脚本，比如数据库初始化脚本
│   └── initdb.sql
├── web # 用于存放前端相关的文件
│   ├── static
│   └── templates
├── go.mod
├── go.sum
└── README.md
```

## 库项目结构

* go官方推荐

```bash
### basic package
project-root-directory/
├── go.mod
├── modname.go
└── modname_test.go

或

project-root-directory/
├── go.mod
├── modname.go
├── modname_test.go
├── auth.go
├── auth_test.go
├── hash.go
└── hash_test.go
# 导入包的方式如下
import "github.com/someuser/modname"

### supporting packages
project-root-directory/
├── go.mod
├── modname.go
├── modname_test.go
└── internal/  # internal中的包是local的，不能导出到module之外，但module下的某些内部代码可以导入internal下的包。
    ├── auth/
    │   ├── auth.go
    │   └── auth_test.go
    └── hash/
        ├── hash.go
        └── hash_test.go

### multiple packages
project-root-directory/
├── go.mod
├── modname.go
├── modname_test.go
├── auth/
│   ├── auth.go
│   ├── auth_test.go
│   └── token/
│       ├── token.go
│       └── token_test.go
├── hash/
│   ├── hash.go
│   └── hash_test.go
└── internal/
    └── trace/
        ├── trace.go
        └── trace_test.go
# 可以导入如下包
github.com/user/modname
github.com/user/modname/auth
github.com/user/modname/hash
github.com/user/modname/auth/token
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

