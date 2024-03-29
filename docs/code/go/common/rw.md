# Go命令行操作

## 命令行读写

### scan

从键盘和标准输入 `os.Stdin` 读取输入，最简单的办法是使用 `fmt` 包提供的 `Scan` 和 `Sscan` 开头的函数。

```go
func scanDemo() {
	var (
		firstName, lastName, s string
		i                      int
		f                      float32
		input                  = "11.1 / 2222 / Go"
		format                 = "%f / %d / %s"
	)
	fmt.Println("Please input your full name:")
	fmt.Scanln(&firstName, &lastName)
	fmt.Printf("Hi, %s %s!\n", firstName, lastName)
	fmt.Sscanf(input, format, &f, &i, &s)
	fmt.Println("from the string we read: ", f, i, s)
}
```

`Scanln` 扫描来自标准输入的文本，将空格分隔的值依次存放到后续的参数内，直到碰到换行。`Scanf` 与其类似，除了 `Scanf` 的第一个参数用作格式字符串，用来决定如何读取。`Sscan` 和以 `Sscan` 开头的函数则是从字符串读取，除此之外，与 `Scanf` 相同。

### bufio

也可以使用 `bufio` 包提供的缓冲读取（`buffered reader`）来读取数据

```go
func bufioDemo() {
	inputReader := bufio.NewReader(os.Stdin)
	fmt.Println("Please input any string you want!")
	input, err := inputReader.ReadString('\n')
	if err == nil {
		fmt.Printf("The input was: %s\n", input)
	}
}
```

`inputReader` 是一个指向 `bufio.Reader` 的指针。`inputReader := bufio.NewReader(os.Stdin)` 这行代码，将会创建一个读取器，并将其与标准输入绑定。

`bufio.NewReader()` 构造函数的签名为：`func NewReader(rd io.Reader) *Reader`

该函数的实参可以是满足 `io.Reader` 接口的任意对象（任意包含有适当的 `Read()` 方法的对象），函数返回一个新的带缓冲的 `io.Reader` 对象，它将从指定读取器（例如 `os.Stdin`）读取内容。

返回的读取器对象提供一个方法 `ReadString(delim byte)`，该方法从输入中读取内容，直到碰到 `delim` 指定的字符，然后将读取到的内容连同 `delim` 字符一起放到缓冲区。

`ReadString` 返回读取到的字符串，如果没有碰到错误则返回 `nil`。如果它一直读到文件结束，则返回读取到的字符串和 `io.EOF`。如果读取过程中没有碰到 `delim` 字符，将返回错误 `err != nil`。

在上面的例子中，我们会读取键盘输入，直到回车键（`\n`）被按下。

屏幕是标准输出 `os.Stdout`；`os.Stderr` 用于显示错误信息，大多数情况下等同于 `os.Stdout`。

第二个例子从键盘读取输入，使用了 `switch` 语句：

```go
func bufioDemo2() {
	inputReader := bufio.NewReader(os.Stdin)
	fmt.Println("Please enter your name:")
	input, err := inputReader.ReadString('\n')
	if err != nil {
		fmt.Println("There were errors reading, exit program.")
	}

	fmt.Printf("Your name is %s", input)

	// v1
	switch input {
	case "zhangsan\n":
		fmt.Println("Welcome zhangsan")
	case "lisi\n":
		fmt.Println("Welcome lisi")
	default:
		fmt.Println("You are not welcome here!")
	}

	// v2
	switch input {
	case "zhangsan\n":
		fallthrough
	case "lisi\n":
		fmt.Printf("Welcome %s", input)
	default:
		fmt.Println("You are not welcome here!")
	}

	// v3
	switch input {
	case "zhangsan\n", "lisi\n":
		fmt.Printf("Welcome %s", input)
	default:
		fmt.Println("You are not welcome here!")
	}
}
```

## 读取命令行参数

### os包

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

### flag包

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
