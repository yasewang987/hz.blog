# 读取命令行参数

## os包

`os.Args[0]` 放的是程序本身的名字,下面例子输入 `go run main.go name1 name2 name3` 输出 `Hello name1,name2,name3`

```go
package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	whos := strings.Join(os.Args[1:], ",")
	fmt.Printf("Hello, %s", whos)
}
```

## flag包

flag 包有一个扩展功能用来解析命令行选项。但是通常被用来替换基本常量，例如，在某些情况下我们希望在命令行给常量一些不一样的值。

在 flag 包中有一个 Flag 被定义成一个含有如下字段的结构体：

```go
type Flag struct {
	Name     string // name as it appears on command line
	Usage    string // help message
	Value    Value  // value as set
	DefValue string // default value (as text); for usage message
}
```

一个简单的例子, 输入 `go run main.go -n arg1 arg2`, 输出 `arg1 \n arg2 \n`,如果不带 `-n` 参数则输出 `arg1 arg2`

```go
func flagDemo() {
	// 定义了一个默认值是 false 的 flag
    // flag.Int()，flag.Float64()，flag.String()
	var NewLine = flag.Bool("n", false, "print newline")
	const (
		Space   = " "
		Newline = "\n"
	)

	flag.PrintDefaults() // 打印参数说明 -n  print newline
	flag.Parse()         // 扫描参数列表（或者常量列表）并设置 flag，Parse() 之后 flag.Arg(i) 全部可用
	var s string = ""
	for i := 0; i < flag.NArg(); i++ { // 参数数量，第一个就是-n后面的参数
		if i > 0 {
			s += " "
			if *NewLine { // 如果参数里面带了 -n，则换行
				s += Newline
			}
		}
		s += flag.Arg(i)
	}
	os.Stdout.WriteString(s)
}
```

`flag.VisitAll(fn func(*Flag))` 是另一个有用的功能：按照字典顺序遍历 flag，并且对每个标签调用 fn

