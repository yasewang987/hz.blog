# Go Module包导入

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

