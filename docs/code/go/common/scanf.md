# 格式化字符串

格式|描述
---|---
%v|按值的本来值输出
%+v|在 %v 基础上，对结构体字段名和值进行展开
%#v|输出 Go 语言语法格式的值
%T|输出 Go 语言语法格式的类型和值
%%|输出 % 本体
%b|整型以二进制方式显示
%o|整型以八进制方式显示
%d|整型以十进制方式显示
%x|整型以十六进制方式显示
%X|整型以十六进制、字母大写方式显示
%U|Unicode 字符
%f|浮点数
%p|指针，十六进制方式显示
%t|true或false
%c|该值对应的unicode码值
%e|科学计数法，如-1234.456e+78
%E|科学计数法，如-1234.456E+78
%g|根据实际情况采用%e或%f格式（以获得更简洁、准确的输出）
%G|根据实际情况采用%E或%F格式（以获得更简洁、准确的输出）


测试代码：
```go
package main

import (
    "fmt"
    "os"
)

type point struct {
    x, y int
}

func main() {

    p := point{1, 2}
    fmt.Printf("%v\n", p)

    fmt.Printf("%+v\n", p)

    fmt.Printf("%#v\n", p)

    fmt.Printf("%T\n", p)

    fmt.Printf("%t\n", true)

    fmt.Printf("%d\n", 123)

    fmt.Printf("%b\n", 14)

    fmt.Printf("%c\n", 33)

    fmt.Printf("%x\n", 456)

    fmt.Printf("%f\n", 78.9)

    fmt.Printf("%e\n", 123400000.0)
    fmt.Printf("%E\n", 123400000.0)

    fmt.Printf("%s\n", "\"string\"")

    fmt.Printf("%q\n", "\"string\"")

    fmt.Printf("%x\n", "hex this")

    fmt.Printf("%p\n", &p)

    fmt.Printf("|%6d|%6d|\n", 12, 345)

    fmt.Printf("|%6.2f|%6.2f|\n", 1.2, 3.45)

    fmt.Printf("|%-6.2f|%-6.2f|\n", 1.2, 3.45)

    fmt.Printf("|%6s|%6s|\n", "foo", "b")

    fmt.Printf("|%-6s|%-6s|\n", "foo", "b")

    s := fmt.Sprintf("a %s", "string")
    fmt.Println(s)

    fmt.Fprintf(os.Stderr, "an %s\n", "error")

    fmt.Printf("%c\n", 65)
}
```

输出结果：

```bash
{1 2}
{x:1 y:2}
main.point{x:1, y:2}
main.point
true
123
1110
!
1c8
78.900000
1.234000e+08
1.234000E+08
"string"
"\"string\""
6865782074686973
0xc0000b4010
|    12|   345|
|  1.20|  3.45|
|1.20  |3.45  |
|   foo|     b|
|foo   |b     |
a string
an error
A
```