# Go读写操作

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

## 文件读写

**带缓冲的读取**

```go
func fileDemo1() {
	inputFile, inputError := os.Open("test.sh")

	if inputError != nil {
		fmt.Printf("Reader file test.sh failed! err: %v\n", inputError)
	}

	defer inputFile.Close()

	inputReader := bufio.NewReader(inputFile)

	for {
		inputString, readerError := inputReader.ReadString('\n')
		fmt.Printf("The input string is : %s", inputString)
		if readerError == io.EOF {
			return
		}
	}
}
```

变量 inputFile 是 *os.File 类型的。该类型是一个结构，表示一个打开文件的描述符（文件句柄）。然后，使用 os 包里的 Open 函数来打开一个文件。该函数的参数是文件名，类型为 string。在上面的程序中，我们以只读模式打开 `test.sh` 文件。

如果文件不存在或者程序没有足够的权限打开这个文件，Open函数会返回一个错误.

注意： 在之前的例子中，我们看到，Unix和Linux的行结束符是 `\n`，而Windows的行结束符是 `\r\n`。在使用 `ReadString` 和 `ReadBytes` 方法的时候，我们不需要关心操作系统的类型，直接使用 `\n` 就可以了。另外，我们也可以使用 `ReadLine()` 方法来实现相同的功能。

一旦读取到文件末尾，变量 `readerError` 的值将变成非空（事实上，其值为常量 `io.EOF`），我们就会执行 return 语句从而退出循环。

在很多情况下，文件的内容是不按行划分的，或者干脆就是一个二进制文件。在这种情况下，`ReadString()`就无法使用了，我们可以使用 `bufio.Reader` 的 `Read()`，它只接收一个参数：

```go
buf := make([]byte, 1024)
...
n, err := inputReader.Read(buf)
if (n == 0) { break}
```

变量 n 的值表示读取到的字节数.

**将整个文件的内容读到一个字符串里**

可以使用 `io/ioutil` 包里的 `ioutil.ReadFile()` 方法，该方法第一个返回值的类型是 `[]byte`，里面存放读取到的内容，第二个返回值是错误，如果没有错误发生，第二个返回值为 `nil`。函数 `WriteFile()` 可以将 `[]byte` 的值写入文件。

```go
func fileDemo2() {
	inputFile := "test.sh"
	outputFile := "test1.sh"

	buf, err := ioutil.ReadFile(inputFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "File error: %v\n", err)
	}

	fmt.Printf("%s\n", string(buf))

	err = ioutil.WriteFile(outputFile, buf, 0644)
	if err != nil {
		panic(err.Error())
	}
}
```

**按列读取文件中的数据**

如果数据是按列排列并用空格分隔的，你可以使用 `fmt` 包提供的以 `FScan` 开头的一系列函数来读取他们。请看以下程序，我们将 3 列的数据分别读入变量 `v1、v2 和 v3` 内，然后分别把他们添加到切片的尾部。

```go
func fileDemo3() {
	file, err := os.Open("products.txt")
	if err != nil {
		panic(err)
	}

	defer file.Close()

	var col1, col2, col3 []string

	for {
		var v1, v2, v3 string

		_, err := fmt.Fscanln(file, &v1, &v2, &v3)
		if err != nil {
			break
		}

		col1 = append(col1, v1)
		col2 = append(col2, v2)
		col3 = append(col3, v3)
	}

	fmt.Println(col1)
	fmt.Println(col2)
	fmt.Println(col3)
}
```

输出结果：

```bash
[ABC FUNC GO]
[40 56 45]
[150 280 356]
```

注意： `path` 包里包含一个子包叫 `filepath`，这个子包提供了跨平台的函数，用于处理文件名和路径。例如 `Base()` 函数用于获得路径中的最后一个元素（不包含后面的分隔符）：

```go
import "path/filepath"
filename := filepath.Base(path)
```

关于解析 CSV 文件，`encoding/csv` 包提供了相应的功能。

**压缩包读写**

`compress`包提供了读取压缩文件的功能，支持的压缩文件格式为：`bzip2、flate、gzip、lzw 和 zlib`。

下面的程序展示了如何读取一个 `gzip` 文件。

```go
package main

import (
	"fmt"
	"bufio"
	"os"
	"compress/gzip"
)

func main() {
	fName := "MyFile.gz"
	var r *bufio.Reader
	fi, err := os.Open(fName)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v, Can't open %s: error: %s\n", os.Args[0], fName,
			err)
		os.Exit(1)
	}
	defer fi.Close()
	fz, err := gzip.NewReader(fi)
	if err != nil {
		r = bufio.NewReader(fi)
	} else {
		r = bufio.NewReader(fz)
	}

	for {
		line, err := r.ReadString('\n')
		if err != nil {
			fmt.Println("Done reading file")
			os.Exit(0)
		}
		fmt.Println(line)
	}
}
```

**写文件**

请看以下程序：

```go
func fileDemo4() {
	outputFile, err := os.OpenFile("hello.txt", os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		fmt.Printf("Some error: %v\n", err)
		return
	}
	defer outputFile.Close()

	outputWriter := bufio.NewWriter(outputFile)
	outputString := "Hell go!\n"

	for i := 0; i < 10; i++ {
		outputWriter.WriteString(outputString)
	}

	outputWriter.Flush()
}
```

除了文件句柄，我们还需要 bufio 的 Writer。我们以只写模式打开文件`hello.txt`,如果文件不存在则自动创建：

可以看到，`OpenFile` 函数有三个参数：文件名、一个或多个标志（使用逻辑运算符`|`连接），使用的文件权限。

* `os.O_RDONLY`：只读
* `os.O_WRONLY`：只写
* `os.O_CREATE`：创建：如果指定文件不存在，就创建该文件。
* `os.O_TRUNC`：截断：如果指定文件已存在，就将该文件的长度截为0。

在`读文件`的时候，文件的权限是被忽略的，所以在使用 `OpenFile` 时传入的第三个参数可以用0。而在`写文件`时，不管是 Unix 还是 Windows，都需要使用 `0666`。

---

如果写入的东西很简单，我们可以使用 `fmt.Fprintf(outputFile, "Some test data.\n")` 直接将内容写入文件。fmt 包里的 `F` 开头的 Print 函数可以直接写入任何 `io.Writer`

也可以不使用缓冲区，直接将内容写入文件：`f.WriteString( )`

```go
func fileDemo5() {
	os.Stdout.WriteString("hello console!")
	outputFile, _ := os.OpenFile("hello2.txt", os.O_CREATE|os.O_WRONLY, 0666)
	defer outputFile.Close()
	outputFile.WriteString("string 222222\n")
	fmt.Fprintln(outputFile, "string fmt")
}
```
