# Go项目结构

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

