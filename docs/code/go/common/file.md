# 文件操作

## 文件读取

不管是什么大小的文件，均不推荐整个文件加载的方式，因为它在小文件时的速度优势并没有那么大，相较于安全隐患，不值得选择它。

块读取是优先选择，尤其对于一些没有换行符的文件，例如音视频等。通过设定合适的块读取大小，能让速度和内存得到很好的平衡。且在读取过程中，往往伴随着处理内容的逻辑。每块内容可以赋给一个工作 goroutine 来处理，能更好地并发。

### 块读取

块读取也称为分片读取，这也很好理解，我们可以将内容分成一块块的，每次读取指定大小的块内容。这里，我们将块大小设置为 4KB。

```go
func ReadChunk(filename string) {
 f, err := os.Open(filename)
 if err != nil {
  panic(err)
 }
 defer f.Close()
 buf := make([]byte, 4*1024)
 r := bufio.NewReader(f)
 for {
  _, err = r.Read(buf)
  if err != nil {
   if err == io.EOF {
    break
   }
   panic(err)
  }
 }
}
```

### 逐行读取

在很多情况下，例如日志分析，对文件的处理都是按行进行的。Go 中 `bufio.Reader` 对象提供了一个 `ReadLine()` 方法，但其实我们更多地是使用 `ReadBytes('\n')` 或者 `ReadString('\n')` 代替。

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
		// inputString, readerError := inputReader.ReadLine()
		fmt.Printf("The input string is : %s", inputString)
		if readerError != nil {
			if readerError == io.EOF {
				break
			}
			panic(readerError)
		}
	}
}
```

变量 inputFile 是 `*os.File` 类型的。该类型是一个结构，表示一个打开文件的描述符（文件句柄）。然后，使用 os 包里的 `Open` 函数来打开一个文件。该函数的参数是文件名，类型为 string。在上面的程序中，我们以只读模式打开 `test.sh` 文件。

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

### 整个文件加载

一次性加载文件的优缺点非常明显，它能减少 IO 次数，但它会将文件内容都加载至内存中，对于大文件，存在内存撑爆的风险。

可以使用 `io/ioutil` 包里的 `ioutil.ReadFile()` 方法，该方法第一个返回值的类型是 `[]byte`，里面存放读取到的内容，第二个返回值是错误，如果没有错误发生，第二个返回值为 `nil`。函数 `WriteFile()` 可以将 `[]byte` 的值写入文件。

```go
func fileDemo2() {
	inputFile := "test.sh"
	outputFile := "test1.sh"
	// os.ReadFile('file')
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

### 按列读取文件中的数据

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

### 压缩包读写

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
## 写文件

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
### 创建不同大小的文件

```go
package main

import (
 "bufio"
 "math/rand"
 "os"
 "time"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

var seededRand = rand.New(rand.NewSource(time.Now().UnixNano()))

func StringWithCharset(length int) string {
 b := make([]byte, length)
 for i := range b {
  b[i] = charset[seededRand.Intn(len(charset))]
 }
 return string(b)
}

func main() {
 files := map[string]int{"4KB.txt": 4, "4MB.txt": 4096, "4GB.txt": 4194304, "16GB.txt": 16777216}
 for name, number := range files {
  file, err := os.OpenFile(name, os.O_WRONLY|os.O_CREATE, 0666)
  if err != nil {
   panic(err)
  }
  write := bufio.NewWriter(file)
  for i := 0; i < number; i++ {
   s := StringWithCharset(1023) + "\n"
   write.WriteString(s)
  }
  file.Close()
 }
}
```

## 文件拷贝

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	CopyFile("./target.txt", "./source.txt")
	fmt.Println("Copy Done!")
}

func CopyFile(src, dest string) (written int64, err error) {
	srcFile, err := os.Open(src)
	if err != nil {
		return
	}

	defer srcFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return
	}
	defer destFile.Close()

	return io.Copy(destFile, srcFile)
}

```

## 文件夹扫描

```go
// 获取文件列表
func QueryFiles(c *gin.Context) {
	files, err := os.ReadDir("./tar")
	if err != nil {
		c.JSON(200, ResponseModel{
			Message: "扫描文件目录出错，请确认文件是否存在",
		})
		return
	}
	fileNames := make([]string, 0)
	for _, file := range files {
		if file.IsDir() {
			continue
		}
	}
	c.JSON(200, ResponseModel{
		Code: 200,
		Data: fileNames,
	})
}
```

## 文件移除

```go
type removeFilesReq struct {
	FileNames []string `json:"fileNames"`
}

// 移除文件
func RemoveFiles(c *gin.Context) {
	var req removeFilesReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, ResponseModel{
			Message: REQ_ERROR_PARAMS,
		})
		return
	}

	for _, fileName := range req.FileNames {
		err = os.Remove("./tar/" + fileName)
		if err != nil {
			continue
		}
	}

	c.JSON(200, ResponseModel{
		Code: 200,
		Data: "删除成功",
	})
}
```